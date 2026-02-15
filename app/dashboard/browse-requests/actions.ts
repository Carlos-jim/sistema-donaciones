"use server"

import prisma from "@/lib/prisma"

export async function getApprovedRequests() {
  try {
    const requests = await prisma.solicitud.findMany({
      where: {
        estado: "APROBADA",
        donanteAsignadoId: null, // Only show unassigned requests
      },
      select: {
        id: true,
        motivo: true,
        latitude: true,
        longitude: true,
        tiempoEspera: true,
        createdAt: true,
        medicamentos: {
          select: {
            id: true,
            cantidad: true,
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

    return requests.map((request) => ({
      ...request,
      beneficiaryLabel: "Beneficiario anónimo",
    }))
  } catch (error) {
    console.error("Error fetching approved requests:", error)
    throw new Error("Failed to fetch requests")
  }
}
