import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAdminFromCookie } from "@/lib/admin-auth";
import { z } from "zod";

const medicamentoSchema = z.object({
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  principioActivo: z.string().optional(),
  presentacion: z.string().optional(),
  concentracion: z.string().optional(),
  descripcion: z.string().optional(),
});

export async function GET() {
  try {
    const admin = await getAdminFromCookie();
    if (!admin) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const medicamentos = await prisma.medicamento.findMany({
      orderBy: { nombre: "asc" },
      select: {
        id: true,
        nombre: true,
        principioActivo: true,
        presentacion: true,
        concentracion: true,
        descripcion: true,
        activo: true,
        createdAt: true,
        _count: {
          select: { solicitudes: true, donaciones: true },
        },
      },
    });

    return NextResponse.json(medicamentos);
  } catch (error) {
    console.error("Error fetching medicamentos:", error);
    return NextResponse.json(
      { error: "Error al obtener medicamentos" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminFromCookie();
    if (!admin) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const data = medicamentoSchema.parse(body);

    // Check for duplicate name
    const existing = await prisma.medicamento.findFirst({
      where: { nombre: { equals: data.nombre, mode: "insensitive" } },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Ya existe un medicamento con ese nombre" },
        { status: 409 },
      );
    }

    const medicamento = await prisma.medicamento.create({ data });
    return NextResponse.json(medicamento, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 },
      );
    }
    console.error("Error creating medicamento:", error);
    return NextResponse.json(
      { error: "Error al crear el medicamento" },
      { status: 500 },
    );
  }
}
