import prisma from "@/lib/prisma";
import {
  generateReadableCode,
  getReadableQrPayload,
} from "@/lib/delivery-codes";

type AcceptRequestInput = {
  requestId: string;
  donorUserId: string;
  pharmacyId: string;
  requestMedicationId?: string;
  quantity?: number;
};

type AcceptRequestResult = {
  requestId: string;
  acceptedQuantity: number;
  donorCode: string;
  requesterCode: string;
  donorQrPayload: string;
  requesterQrPayload: string;
  farmacia: {
    id: string;
    nombre: string;
    direccion: string;
  };
};

async function generateUniqueSolicitudCode(prefix: "DON" | "RET") {
  let attempts = 0;
  while (attempts < 15) {
    const candidate = generateReadableCode(prefix);
    const existing = await prisma.solicitud.findFirst({
      where: {
        OR: [
          { codigoEntregaDonante: candidate },
          { codigoRetiroSolicitante: candidate },
          { codigoComprobante: candidate },
          { codigo: candidate },
        ],
      },
      select: { id: true },
    });

    if (!existing) return candidate;
    attempts += 1;
  }

  throw new Error("No se pudo generar un código único");
}

export async function acceptRequestWithDeliveryCodes(
  input: AcceptRequestInput,
): Promise<AcceptRequestResult> {
  const { requestId, donorUserId, pharmacyId, requestMedicationId, quantity } =
    input;

  const solicitud = await prisma.solicitud.findUnique({
    where: { id: requestId },
    include: {
      usuarioComun: {
        select: { nombre: true, email: true },
      },
      medicamentos: {
        include: {
          medicamento: {
            select: { nombre: true },
          },
          donacionMedicamento: {
            select: {
              donacion: {
                select: {
                  usuarioComunId: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!solicitud) {
    throw new Error("Solicitud no encontrada");
  }

  if (solicitud.estado !== "APROBADA") {
    throw new Error("Solo se pueden aceptar solicitudes aprobadas");
  }

  const requestedMedication = requestMedicationId
    ? solicitud.medicamentos.find((medication) => medication.id === requestMedicationId)
    : solicitud.medicamentos[0];

  if (!requestedMedication) {
    throw new Error("El insumo médico solicitado no pertenece a esta solicitud");
  }

  const acceptedQuantity = quantity ?? requestedMedication.cantidad;

  if (!Number.isInteger(acceptedQuantity) || acceptedQuantity < 1) {
    throw new Error("La cantidad a donar debe ser un número entero mayor a cero");
  }

  if (acceptedQuantity > requestedMedication.cantidad) {
    throw new Error("La cantidad indicada ya no está disponible en esta solicitud");
  }

  if (
    requestedMedication.donacionMedicamentoId &&
    acceptedQuantity !== requestedMedication.cantidad
  ) {
    throw new Error("Esta entrega ya tiene una cantidad reservada");
  }

  if (
    solicitud.donanteAsignadoId &&
    solicitud.donanteAsignadoId !== donorUserId
  ) {
    throw new Error("Esta solicitud ya ha sido asignada a otro donante");
  }

  const reservedDonationOwnerId =
    requestedMedication.donacionMedicamento?.donacion.usuarioComunId;

  if (
    reservedDonationOwnerId &&
    reservedDonationOwnerId !== donorUserId
  ) {
    throw new Error("Esta solicitud ya ha sido asignada a otro donante");
  }

  if (solicitud.usuarioComunId === donorUserId) {
    throw new Error("No puedes aceptar tu propia solicitud");
  }

  const farmacia = await prisma.farmacia.findUnique({
    where: { id: pharmacyId },
    select: { id: true, nombre: true, direccion: true },
  });

  if (!farmacia) {
    throw new Error("Farmacia no encontrada");
  }

  const donorCode = await generateUniqueSolicitudCode("DON");
  const requesterCode = await generateUniqueSolicitudCode("RET");
  const deliveryData = {
    estado: "EN_PROCESO" as const,
    donanteAsignadoId: donorUserId,
    assignedDate: new Date(),
    farmaciaEntregaId: pharmacyId,
    codigoComprobante: donorCode,
    codigoEntregaDonante: donorCode,
    codigoRetiroSolicitante: requesterCode,
    tipoRechazo: null,
    motivoRechazoFarmacia: null,
  };

  let deliveryRequestId = requestId;

  if (acceptedQuantity === requestedMedication.cantidad) {
    await prisma.solicitud.update({
      where: { id: requestId },
      data: deliveryData,
    });
  } else {
    deliveryRequestId = await prisma.$transaction(async (tx) => {
      const decrementResult = await tx.solicitudMedicamento.updateMany({
        where: {
          id: requestedMedication.id,
          cantidad: { gt: acceptedQuantity },
          solicitud: {
            is: {
              estado: "APROBADA",
              donanteAsignadoId: null,
            },
          },
        },
        data: {
          cantidad: { decrement: acceptedQuantity },
        },
      });

      if (decrementResult.count !== 1) {
        throw new Error("La cantidad indicada ya no está disponible en esta solicitud");
      }

      const deliveryRequest = await tx.solicitud.create({
        data: {
          motivo: solicitud.motivo,
          estado: deliveryData.estado,
          tiempoEspera: solicitud.tiempoEspera,
          direccion: solicitud.direccion,
          requiresPrescription: solicitud.requiresPrescription,
          recipePhotoUrl: solicitud.recipePhotoUrl,
          usuarioComunId: solicitud.usuarioComunId,
          aprobadoPorId: solicitud.aprobadoPorId,
          aprobadoPorEnteId: solicitud.aprobadoPorEnteId,
          approvalDate: solicitud.approvalDate,
          approvalInstitution: solicitud.approvalInstitution,
          ...deliveryData,
        },
      });

      await tx.solicitudMedicamento.create({
        data: {
          solicitudId: deliveryRequest.id,
          medicamentoId: requestedMedication.medicamentoId,
          cantidad: acceptedQuantity,
          prioridad: requestedMedication.prioridad,
        },
      });

      return deliveryRequest.id;
    });
  }

  const medicamentoNombre =
    requestedMedication.medicamento?.nombre || "insumo médico";

  await prisma.notificacion.create({
    data: {
      userId: solicitud.usuarioComunId,
      type: "MATCH_DONATION",
      title: "¡Donante encontrado!",
      message: `Un donante aceptó ${acceptedQuantity} unidad(es) de ${medicamentoNombre}. Retira en ${farmacia.nombre} con código ${requesterCode}.`,
      link: "/dashboard/requests",
    },
  });

  await prisma.notificacion.create({
    data: {
      userId: donorUserId,
      type: "SYSTEM",
      title: "¡Te comprometiste a donar!",
      message: `Has aceptado donar ${acceptedQuantity} unidad(es) de ${medicamentoNombre}. Lleva el insumo médico a ${farmacia.nombre} y presenta el código ${donorCode}.`,
      link: "/dashboard/donations",
    },
  });

  const donorQrPayload = getReadableQrPayload(donorCode);
  const requesterQrPayload = getReadableQrPayload(requesterCode);

  return {
    requestId: deliveryRequestId,
    acceptedQuantity,
    donorCode,
    requesterCode,
    donorQrPayload,
    requesterQrPayload,
    farmacia: {
      id: farmacia.id,
      nombre: farmacia.nombre,
      direccion: farmacia.direccion,
    },
  };
}
