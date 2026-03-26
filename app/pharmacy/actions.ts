"use server";

import { EstadoDonacion, EstadoSolicitud, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { normalizeCodeInput } from "@/lib/delivery-codes";
import { getAuthenticatedPharmacy } from "@/app/pharmacy/data";

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

const solicitudLookupArgs = Prisma.validator<Prisma.SolicitudDefaultArgs>()({
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

const donacionLookupArgs = Prisma.validator<Prisma.DonacionDefaultArgs>()({
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

const pendingPickupArgs = Prisma.validator<Prisma.SolicitudDefaultArgs>()({
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
});

type LookupSolicitud = Prisma.SolicitudGetPayload<{
  include: typeof solicitudLookupArgs.include;
}> & {
  type: "SOLICITUD";
  validationRole: Exclude<ValidationRole, "DONATION">;
  enteredCode: string;
};

type LookupDonation = Prisma.DonacionGetPayload<{
  include: typeof donacionLookupArgs.include;
}> & {
  type: "DONACION";
  validationRole: "DONATION";
  enteredCode: string;
};

export type PharmacyLookupItem = LookupSolicitud | LookupDonation;
export type PendingPickupItem = Prisma.SolicitudGetPayload<{
  include: typeof pendingPickupArgs.include;
}>;

type LookupByValidationResult =
  | {
      success: true;
      data: PharmacyLookupItem;
    }
  | {
      success: false;
      error: string;
    };

type PendingPickupsResult =
  | {
      success: true;
      data: PendingPickupItem[];
    }
  | {
      success: false;
      error?: string;
      data: PendingPickupItem[];
    };

export async function lookupByValidationCode(
  input: string,
): Promise<LookupByValidationResult> {
  try {
    const pharmacy = await getAuthenticatedPharmacy();
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
      ...solicitudLookupArgs,
    });

    if (solicitud) {
      const assignedPharmacyId = solicitud.farmaciaEntregaId ?? solicitud.farmaciaId;

      if (!assignedPharmacyId) {
        return {
          success: false,
          error: "La solicitud no tiene una farmacia asignada",
        };
      }

      if (assignedPharmacyId !== pharmacy.id) {
        return {
          success: false,
          error: "El codigo no corresponde a esta farmacia",
        };
      }

      if (tokenPayload && tokenPayload.pharmacyId !== pharmacy.id) {
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
      ...donacionLookupArgs,
    });

    if (donacion) {
      if (donacion.farmaciaId && donacion.farmaciaId !== pharmacy.id) {
        return {
          success: false,
          error: "La donacion ya esta asignada a otra farmacia",
        };
      }

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

export async function getPendingPickups(
  farmaciaId: string,
): Promise<PendingPickupsResult> {
  try {
    const pharmacy = await getAuthenticatedPharmacy();

    if (farmaciaId && farmaciaId !== pharmacy.id) {
      return {
        success: false,
        error: "No autorizado para consultar esta farmacia",
        data: [] as PendingPickupItem[],
      };
    }

    const solicitudes = await prisma.solicitud.findMany({
      where: {
        farmaciaEntregaId: pharmacy.id,
        estado: "LISTA_PARA_RETIRO",
        pickupConfirmedAt: { not: null },
      },
      ...pendingPickupArgs,
      orderBy: {
        pickupConfirmedAt: "asc",
      },
    });

    return { success: true, data: solicitudes };
  } catch (error) {
    console.error("Error fetching pending pickups:", error);
    return {
      success: false,
      data: [] as PendingPickupItem[],
    };
  }
}

export async function updateStatus(
  id: string,
  type: "SOLICITUD" | "DONACION",
  newStatus: string,
  rejectionReason?: string,
) {
  try {
    const pharmacy = await getAuthenticatedPharmacy();

    if (type === "SOLICITUD") {
      const solicitud = await prisma.solicitud.findUnique({
        where: { id },
        select: {
          farmaciaId: true,
          farmaciaEntregaId: true,
          donanteAsignadoId: true,
          medicamentos: {
            include: { medicamento: { select: { nombre: true } } },
            take: 1,
          },
        },
      });

      if (!solicitud) {
        return { success: false, error: "Solicitud no encontrada" };
      }

      const assignedPharmacyId = solicitud.farmaciaEntregaId ?? solicitud.farmaciaId;

      if (!assignedPharmacyId) {
        return {
          success: false,
          error: "La solicitud no tiene una farmacia asignada",
        };
      }

      if (assignedPharmacyId !== pharmacy.id) {
        return {
          success: false,
          error: "Esta solicitud no corresponde a tu farmacia",
        };
      }

      const now = new Date();
      const data: Record<string, unknown> = {};
      const medicamentoNombre =
        solicitud.medicamentos[0]?.medicamento?.nombre || "medicamento";

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

      // Notificar al donante según el nuevo estado
      if (solicitud.donanteAsignadoId) {
        if (newStatus === "RECIBIDA") {
          await prisma.notificacion.create({
            data: {
              userId: solicitud.donanteAsignadoId,
              type: "SYSTEM",
              title: "Farmacia recibió el medicamento",
              message: `${pharmacy.nombre} confirmó la recepción de ${medicamentoNombre}. ¡Gracias por tu donación!`,
              link: "/dashboard/donations",
            },
          });
        } else if (newStatus === "LISTA_PARA_RETIRO") {
          await prisma.notificacion.create({
            data: {
              userId: solicitud.donanteAsignadoId,
              type: "SYSTEM",
              title: "Medicamento disponible para retiro",
              message: `${pharmacy.nombre} ha habilitado el retiro de ${medicamentoNombre}. El beneficiario ya puede recogerlo.`,
              link: "/dashboard/donations",
            },
          });
        }
      }
    } else {
      const donacion = await prisma.donacion.findUnique({
        where: { id },
        select: {
          farmaciaId: true,
        },
      });

      if (!donacion) {
        return { success: false, error: "Donacion no encontrada" };
      }

      if (donacion.farmaciaId && donacion.farmaciaId !== pharmacy.id) {
        return {
          success: false,
          error: "Esta donacion no corresponde a tu farmacia",
        };
      }

      await prisma.donacion.update({
        where: { id },
        data: {
          estado: newStatus as EstadoDonacion,
          farmaciaId: donacion.farmaciaId ?? pharmacy.id,
        },
      });
    }

    revalidatePath("/pharmacy");
    revalidatePath("/pharmacy/reception");
    revalidatePath("/pharmacy/inventory");
    revalidatePath("/pharmacy/requests");
    revalidatePath("/dashboard/requests");
    revalidatePath("/dashboard/donations");

    return { success: true };
  } catch (error) {
    console.error("Error updating status:", error);
    return { success: false, error: "No se pudo actualizar el estado" };
  }
}
