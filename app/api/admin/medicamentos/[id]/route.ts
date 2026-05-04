import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAdminFromCookie } from "@/lib/admin-auth";
import { z } from "zod";

const updateSchema = z.object({
  nombre: z.string().min(2).optional(),
  principioActivo: z.string().optional().nullable(),
  presentacion: z.string().optional().nullable(),
  concentracion: z.string().optional().nullable(),
  descripcion: z.string().optional().nullable(),
  activo: z.boolean().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await getAdminFromCookie();
    if (!admin) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const data = updateSchema.parse(body);

    // Check for duplicate name if changing it
    if (data.nombre) {
      const existing = await prisma.medicamento.findFirst({
        where: {
          nombre: { equals: data.nombre, mode: "insensitive" },
          id: { not: id },
        },
      });
      if (existing) {
        return NextResponse.json(
          { error: "Ya existe un medicamento con ese nombre" },
          { status: 409 },
        );
      }
    }

    const medicamento = await prisma.medicamento.update({
      where: { id },
      data,
    });

    return NextResponse.json(medicamento);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 },
      );
    }
    console.error("Error updating medicamento:", error);
    return NextResponse.json(
      { error: "Error al actualizar el medicamento" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await getAdminFromCookie();
    if (!admin) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;

    // Check if it has related records
    const med = await prisma.medicamento.findUnique({
      where: { id },
      select: { _count: { select: { solicitudes: true, donaciones: true } } },
    });

    if (!med) {
      return NextResponse.json(
        { error: "Medicamento no encontrado" },
        { status: 404 },
      );
    }

    const totalUsos = med._count.solicitudes + med._count.donaciones;
    if (totalUsos > 0) {
      // Soft delete: just deactivate
      await prisma.medicamento.update({
        where: { id },
        data: { activo: false },
      });
      return NextResponse.json({
        message: "Medicamento desactivado (tiene registros asociados)",
      });
    }

    // Hard delete if no references
    await prisma.medicamento.delete({ where: { id } });
    return NextResponse.json({ message: "Medicamento eliminado" });
  } catch (error) {
    console.error("Error deleting medicamento:", error);
    return NextResponse.json(
      { error: "Error al eliminar el medicamento" },
      { status: 500 },
    );
  }
}
