"use server"

import prisma from "@/lib/prisma"

type RequestLocation = {
  lat?: number | null
  lng?: number | null
  long?: number | null
} | null

export async function getApprovedRequests() {
  try {
    const requests = await prisma.solicitud.findMany({
      where: {
        estado: "APROBADA",
        donanteAsignadoId: null,
      },
      select: {
        id: true,
        motivo: true,
        direccion: true,
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
            prioridad: "desc",
          },
        },
      },
      orderBy: [
        { tiempoEspera: "desc" },
        { createdAt: "asc" },
      ],
    })

    return requests.map((request) => {
      const location = (request.direccion ?? null) as RequestLocation
      const latitude = typeof location?.lat === "number" ? location.lat : null
      const longitude = typeof location?.lng === "number"
        ? location.lng
        : typeof location?.long === "number"
          ? location.long
          : null

      return {
        id: request.id,
        motivo: request.motivo,
        latitude,
        longitude,
        tiempoEspera: request.tiempoEspera,
        createdAt: request.createdAt,
        beneficiaryLabel: "Beneficiario anonimo",
        medicamentos: request.medicamentos,
      }
    })
  } catch (error) {
    console.error("Error fetching approved requests:", error)
    throw new Error("Failed to fetch requests")
  }
}
