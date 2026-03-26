import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { compare, hash } from "bcryptjs";
import { tokenService } from "@/lib/auth";
import prisma from "@/lib/prisma";

const profileSchema = z.object({
  nombre: z.string().trim().min(2).optional(),
  email: z.string().trim().email().optional(),
  telefono: z.string().trim().optional(),
  cedula: z.string().trim().nullable().optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8).optional(),
});

async function getAuthenticatedUserId() {
  const token = (await cookies()).get("auth-token")?.value;
  if (!token) {
    return null;
  }

  const payload = await tokenService.verify(token);
  return payload?.userId ?? null;
}

export async function GET() {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const user = await prisma.usuarioComun.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nombre: true,
        email: true,
        telefono: true,
        cedula: true,
        direccion: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 },
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = profileSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 },
      );
    }

    const { nombre, email, telefono, cedula, currentPassword, newPassword } =
      parsed.data;

    const user = await prisma.usuarioComun.findUnique({
      where: { id: userId },
    });
    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 },
      );
    }

    if (email && email !== user.email) {
      const existing = await prisma.usuarioComun.findUnique({ where: { email } });
      if (existing) {
        return NextResponse.json(
          { error: "Este correo ya esta en uso" },
          { status: 409 },
        );
      }
    }

    let hashedPassword: string | undefined;
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: "Debes ingresar tu contrasena actual" },
          { status: 400 },
        );
      }

      const isValid = await compare(currentPassword, user.password);
      if (!isValid) {
        return NextResponse.json(
          { error: "La contrasena actual es incorrecta" },
          { status: 400 },
        );
      }

      hashedPassword = await hash(newPassword, 12);
    }

    const normalizedTelefono =
      telefono !== undefined ? telefono.trim() || null : undefined;
    const normalizedCedula =
      cedula !== undefined ? (cedula?.trim() || null) : undefined;

    const updated = await prisma.usuarioComun.update({
      where: { id: userId },
      data: {
        ...(nombre !== undefined && { nombre }),
        ...(email !== undefined && { email }),
        ...(normalizedTelefono !== undefined && {
          telefono: normalizedTelefono,
        }),
        ...(normalizedCedula !== undefined && { cedula: normalizedCedula }),
        ...(hashedPassword && { password: hashedPassword }),
      },
      select: {
        id: true,
        nombre: true,
        email: true,
        telefono: true,
        cedula: true,
        direccion: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      user: updated,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Error al actualizar el perfil" },
      { status: 500 },
    );
  }
}
