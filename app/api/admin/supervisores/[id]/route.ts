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
  password: z.string().min(6).optional(),
  aprobado: z.boolean().optional(),
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

    const supervisor = await prisma.enteSalud.update({
      where: { id },
      data,
      select: {
        id: true,
        nombre: true,
        email: true,
        direccion: true,
        telefono: true,
        aprobado: true,
        createdAt: true,
      },
    });
    return NextResponse.json({ success: true, supervisor });
  } catch (error: any) {
    if (error?.code === "P2025") {
      return NextResponse.json({ error: "Supervisor no encontrado" }, { status: 404 });
    }
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "Ya existe un supervisor con ese email" }, { status: 409 });
    }
    console.error("Error updating supervisor:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
