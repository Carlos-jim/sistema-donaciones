import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { passwordService } from "@/lib/auth/password.service";
import { tokenService } from "@/lib/auth/token.service";
import { setSessionCookie } from "@/lib/auth/cookie";
import { AUTH_COOKIE_NAMES } from "@/lib/auth/roles";

const loginSchema = z.object({
  email: z.string().email("Correo electrónico inválido"),
  password: z.string().min(1, "La contraseña es requerida"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = loginSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 },
      );
    }

    const { email, password } = validation.data;

    const ente = await prisma.enteSalud.findUnique({
      where: { email },
    });

    if (!ente) {
      return NextResponse.json(
        { success: false, error: "Credenciales inválidas" },
        { status: 401 },
      );
    }

    const isValidPassword = await passwordService.verify(
      password,
      ente.password,
    );

    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, error: "Credenciales inválidas" },
        { status: 401 },
      );
    }

    if (!ente.aprobado) {
      return NextResponse.json(
        {
          success: false,
          error: "Esta cuenta está desactivada. Contacta al administrador.",
        },
        { status: 403 },
      );
    }

    const token = await tokenService.generate({
      userId: ente.id,
      email: ente.email,
      tipo: "SUPERVISOR",
      role: "SUPERVISOR",
      nombre: ente.nombre,
    });

    const response = NextResponse.json(
      {
        success: true,
        user: {
          id: ente.id,
          nombre: ente.nombre,
          email: ente.email,
          tipo: "SUPERVISOR",
        },
      },
      { status: 200 },
    );

    setSessionCookie(response, AUTH_COOKIE_NAMES.SUPERVISOR, token);

    return response;
  } catch (error) {
    console.error("Error en supervisor login:", error);
    return NextResponse.json(
      { success: false, error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
