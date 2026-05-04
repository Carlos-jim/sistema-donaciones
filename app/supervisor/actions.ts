"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { getSessionForRole } from "@/lib/auth/server-session";

function isMissingColumnError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const maybeCode = (error as { code?: unknown }).code;
  const maybeMessage = (error as { message?: unknown }).message;

  if (maybeCode === "P2022") {
    return true;
  }

  if (typeof maybeMessage === "string") {
    return maybeMessage.toLowerCase().includes("does not exist");
  }

  return false;
}

async function updateSolicitudWithFallback(
  requestId: string,
  payloads: Array<Record<string, unknown>>,
) {
  let lastMissingColumnError: unknown;

  for (const payload of payloads) {
    try {
      await prisma.solicitud.update({
        where: { id: requestId },
        data: payload,
      });
      return;
    } catch (error) {
      if (!isMissingColumnError(error)) {
        throw error;
      }
      lastMissingColumnError = error;
    }
  }

  if (lastMissingColumnError) {
    throw lastMissingColumnError;
  }
}

async function createSystemNotificationWithFallback(
  userId: string,
  title: string,
  message: string,
) {
  const payloads: Array<Record<string, unknown>> = [
    {
      userId,
      type: "SYSTEM",
      title,
      message,
      link: "/dashboard/requests",
      activo: true,
    },
    {
      userId,
      type: "SYSTEM",
      title,
      message,
      link: "/dashboard/requests",
    },
    {
      userId,
      type: "SYSTEM",
      title,
      message,
    },
  ];

  let lastMissingColumnError: unknown;

  for (const payload of payloads) {
    try {
      await prisma.notificacion.create({
        data: payload,
      });
      return;
    } catch (error) {
      if (!isMissingColumnError(error)) {
        throw error;
      }
      lastMissingColumnError = error;
    }
  }

  if (lastMissingColumnError) {
    throw lastMissingColumnError;
  }
}

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
      usuarioComunId: true,
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

  try {
    await updateSolicitudWithFallback(requestId, [
      {
        estado: "APROBADA",
        aprobadoPorEnteId: supervisor.id,
        approvalDate: new Date(),
        approvalInstitution: supervisor.nombre,
        rejectionReason: null,
        tipoRechazo: null,
        motivoRechazoFarmacia: null,
      },
      {
        estado: "APROBADA",
        aprobadoPorEnteId: supervisor.id,
        approvalDate: new Date(),
        approvalInstitution: supervisor.nombre,
        rejectionReason: null,
      },
      {
        estado: "APROBADA",
        rejectionReason: null,
      },
      {
        estado: "APROBADA",
      },
    ]);
  } catch (error) {
    if (!isMissingColumnError(error)) {
      throw error;
    }

    // Último fallback para esquemas legacy.
    await prisma.solicitud.update({
      where: { id: requestId },
      data: { estado: "APROBADA" },
    });
  }

  // Best-effort: no debe tumbar la aprobación si falla por esquema legacy.
  try {
    await createSystemNotificationWithFallback(
      request.usuarioComunId,
      "Solicitud de medicamento aprobada",
      "Tu solicitud ha sido revisada y aprobada.",
    );
  } catch (error) {
    console.error("No se pudo crear notificación de aprobación:", error);
  }

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

  try {
    await updateSolicitudWithFallback(requestId, [
      {
        estado: "RECHAZADA",
        aprobadoPorEnteId: supervisor.id,
        approvalDate: null,
        approvalInstitution: supervisor.nombre,
        rejectionReason: reason.trim(),
        tipoRechazo: "SUPERVISOR",
        motivoRechazoFarmacia: null,
      },
      {
        estado: "RECHAZADA",
        aprobadoPorEnteId: supervisor.id,
        approvalDate: null,
        approvalInstitution: supervisor.nombre,
        rejectionReason: reason.trim(),
      },
      {
        estado: "RECHAZADA",
        rejectionReason: reason.trim(),
      },
      {
        estado: "RECHAZADA",
      },
    ]);
  } catch (error) {
    if (!isMissingColumnError(error)) {
      throw error;
    }

    // Último fallback para esquemas legacy.
    await prisma.solicitud.update({
      where: { id: requestId },
      data: { estado: "RECHAZADA" },
    });
  }

  // Best-effort: no debe tumbar el rechazo si falla por esquema legacy.
  try {
    await createSystemNotificationWithFallback(
      request.usuarioComunId,
      "Solicitud de medicamento rechazada",
      `Tu solicitud ha sido rechazada por el supervisor (${supervisor.nombre}). Motivo: ${reason.trim()}`,
    );
  } catch (error) {
    console.error("No se pudo crear notificación de rechazo:", error);
  }

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

  try {
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
  } catch (error) {
    if (!isMissingColumnError(error)) {
      throw error;
    }

    // Fallback for environments where newer columns are missing.
    await prisma.solicitud.update({
      where: { id: requestId },
      data: {
        estado: "PENDIENTE",
        aprobadoPorEnteId: null,
        approvalDate: null,
        approvalInstitution: null,
        rejectionReason: null,
      },
    });
  }

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

  try {
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
  } catch (error) {
    if (!isMissingColumnError(error)) {
      throw error;
    }

    // Fallback for environments where priority audit columns are missing.
    await prisma.solicitudMedicamento.update({
      where: { id: solicitudMedicamentoId },
      data: {
        prioridad: nuevaPrioridad,
        updatedAt: new Date(),
      },
    });
  }

  revalidatePath("/supervisor");

  return {
    success: true,
    message: `Priority updated from ${currentMedicamento.prioridad} to ${nuevaPrioridad}`,
    prioridadAnterior: currentMedicamento.prioridad,
    prioridadNueva: nuevaPrioridad,
  };
}
