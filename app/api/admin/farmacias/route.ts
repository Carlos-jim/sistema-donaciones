import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAdminFromCookie } from "@/lib/admin-auth";
import { hash } from "bcryptjs";
import { z } from "zod";

const farmaciaSchema = z.object({
  nombre: z.string().min(2),
  direccion: z.string().min(5),
  email: z.string().email(),
  password: z.string().min(6),
  telefono: z.string().optional(),
  horario: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export async function GET() {
  try {
    const admin = await getAdminFromCookie();
    if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const farmacias = await prisma.farmacia.findMany({
      orderBy: { nombre: "asc" },
      select: {
        id: true, nombre: true, direccion: true, email: true,
        telefono: true, horario: true, latitude: true, longitude: true,
        activo: true, createdAt: true,
      },
    });
    return NextResponse.json(farmacias);
  } catch (error) {
    console.error("Error fetching farmacias:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminFromCookie();
    if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const body = await request.json();
    const parsed = farmaciaSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { password, ...rest } = parsed.data;
    const hashedPassword = await hash(password, 12);

    const farmacia = await prisma.farmacia.create({
      data: { ...rest, password: hashedPassword },
      select: {
        id: true, nombre: true, direccion: true, email: true,
        telefono: true, horario: true, latitude: true, longitude: true,
        activo: true, createdAt: true,
      },
    });
    return NextResponse.json({ success: true, farmacia }, { status: 201 });
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "Ya existe una farmacia con ese email" }, { status: 409 });
    }
    console.error("Error creating farmacia:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
