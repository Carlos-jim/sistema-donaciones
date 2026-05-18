import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET() {
  try {
    const categorias = await prisma.categoriaMedicamento.findMany({
      where: { activo: true },
      orderBy: { orden: "asc" },
      select: {
        id: true,
        nombre: true,
        descripcion: true,
        icono: true,
        orden: true,
      },
    })

    return NextResponse.json(categorias)
  } catch (error) {
    console.error("Error fetching categorias:", error)
    return NextResponse.json(
      { error: "Error al obtener categorías" },
      { status: 500 }
    )
  }
}
