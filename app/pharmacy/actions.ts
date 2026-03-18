"use server";

import { EstadoDonacion, EstadoSolicitud } from "@prisma/client";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { normalizeCodeInput } from "@/lib/delivery-codes";

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
      return { success: false, error: "Ingresa un codigo valido" };
    }

    const solicitud = await prisma.solicitud.findFirst({
      where: {
        OR: [
          { codigo: code },
          { codigoComprobante: code },
          { codigoEntregaDonante: code },
          { codigoRetiroSolicitante: code },
        ],
      },
      include: {
        usuarioComun: {
          select: {
            nombre: true,
            email: true,
            telefono: true,
            cedula: true,
          },
        },
        donanteAsignado: {
          select: {
            nombre: true,
            email: true,
          },
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
          error: "El QR no corresponde a esta farmacia",
        };
      }

      let validationRole: ValidationRole = "LEGACY";

      if (tokenPayload) {
        validationRole = tokenPayload.role;
      } else if (code === solicitud.codigoEntregaDonante) {
        validationRole = "DONOR_DELIVERY";
      } else if (code === solicitud.codigoRetiroSolicitante) {
        validationRole = "REQUESTER_PICKUP";
      }

      return {
        success: true,
        data: {
          ...solicitud,
          type: "SOLICITUD" as const,
          validationRole,
          enteredCode: code,
        },
      };
    }

    const donacion = await prisma.donacion.findFirst({
      where: { codigo: code },
      include: {
        usuarioComun: {
          select: {
            nombre: true,
            email: true,
          },
        },
        farmacia: {
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

    if (donacion) {
      return {
        success: true,
        data: {
          ...donacion,
          type: "DONACION" as const,
          validationRole: "DONATION" as const,
          enteredCode: code,
        },
      };
    }

    return { success: false, error: "Codigo no encontrado" };
  } catch (error) {
    console.error("Error fetching code:", error);
    return { success: false, error: "Error al buscar el codigo" };
  }
}

export async function getPendingPickups(farmaciaId: string) {
  try {
    const solicitudes = await prisma.solicitud.findMany({
      where: {
        farmaciaEntregaId: farmaciaId,
        estado: "LISTA_PARA_RETIRO",
        pickupConfirmedAt: { not: null },
      },
      include: {
        usuarioComun: {
          select: {
            nombre: true,
            cedula: true,
          },
        },
        medicamentos: {
          include: {
            medicamento: {
              select: {
                nombre: true,
              },
            },
          },
        },
      },
      orderBy: {
        pickupConfirmedAt: "asc",
      },
    });

    return { success: true, data: solicitudes };
  } catch (error) {
    console.error("Error fetching pending pickups:", error);
    return { success: false, data: [] as Awaited<ReturnType<typeof prisma.solicitud.findMany>> };
  }
}

export async function updateStatus(
  id: string,
  type: "SOLICITUD" | "DONACION",
  newStatus: string,
  rejectionReason?: string,
) {
  try {
    if (type === "SOLICITUD") {
      const now = new Date();
      const data: any = {};

      if (newStatus === "RECHAZADA") {
        data.estado = EstadoSolicitud.APROBADA;
        data.donanteAsignadoId = null;
        data.assignedDate = null;
        data.farmaciaEntregaId = null;
        data.codigoComprobante = null;
        data.codigoEntregaDonante = null;
        data.codigoRetiroSolicitante = null;
        data.farmaciaConfirmada = null;
        data.motivoRechazoFarmacia = rejectionReason?.trim() || null;
        data.tipoRechazo = "FARMACIA";
        data.deliveryConfirmedAt = null;
        data.pickupConfirmedAt = null;
        data.receptionConfirmedAt = null;
        data.fechaRecepcionFarmacia = null;
        data.fechaListaRetiro = null;
        data.fechaLimiteRetiro = null;
        data.fechaRetiro = null;
      } else {
        data.estado = newStatus as EstadoSolicitud;

        if (newStatus === "RECIBIDA") {
          data.fechaRecepcionFarmacia = now;
        }

        if (newStatus === "LISTA_PARA_RETIRO") {
          data.fechaListaRetiro = now;
          data.fechaLimiteRetiro = addDays(now, RETRIEVAL_WINDOW_DAYS);
        }

        if (newStatus === "COMPLETADA") {
          data.fechaRetiro = now;
        }
      }

      await prisma.solicitud.update({
        where: { id },
        data,
      });
    } else {
      await prisma.donacion.update({
        where: { id },
        data: {
          estado: newStatus as EstadoDonacion,
        },
      });
    }

    revalidatePath("/pharmacy");
    revalidatePath("/pharmacy/reception");
    revalidatePath("/dashboard/requests");
    revalidatePath("/dashboard/donations");

    return { success: true };
  } catch (error) {
    console.error("Error updating status:", error);
    return { success: false, error: "No se pudo actualizar el estado" };
  }
}
