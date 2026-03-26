"use server";

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

export async function getPendingRequests() {
  await getAuthenticatedSupervisor();

  return prisma.solicitud.findMany({
    where: {
      estado: "PENDIENTE",
    },
    include: {
      usuarioComun: true,
      medicamentos: {
        include: {
          medicamento: true,
          prioridadModificadaPor: {
            select: {
              nombre: true,
            },
          },
        },
      },
      farmacia: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function approveRequest(requestId: string) {
  const supervisor = await getAuthenticatedSupervisor();

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

  return { success: true };
}

export async function rejectRequest(requestId: string, reason: string) {
  const supervisor = await getAuthenticatedSupervisor();

  await prisma.solicitud.update({
    where: { id: requestId },
    data: {
      estado: "RECHAZADA",
      aprobadoPorEnteId: supervisor.id,
      approvalInstitution: supervisor.nombre,
      rejectionReason: reason,
      tipoRechazo: "SUPERVISOR",
      motivoRechazoFarmacia: null,
    },
  });

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

  return {
    success: true,
    message: `Priority updated from ${currentMedicamento.prioridad} to ${nuevaPrioridad}`,
    prioridadAnterior: currentMedicamento.prioridad,
    prioridadNueva: nuevaPrioridad,
  };
}
