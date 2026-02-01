"use server"

import prisma from "@/lib/prisma"

export async function getApprovedRequests() {
  try {
    const requests = await prisma.solicitud.findMany({
      where: {
        estado: "APROBADA",
        donanteAsignadoId: null, // Only show unassigned requests
      },
      include: {
        usuarioComun: {
          select: {
            id: true,
            nombre: true,
            email: true,
          },
        },
        medicamentos: {
          include: {
            medicamento: {
              select: {
                id: true,
                nombre: true,
                presentacion: true,
              },
            },
          },
          orderBy: {
            prioridad: "desc", // Highest priority first
          },
        },
      },
      orderBy: [
        { tiempoEspera: "desc" }, // Highest urgency first
        { createdAt: "asc" }, // Oldest first
      ],
    })

    return requests
  } catch (error) {
    console.error("Error fetching approved requests:", error)
    throw new Error("Failed to fetch requests")
  }
}

export async function acceptRequest(requestId: string, donorUserId: string) {
  // Verify the request exists and is approved
  const request = await prisma.solicitud.findUnique({
    where: { id: requestId },
    include: {
      usuarioComun: {
        select: { nombre: true, email: true }
      }
    }
  })

  if (!request) {
    throw new Error("Solicitud no encontrada")
  }

  if (request.estado !== "APROBADA") {
    throw new Error("Solo se pueden aceptar solicitudes aprobadas")
  }

  if (request.donanteAsignadoId) {
    throw new Error("Esta solicitud ya ha sido asignada a otro donante")
  }

  // Update the request to assign it to the donor
  await prisma.solicitud.update({
    where: { id: requestId },
    data: {
      estado: "EN_PROCESO",
      donanteAsignadoId: donorUserId,
      assignedDate: new Date(),
    },
  })

  // Create notification for the beneficiary
  await prisma.notificacion.create({
    data: {
      userId: request.usuarioComunId,
      type: "MATCH_DONATION",
      title: "¡Donante asignado!",
      message: "Un donante ha aceptado tu solicitud. Pronto te contactarán para coordinar la entrega.",
      link: `/dashboard/requests/${requestId}`,
    },
  })

  return { success: true }
}