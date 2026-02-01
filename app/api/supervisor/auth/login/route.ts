import { NextRequest, NextResponse } from "next/server";
import { passwordService } from "@/lib/auth/password.service";
import { tokenService } from "@/lib/auth/token.service"; // Using existing token service
import prisma from "@/lib/prisma";
import { z } from "zod";

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

    // Buscar EnteSalud (Supervisor)
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

    // Generar Token
    const token = await tokenService.generate({
      userId: ente.id,
      email: ente.email,
      tipo: "ENTE_SALUD",
      nombre: ente.nombre,
    });

    const response = NextResponse.json(
      {
        success: true,
        user: {
          id: ente.id,
          nombre: ente.nombre,
          email: ente.email,
          tipo: "ENTE_SALUD",
        },
      },
      { status: 200 },
    );

    // Set cookie specific for supervisor to avoid conflicts/logic issues with main app for now
    // Or use same auth-token if we want unified middleware handling?
    // Let's use 'supervisor-token' for isolation.
    response.cookies.set("supervisor-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Error en supervisor login:", error);
    return NextResponse.json(
      { success: false, error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
