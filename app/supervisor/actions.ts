"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { getSessionForRole } from "@/lib/auth/server-session";

async function getAuthenticatedSupervisor() {
  const session = await getSessionForRole("SUPERVISOR");

  if (!session) {
    throw new Error("No autorizado");
  }

  const ente = await prisma.enteSalud.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      nombre: true,
      aprobado: true,
    },
  });

  if (!ente || !ente.aprobado) {
    throw new Error("Supervisor no autorizado");
  }

  return ente;
}

async function getManageableRequestOrThrow(requestId: string) {
  const request = await prisma.solicitud.findUnique({
    where: { id: requestId },
    select: {
      id: true,
      estado: true,
      donanteAsignadoId: true,
    },
  });

  if (!request) {
    throw new Error("Solicitud no encontrada");
  }

  return request;
}

export async function getSupervisorRequests() {
  await getAuthenticatedSupervisor();

  return prisma.solicitud.findMany({
    where: {
      estado: {
        in: ["PENDIENTE", "APROBADA", "RECHAZADA"],
      },
    },
    select: {
      id: true,
      createdAt: true,
      updatedAt: true,
      estado: true,
      recipePhotoUrl: true,
      motivo: true,
      tiempoEspera: true,
      rejectionReason: true,
      approvalDate: true,
      approvalInstitution: true,
      donanteAsignadoId: true,
      usuarioComun: {
        select: {
          nombre: true,
          cedula: true,
          email: true,
          telefono: true,
        },
      },
      medicamentos: {
        select: {
          id: true,
          cantidad: true,
          prioridad: true,
          prioridadOriginal: true,
          fechaModificacionPrioridad: true,
          prioridadModificadaPor: {
            select: {
              nombre: true,
            },
          },
          medicamento: {
            select: {
              nombre: true,
              presentacion: true,
            },
          },
        },
      },
      farmacia: {
        select: {
          id: true,
          nombre: true,
          direccion: true,
        },
      },
    },
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
  });
}

export async function approveRequest(requestId: string) {
  const supervisor = await getAuthenticatedSupervisor();
  const request = await getManageableRequestOrThrow(requestId);

  if (!["PENDIENTE", "RECHAZADA"].includes(request.estado)) {
    throw new Error("Solo puedes aprobar solicitudes pendientes o rechazadas");
  }

  await prisma.solicitud.update({
    where: { id: requestId },
    data: {
      estado: "APROBADA",
      aprobadoPorEnteId: supervisor.id,
      approvalDate: new Date(),
      approvalInstitution: supervisor.nombre,
      rejectionReason: null,
      tipoRechazo: null,
      motivoRechazoFarmacia: null,
    },
  });

  revalidatePath("/supervisor");
  return { success: true };
}

export async function rejectRequest(requestId: string, reason: string) {
  const supervisor = await getAuthenticatedSupervisor();
  const request = await getManageableRequestOrThrow(requestId);

  if (!reason.trim()) {
    throw new Error("Debes indicar un motivo de rechazo");
  }

  if (!["PENDIENTE", "APROBADA"].includes(request.estado)) {
    throw new Error("Solo puedes rechazar solicitudes pendientes o aprobadas");
  }

  await prisma.solicitud.update({
    where: { id: requestId },
    data: {
      estado: "RECHAZADA",
      aprobadoPorEnteId: supervisor.id,
      approvalDate: null,
      approvalInstitution: supervisor.nombre,
      rejectionReason: reason.trim(),
      tipoRechazo: "SUPERVISOR",
      motivoRechazoFarmacia: null,
    },
  });

  revalidatePath("/supervisor");
  return { success: true };
}

export async function restoreRequestToPending(requestId: string) {
  await getAuthenticatedSupervisor();
  const request = await getManageableRequestOrThrow(requestId);

  if (!["APROBADA", "RECHAZADA"].includes(request.estado)) {
    throw new Error("Solo puedes revertir solicitudes aprobadas o rechazadas");
  }

  if (request.donanteAsignadoId) {
    throw new Error("No se puede revertir una solicitud que ya tiene donante");
  }

  await prisma.solicitud.update({
    where: { id: requestId },
    data: {
      estado: "PENDIENTE",
      aprobadoPorEnteId: null,
      approvalDate: null,
      approvalInstitution: null,
      rejectionReason: null,
      tipoRechazo: null,
      motivoRechazoFarmacia: null,
    },
  });

  revalidatePath("/supervisor");
  return { success: true };
}

export async function updateMedicamentoPriority(
  solicitudMedicamentoId: string,
  nuevaPrioridad: number,
) {
  const supervisor = await getAuthenticatedSupervisor();

  const currentMedicamento = await prisma.solicitudMedicamento.findUnique({
    where: { id: solicitudMedicamentoId },
    select: { prioridad: true },
  });

  if (!currentMedicamento) {
    throw new Error("SolicitudMedicamento not found");
  }

  if (currentMedicamento.prioridad === nuevaPrioridad) {
    return { success: true, message: "Priority is already set to this value" };
  }

  await prisma.solicitudMedicamento.update({
    where: { id: solicitudMedicamentoId },
    data: {
      prioridad: nuevaPrioridad,
      prioridadOriginal: currentMedicamento.prioridad,
      prioridadModificadaPorId: supervisor.id,
      fechaModificacionPrioridad: new Date(),
      updatedAt: new Date(),
    },
  });

  revalidatePath("/supervisor");

  return {
    success: true,
    message: `Priority updated from ${currentMedicamento.prioridad} to ${nuevaPrioridad}`,
    prioridadAnterior: currentMedicamento.prioridad,
    prioridadNueva: nuevaPrioridad,
  };
}
