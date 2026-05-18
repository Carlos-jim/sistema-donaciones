import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")?.trim() || ""
    const categoriaId = searchParams.get("categoria") || undefined
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50)

    if (!query || query.length < 2) {
      // Si no hay query o es muy corta, devolver medicamentos populares o por categoría
      const medicamentos = await prisma.medicamento.findMany({
        where: {
          activo: true,
          ...(categoriaId ? { categoriaId } : {}),
        },
        select: {
          id: true,
          nombre: true,
          principioActivo: true,
          presentacion: true,
          concentracion: true,
          categoria: {
            select: {
              id: true,
              nombre: true,
            },
          },
        },
        orderBy: [{ nombre: "asc" }],
        take: limit,
      })

      return NextResponse.json({ medicamentos, total: medicamentos.length })
    }

    // Búsqueda por nombre, principio activo o presentación
    const medicamentos = await prisma.medicamento.findMany({
      where: {
        activo: true,
        ...(categoriaId ? { categoriaId } : {}),
        OR: [
          {
            nombre: {
              contains: query,
              mode: "insensitive",
            },
          },
          {
            principioActivo: {
              contains: query,
              mode: "insensitive",
            },
          },
          {
            presentacion: {
              contains: query,
              mode: "insensitive",
            },
          },
        ],
      },
      select: {
        id: true,
        nombre: true,
        principioActivo: true,
        presentacion: true,
        concentracion: true,
        categoria: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
      orderBy: [
        // Priorizar coincidencias exactas al inicio del nombre
        {
          nombre: "asc",
        },
      ],
      take: limit,
    })

    // Ordenar manualmente para priorizar coincidencias exactas al inicio
    const queryLower = query.toLowerCase()
    const sorted = medicamentos.sort((a, b) => {
      const aStartsWith = a.nombre.toLowerCase().startsWith(queryLower)
      const bStartsWith = b.nombre.toLowerCase().startsWith(queryLower)
      if (aStartsWith && !bStartsWith) return -1
      if (!aStartsWith && bStartsWith) return 1
      return a.nombre.localeCompare(b.nombre)
    })

    return NextResponse.json({
      medicamentos: sorted,
      total: sorted.length,
      query,
    })
  } catch (error) {
    console.error("Error searching medications:", error)
    return NextResponse.json(
      { error: "Error al buscar insumos médicos" },
      { status: 500 }
    )
  }
}
