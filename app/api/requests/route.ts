import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { tokenService } from "@/lib/auth/token.service";
import { getReadableQrPayload } from "@/lib/delivery-codes";
import { processAbandonedPickups } from "@/lib/abandoned-pickups.service";
import {
  reserveDonationStock,
  STOCK_UNAVAILABLE_ERROR,
} from "@/lib/donation-stock.service";

const OWN_DONATION_REQUEST_ERROR =
  "No puedes solicitar medicamentos de tu propia donación";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      motivo,
      medicamentos,
      ubicacion,
      requiereReceta,
      tiempoEspera,
      recipePhotoUrl,
    } = body;

    const token = (await cookies()).get("auth-token")?.value;

    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const payload = await tokenService.verify(token);

    if (!payload || !payload.userId) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    // Assign to the verified user
    const userId = payload.userId;

    const requestedMedicamentos = Array.isArray(medicamentos)
      ? medicamentos.map((med) => ({
          ...med,
          nombre: typeof med.nombre === "string" ? med.nombre.trim() : "",
        }))
      : [];

    if (
      requestedMedicamentos.length === 0 ||
      requestedMedicamentos.some((med) => !med.nombre)
    ) {
      return NextResponse.json(
        { error: "Debes indicar al menos un insumo médico" },
        { status: 400 },
      );
    }

    if (
      requestedMedicamentos.some(
        (med) =>
          typeof med.cantidad !== "number" ||
          !Number.isInteger(med.cantidad) ||
          med.cantidad < 1,
      )
    ) {
      return NextResponse.json(
        { error: "La cantidad de cada insumo debe ser un número entero mayor a cero" },
        { status: 400 },
      );
    }

    const donationMedicationLines = requestedMedicamentos.filter(
      (med) => med.donacionMedicamentoId,
    );

    if (
      donationMedicationLines.length > 0 &&
      (requestedMedicamentos.length !== 1 || donationMedicationLines.length !== 1)
    ) {
      return NextResponse.json(
        { error: "Una solicitud vinculada a una donación debe contener un solo insumo" },
        { status: 400 },
      );
    }

    // Generate a unique code
    const generateCode = () => {
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      let code = "";
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return code;
    };

    let codigo = generateCode();
    // Simple retry logic unique check (optional but recommended)
    // For MVP/Demo scale, probability is low, but let's be safe-ish or just assume unique for now.
    // If collision, Prisma will throw, so we could wrap in loop, but let's keep it simple.

    // Create or find medicamentos before creating the request.
    const resolvedMedicamentos: Array<{
      medicamentoId: string;
      cantidad: number;
      donacionMedicamentoId?: string;
    }> = [];

    for (const med of requestedMedicamentos) {
      // Find or create the medicamento
      let medicamento = null;

      if (med.medicamentoId) {
        medicamento = await prisma.medicamento.findUnique({
          where: { id: med.medicamentoId },
        });
      }

      if (!medicamento) {
        medicamento = await prisma.medicamento.findFirst({
          where: {
            nombre: {
              equals: med.nombre,
              mode: "insensitive",
            },
            activo: true,
          },
        });
      }

      if (!medicamento) {
        medicamento = await prisma.medicamento.create({
          data: {
            nombre: med.nombre,
            presentacion: med.unidad,
          },
        });
      }

      resolvedMedicamentos.push({
        medicamentoId: medicamento.id,
        cantidad: med.cantidad,
        donacionMedicamentoId: med.donacionMedicamentoId,
      });
    }

    const solicitudData = {
      codigo,
      motivo: motivo || null,
      estado: "PENDIENTE" as const,
      direccion: ubicacion
        ? {
            calle: ubicacion.address || "Ubicación seleccionada en mapa",
            lat: ubicacion.lat,
            long: ubicacion.lng,
          }
        : Prisma.JsonNull,
      requiresPrescription: requiereReceta || false,
      recipePhotoUrl: recipePhotoUrl || null,
      tiempoEspera: tiempoEspera || "BAJO",
      usuarioComunId: userId,
    };

    let solicitud;
    let assignedDonorId: string | null = null;

    if (donationMedicationLines.length === 1) {
      const sourceMedication = resolvedMedicamentos[0];

      try {
        solicitud = await prisma.$transaction(async (tx) => {
          const donationMedication = await reserveDonationStock(
            tx,
            sourceMedication.donacionMedicamentoId!,
            sourceMedication.cantidad,
          );

          if (donationMedication.medicamentoId !== sourceMedication.medicamentoId) {
            throw new Error(STOCK_UNAVAILABLE_ERROR);
          }

          assignedDonorId = donationMedication.donacion.usuarioComunId;

          if (assignedDonorId === userId) {
            throw new Error(OWN_DONATION_REQUEST_ERROR);
          }

          const createdSolicitud = await tx.solicitud.create({
            data: {
              ...solicitudData,
              donanteAsignadoId: assignedDonorId,
              assignedDate: assignedDonorId ? new Date() : null,
            },
          });

          await tx.solicitudMedicamento.create({
            data: {
              solicitudId: createdSolicitud.id,
              medicamentoId: sourceMedication.medicamentoId,
              cantidad: sourceMedication.cantidad,
              prioridad: 1,
              donacionMedicamentoId: sourceMedication.donacionMedicamentoId,
              reservaActiva: true,
            },
          });

          return createdSolicitud;
        });
      } catch (error) {
        if (error instanceof Error && error.message === STOCK_UNAVAILABLE_ERROR) {
          return NextResponse.json({ error: error.message }, { status: 409 });
        }
        if (
          error instanceof Error &&
          error.message === OWN_DONATION_REQUEST_ERROR
        ) {
          return NextResponse.json({ error: error.message }, { status: 400 });
        }
        throw error;
      }

      if (assignedDonorId) {
        try {
          await prisma.notificacion.create({
            data: {
              userId: assignedDonorId,
              type: "MATCH_DONATION",
              title: "Reservaron parte de tu donación",
              message: `Se reservaron ${sourceMedication.cantidad} unidad(es) de tu oferta. La entrega aparecerá en Mis Donaciones mientras el ente de salud revisa la solicitud.`,
              link: "/dashboard/donations",
            },
          });
        } catch (notificationError) {
          console.error(
            "No se pudo notificar al donante de la reserva:",
            notificationError,
          );
        }
      }
    } else {
      // Toda solicitud debe ser revisada por un ente de salud antes de estar disponible.
      solicitud = await prisma.solicitud.create({ data: solicitudData });

      for (const med of resolvedMedicamentos) {
        await prisma.solicitudMedicamento.create({
          data: {
            solicitudId: solicitud.id,
            medicamentoId: med.medicamentoId,
            cantidad: med.cantidad,
            prioridad: 1,
          },
        });
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: "Solicitud enviada para aprobación del ente de salud",
        solicitudId: solicitud.id,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating solicitud:", error);
    return NextResponse.json(
      { error: "Error al crear la solicitud" },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    try {
      await processAbandonedPickups(new Date());
    } catch (maintenanceError) {
      console.error(
        "Background abandoned pickup processing failed:",
        maintenanceError,
      );
    }

    const token = (await cookies()).get("auth-token")?.value;

    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const payload = await tokenService.verify(token);

    if (!payload || !payload.userId) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    const solicitudes = await prisma.solicitud.findMany({
      where: {
        usuarioComunId: payload.userId,
      },
      include: {
        usuarioComun: {
          select: {
            nombre: true,
            email: true,
          },
        },
        medicamentos: {
          include: {
            medicamento: true,
          },
        },
        farmaciaEntrega: {
          select: {
            id: true,
            nombre: true,
            direccion: true,
            telefono: true,
          },
        },
        donanteAsignado: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const enriched = solicitudes.map((solicitud) => ({
      ...solicitud,
      requesterQrPayload:
        solicitud.codigoRetiroSolicitante &&
        solicitud.estado === "LISTA_PARA_RETIRO"
          ? getReadableQrPayload(solicitud.codigoRetiroSolicitante)
          : null,
    }));

    return NextResponse.json(enriched);
  } catch (error) {
    console.error("Error fetching solicitudes:", error);
    return NextResponse.json(
      { error: "Error al obtener las solicitudes" },
      { status: 500 },
    );
  }
}
