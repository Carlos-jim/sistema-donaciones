"use server";

import prisma from "@/lib/prisma";
import { normalizeCodeInput } from "@/lib/delivery-codes";
import { revalidatePath } from "next/cache";

const RETRIEVAL_WINDOW_DAYS = 7;

function addDays(date: Date, days: number) {
  const value = new Date(date);
  value.setDate(value.getDate() + days);
  return value;
}

type ValidationRole =
  | "DONOR_DELIVERY"
  | "REQUESTER_PICKUP"
  | "LEGACY"
  | "DONATION";

export async function lookupByValidationCode(input: string) {
  try {
    const { code, tokenPayload } = await normalizeCodeInput(input);

    if (!code) {
      return { success: false, error: "Debes ingresar un código o token" };
    }

    const solicitud = tokenPayload?.solicitudId
      ? await prisma.solicitud.findUnique({
          where: { id: tokenPayload.solicitudId },
          include: {
            usuarioComun: {
              select: { id: true, nombre: true, email: true },
            },
            donanteAsignado: {
              select: { id: true, nombre: true, email: true },
            },
            farmaciaEntrega: {
              select: {
                id: true,
                nombre: true,
                direccion: true,
              },
            },
            medicamentos: {
              include: {
                medicamento: true,
              },
            },
          },
        })
      : await prisma.solicitud.findFirst({
          where: {
            OR: [
              { codigoEntregaDonante: code },
              { codigoRetiroSolicitante: code },
              { codigoComprobante: code },
              { codigo: code },
            ],
          },
          include: {
            usuarioComun: {
              select: { id: true, nombre: true, email: true },
            },
            donanteAsignado: {
              select: { id: true, nombre: true, email: true },
            },
            farmaciaEntrega: {
              select: {
                id: true,
                nombre: true,
                direccion: true,
              },
            },
            medicamentos: {
              include: {
                medicamento: true,
              },
            },
          },
        });

    if (solicitud) {
      if (
        tokenPayload &&
        solicitud.farmaciaEntregaId &&
        tokenPayload.pharmacyId !== solicitud.farmaciaEntregaId
      ) {
        return {
          success: false,
          error: "Token QR inválido para esta solicitud",
        };
      }

      let validationRole: ValidationRole = "LEGACY";

      if (tokenPayload) {
        validationRole = tokenPayload.role;
      } else if (
        solicitud.codigoEntregaDonante &&
        code === solicitud.codigoEntregaDonante
      ) {
        validationRole = "DONOR_DELIVERY";
      } else if (
        solicitud.codigoRetiroSolicitante &&
        code === solicitud.codigoRetiroSolicitante
      ) {
        validationRole = "REQUESTER_PICKUP";
      }

      return {
        success: true,
        data: {
          type: "SOLICITUD" as const,
          validationRole,
          enteredCode: code,
          tokenPayload,
          ...solicitud,
        },
      };
    }

    const donacion = await prisma.donacion.findUnique({
      where: { codigo: code },
      include: {
        usuarioComun: {
          select: { id: true, nombre: true, email: true },
        },
        farmacia: {
          select: { id: true, nombre: true, direccion: true },
        },
        medicamentos: {
          include: {
            medicamento: true,
          },
        },
      },
    });

    if (donacion) {
      return {
        success: true,
        data: {
          type: "DONACION" as const,
          validationRole: "DONATION" as const,
          enteredCode: code,
          ...donacion,
        },
      };
    }

    return { success: false, error: "Código no encontrado" };
  } catch (error) {
    console.error("Error fetching code:", error);
    return { success: false, error: "Error al buscar el código" };
  }
}

export async function markDonorReceived(solicitudId: string) {
  try {
    const solicitud = await prisma.solicitud.findUnique({
      where: { id: solicitudId },
      select: {
        id: true,
        estado: true,
        usuarioComunId: true,
      },
    });

    if (!solicitud) {
      return { success: false, error: "Solicitud no encontrada" };
    }

    if (!["EN_PROCESO", "APROBADA"].includes(solicitud.estado)) {
      return {
        success: false,
        error: "El estado actual no permite confirmar recepción del donante",
      };
    }

    await prisma.solicitud.update({
      where: { id: solicitudId },
      data: {
        estado: "RECIBIDA",
        fechaRecepcionFarmacia: new Date(),
      },
    });

    revalidatePath("/pharmacy");
    return { success: true };
  } catch (error) {
    console.error("Error marking donor received:", error);
    return { success: false, error: "Error al actualizar la solicitud" };
  }
}

