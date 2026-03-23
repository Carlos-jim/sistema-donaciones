import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAdminFromCookie } from "@/lib/admin-auth";
import { hash } from "bcryptjs";
import { z } from "zod";

const supervisorSchema = z.object({
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  direccion: z.string().min(5, "La dirección debe tener al menos 5 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  telefono: z.string().optional(),
});

export async function GET() {
  try {
    const admin = await getAdminFromCookie();
    if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const supervisores = await prisma.enteSalud.findMany({
      orderBy: { nombre: "asc" },
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
    return NextResponse.json(supervisores);
  } catch (error) {
    console.error("Error fetching supervisores:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminFromCookie();
    if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const body = await request.json();
    const parsed = supervisorSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { password, ...rest } = parsed.data;
    const hashedPassword = await hash(password, 12);

    const supervisor = await prisma.enteSalud.create({
      data: { ...rest, password: hashedPassword, aprobado: true },
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
    return NextResponse.json({ success: true, supervisor }, { status: 201 });
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "Ya existe un supervisor con ese email" }, { status: 409 });
    }
    console.error("Error creating supervisor:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
