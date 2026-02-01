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
    },
  });

  return { success: true };
}