export async function markReadyForPickup(solicitudId: string) {
  try {
    const now = new Date();
    const solicitud = await prisma.solicitud.findUnique({
      where: { id: solicitudId },
      select: {
        id: true,
        estado: true,
        usuarioComunId: true,
        codigoRetiroSolicitante: true,
      },
    });

    if (!solicitud) {
      return { success: false, error: "Solicitud no encontrada" };
    }

    if (solicitud.estado !== "RECIBIDA") {
      return {
        success: false,
        error: "La solicitud debe estar en estado RECIBIDA",
      };
    }

    const fechaLimiteRetiro = addDays(now, RETRIEVAL_WINDOW_DAYS);

    await prisma.$transaction(async (tx) => {
      await tx.solicitud.update({
        where: { id: solicitudId },
        data: {
          estado: "LISTA_PARA_RETIRO",
          fechaListaRetiro: now,
          fechaLimiteRetiro,
        },
      });

      await tx.notificacion.create({
        data: {
          userId: solicitud.usuarioComunId,
          type: "SYSTEM",
          title: "Tu medicamento está listo para retiro",
          message: `Presenta tu código ${solicitud.codigoRetiroSolicitante ?? "RET-..."} en farmacia. Límite: ${fechaLimiteRetiro.toLocaleDateString("es-ES")}.`,
          link: "/dashboard/requests",
        },
      });
    });

    revalidatePath("/pharmacy");
    return { success: true };
  } catch (error) {
    console.error("Error marking ready for pickup:", error);
    return { success: false, error: "Error al actualizar la solicitud" };
  }
}

export async function rejectByPharmacy(solicitudId: string, reason: string) {
  try {
    const cleanReason = reason.trim();
    if (!cleanReason) {
      return {
        success: false,
        error: "Debes indicar el motivo del rechazo sanitario",
      };
    }

    const solicitud = await prisma.solicitud.findUnique({
      where: { id: solicitudId },
      select: {
        id: true,
        estado: true,
        usuarioComunId: true,
        donanteAsignadoId: true,
      },
    });

    if (!solicitud) {
      return { success: false, error: "Solicitud no encontrada" };
    }

    if (!["RECIBIDA", "EN_PROCESO", "APROBADA"].includes(solicitud.estado)) {
      return {
        success: false,
        error: "El estado actual no permite rechazo sanitario",
      };
    }

    await prisma.$transaction(async (tx) => {
      await tx.solicitud.update({
        where: { id: solicitudId },
        data: {
          estado: "RECHAZADA",
          tipoRechazo: "FARMACIA",
          motivoRechazoFarmacia: cleanReason,
        },
      });

      await tx.notificacion.create({
        data: {
          userId: solicitud.usuarioComunId,
          type: "SYSTEM",
          title: "Solicitud rechazada en farmacia",
          message:
            "La farmacia rechazó el medicamento por validación sanitaria. El caso fue cerrado.",
          link: "/dashboard/requests",
        },
      });

      if (solicitud.donanteAsignadoId) {
        await tx.notificacion.create({
          data: {
            userId: solicitud.donanteAsignadoId,
            type: "SYSTEM",
            title: "Entrega rechazada en farmacia",
            message: `Motivo reportado por farmacia: ${cleanReason}`,
            link: "/dashboard/donations",
          },
        });
      }
    });

    revalidatePath("/pharmacy");
    return { success: true };
  } catch (error) {
    console.error("Error rejecting request in pharmacy:", error);
    return { success: false, error: "Error al rechazar la solicitud" };
  }
}

export async function confirmRequesterPickup(solicitudId: string) {
  try {
    const now = new Date();
    const solicitud = await prisma.solicitud.findUnique({
      where: { id: solicitudId },
      select: {
        id: true,
        estado: true,
        donanteAsignadoId: true,
        usuarioComunId: true,
      },
    });

    if (!solicitud) {
      return { success: false, error: "Solicitud no encontrada" };
    }

    if (solicitud.estado !== "LISTA_PARA_RETIRO") {
      return {
        success: false,
        error: "La solicitud no está lista para retiro",
      };
    }

    await prisma.$transaction(async (tx) => {
      await tx.solicitud.update({
        where: { id: solicitudId },
        data: {
          estado: "COMPLETADA",
          fechaRetiro: now,
        },
      });

      if (solicitud.donanteAsignadoId) {
        await tx.notificacion.create({
          data: {
            userId: solicitud.donanteAsignadoId,
            type: "SYSTEM",
            title: "Entrega completada",
            message: "El beneficiario retiró el medicamento en farmacia.",
            link: "/dashboard/donations",
          },
        });
      }
    });

    revalidatePath("/pharmacy");
    return { success: true };
  } catch (error) {
    console.error("Error confirming requester pickup:", error);
    return { success: false, error: "Error al confirmar el retiro" };
  }
}

export async function markDonationReceived(donacionId: string) {
  try {
    const donacion = await prisma.donacion.findUnique({
      where: { id: donacionId },
      select: { id: true, estado: true },
    });

    if (!donacion) {
      return { success: false, error: "Donación no encontrada" };
    }

    if (!["DISPONIBLE", "RESERVADA"].includes(donacion.estado)) {
      return {
        success: false,
        error: "La donación no puede recibirse en el estado actual",
      };
    }

    await prisma.donacion.update({
      where: { id: donacionId },
      data: { estado: "RECIBIDA" },
    });

    revalidatePath("/pharmacy");
    return { success: true };
  } catch (error) {
    console.error("Error updating donation state:", error);
    return { success: false, error: "Error al actualizar la donación" };
  }
}
