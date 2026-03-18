import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAdminFromCookie } from "@/lib/admin-auth";
import { hash } from "bcryptjs";
import { z } from "zod";

const updateSchema = z.object({
  nombre: z.string().min(2).optional(),
  direccion: z.string().min(5).optional(),
  email: z.string().email().optional(),
  telefono: z.string().optional(),
  horario: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  password: z.string().min(6).optional(),
  activo: z.boolean().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAdminFromCookie();
    if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { password, ...rest } = parsed.data;
    const data: any = { ...rest };
    if (password) data.password = await hash(password, 12);

    const farmacia = await prisma.farmacia.update({
      where: { id },
      data,
      select: {
        id: true, nombre: true, direccion: true, email: true,
        telefono: true, horario: true, latitude: true, longitude: true,
        activo: true, createdAt: true,
      },
    });
    return NextResponse.json({ success: true, farmacia });
  } catch (error: any) {
    if (error?.code === "P2025") {
      return NextResponse.json({ error: "Farmacia no encontrada" }, { status: 404 });
    }
    console.error("Error updating farmacia:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
