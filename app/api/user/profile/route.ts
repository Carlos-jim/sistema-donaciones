import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { tokenService } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { compare, hash } from "bcryptjs";

const profileSchema = z.object({
  nombre: z.string().min(2).optional(),
  email: z.string().email().optional(),
  telefono: z.string().optional(),
  cedula: z.string().optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8).optional(),
});

export async function GET() {
  try {
    const token = (await cookies()).get("auth-token")?.value;
    if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const payload = await tokenService.verify(token);
    if (!payload?.userId) return NextResponse.json({ error: "Token inválido" }, { status: 401 });

    const user = await prisma.usuarioComun.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        nombre: true,
        email: true,
        telefono: true,
        direccion: true,
        createdAt: true,
      },
    });

    if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

    return NextResponse.json({
      ...user,
      cedula: null,
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const token = (await cookies()).get("auth-token")?.value;
    if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const payload = await tokenService.verify(token);
    if (!payload?.userId) return NextResponse.json({ error: "Token inválido" }, { status: 401 });

    const body = await request.json();
    const parsed = profileSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { nombre, email, telefono, currentPassword, newPassword } = parsed.data;

    const user = await prisma.usuarioComun.findUnique({ where: { id: payload.userId } });
    if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

    // Check if email is taken by another user
    if (email && email !== user.email) {
      const existing = await prisma.usuarioComun.findUnique({ where: { email } });
      if (existing) return NextResponse.json({ error: "Este correo ya está en uso" }, { status: 409 });
    }

    // Handle password change
    let hashedPassword: string | undefined;
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ error: "Debes ingresar tu contraseña actual" }, { status: 400 });
      }
      const isValid = await compare(currentPassword, user.password);
      if (!isValid) {
        return NextResponse.json({ error: "La contraseña actual es incorrecta" }, { status: 400 });
      }
      hashedPassword = await hash(newPassword, 12);
    }

    const updated = await prisma.usuarioComun.update({
      where: { id: payload.userId },
      data: {
        ...(nombre && { nombre }),
        ...(email && { email }),
        ...(telefono !== undefined && { telefono }),
        ...(hashedPassword && { password: hashedPassword }),
      },
      select: {
        id: true,
        nombre: true,
        email: true,
        telefono: true,
        direccion: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        ...updated,
        cedula: null,
      },
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json({ error: "Error al actualizar el perfil" }, { status: 500 });
  }
}
