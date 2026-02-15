"use server";

import prisma from "@/lib/prisma";
async function getFallbackSupervisor() {
  // Directly grab the first one to satisfy DB constraints
  return await prisma.enteSalud.findFirst();
}

// --- Request Actions ---

export async function getPendingRequests() {
  // No auth check
  const requests = await prisma.solicitud.findMany({
    where: {
      estado: "PENDIENTE",
    },
    include: {
      usuarioComun: true, // Beneficiary info
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

  return requests;
}

export async function approveRequest(requestId: string) {
  // Get Supervisor (EnteSalud) details to record "approvalInstitution"
  const ente = await getFallbackSupervisor();

  if (!ente)
    throw new Error("No supervisor/ente found in DB to assign approval.");

  await prisma.solicitud.update({
    where: { id: requestId },
    data: {
      estado: "APROBADA",
      aprobadoPorEnteId: ente.id,
      approvalDate: new Date(),
      approvalInstitution: ente.nombre,
    },
  });

  return { success: true };
}

export async function rejectRequest(requestId: string, reason: string) {
  const ente = await getFallbackSupervisor();

  if (!ente)
    throw new Error("No supervisor/ente found in DB to assign rejection.");

  await prisma.solicitud.update({
    where: { id: requestId },
    data: {
      estado: "RECHAZADA",
      aprobadoPorEnteId: ente.id,
      rejectionReason: reason,
      tipoRechazo: "SUPERVISOR",
      motivoRechazoFarmacia: null,
    },
  });

  return { success: true };
}

export async function updateMedicamentoPriority(
  solicitudMedicamentoId: string,
  nuevaPrioridad: number
) {
  const ente = await getFallbackSupervisor();

  if (!ente)
    throw new Error("No supervisor/ente found in assign priority modification.");

  // Get current priority before updating
  const currentMedicamento = await prisma.solicitudMedicamento.findUnique({
    where: { id: solicitudMedicamentoId },
    select: { prioridad: true }
  });

  if (!currentMedicamento) {
    throw new Error("SolicitudMedicamento not found");
  }

  if (currentMedicamento.prioridad === nuevaPrioridad) {
    return { success: true, message: "Priority is already set to this value" };
  }

  // Update with audit trail
  await prisma.solicitudMedicamento.update({
    where: { id: solicitudMedicamentoId },
    data: {
      prioridad: nuevaPrioridad,
      prioridadOriginal: currentMedicamento.prioridad,
      prioridadModificadaPorId: ente.id,
      fechaModificacionPrioridad: new Date(),
      updatedAt: new Date(),
    },
  });

  return { 
    success: true, 
    message: `Priority updated from ${currentMedicamento.prioridad} to ${nuevaPrioridad}`,
    prioridadAnterior: currentMedicamento.prioridad,
    prioridadNueva: nuevaPrioridad
  };
}
