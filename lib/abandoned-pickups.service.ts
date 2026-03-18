import prisma from "@/lib/prisma";

const ABANDON_DAYS = 7;

type ProcessSummary = {
  scanned: number;
  converted: number;
  alreadyConverted: number;
};

function resolveDonationAddress(
  solicitud: {
    direccion: unknown;
    farmaciaEntrega: {
      direccion: string;
      latitude: number | null;
      longitude: number | null;
    } | null;
  },
) {
  if (solicitud.farmaciaEntrega) {
    return {
      calle: solicitud.farmaciaEntrega.direccion,
      lat: solicitud.farmaciaEntrega.latitude ?? 0,
      long: solicitud.farmaciaEntrega.longitude ?? 0,
    };
  }

  if (solicitud.direccion && typeof solicitud.direccion === "object") {
    return solicitud.direccion;
  }

  return null;
}

export async function processAbandonedPickups(now = new Date()) {
  const overdueRequests = await prisma.solicitud.findMany({
    where: {
      estado: "LISTA_PARA_RETIRO",
      fechaLimiteRetiro: {
        lte: now,
      },
    },
    include: {
      donacionPorAbandono: {
        select: { id: true },
      },
      farmaciaEntrega: {
        select: {
          id: true,
          nombre: true,
          direccion: true,
          latitude: true,
          longitude: true,
        },
      },
      medicamentos: {
        include: {
          medicamento: true,
        },
      },
      usuarioComun: {
        select: {
          nombre: true,
        },
      },
      donanteAsignado: {
        select: {
          nombre: true,
        },
      },
    },
  });

  const summary: ProcessSummary = {
    scanned: overdueRequests.length,
    converted: 0,
    alreadyConverted: 0,
  };

  for (const request of overdueRequests) {
    if (request.donacionPorAbandono) {
      summary.alreadyConverted += 1;

      if (request.estado !== "ABANDONADA") {
        await prisma.solicitud.update({
          where: { id: request.id },
          data: { estado: "ABANDONADA" },
        });
      }
      continue;
    }

    await prisma.$transaction(async (tx) => {
      const createdDonation = await tx.donacion.create({
        data: {
          codigo: null,
          descripcion: `Donación flotante generada por no retiro de solicitud ${request.codigo ?? request.id}.`,
          estado: "DISPONIBLE",
          origen: "ABANDONO_RETIRO",
          direccion: resolveDonationAddress(request),
          farmaciaId: request.farmaciaEntregaId ?? null,
          solicitudOrigenId: request.id,
        },
      });

      for (const med of request.medicamentos) {
        await tx.donacionMedicamento.create({
          data: {
            donacionId: createdDonation.id,
            medicamentoId: med.medicamentoId,
            cantidad: med.cantidad,
            fechaExpiracion: null,
          },
        });
      }

      await tx.solicitud.update({
        where: { id: request.id },
        data: {
          estado: "ABANDONADA",
        },
      });

      await tx.notificacion.create({
        data: {
          userId: request.usuarioComunId,
          type: "SYSTEM",
          title: "Solicitud cerrada por no retiro",
          message:
            "Tu solicitud no fue retirada a tiempo. El medicamento pasó a inventario disponible para otros usuarios.",
          link: "/dashboard/requests",
        },
      });

      if (request.donanteAsignadoId) {
        await tx.notificacion.create({
          data: {
            userId: request.donanteAsignadoId,
            type: "SYSTEM",
            title: "Donación convertida en disponibilidad pública",
            message:
              "El beneficiario no retiró a tiempo. La farmacia liberó el medicamento como donación flotante.",
            link: "/dashboard/donations",
          },
        });
      }
    });

    summary.converted += 1;
  }

  return {
    ...summary,
    abandonDays: ABANDON_DAYS,
  };
}
