import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { passwordService } from "@/lib/auth/password.service";
import { tokenService } from "@/lib/auth/token.service";
import { setSessionCookie } from "@/lib/auth/cookie";
import { AUTH_COOKIE_NAMES } from "@/lib/auth/roles";

const loginSchema = z.object({
  email: z.string().email("Correo electronico invalido"),
  password: z.string().min(1, "La contrasena es requerida"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 },
      );
    }

    const { email, password } = parsed.data;
    const pharmacy = await prisma.farmacia.findUnique({
      where: { email },
    });

    if (!pharmacy) {
      return NextResponse.json(
        { success: false, error: "Credenciales invalidas" },
        { status: 401 },
      );
    }

    const isValidPassword = await passwordService.verify(
      password,
      pharmacy.password,
    );

    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, error: "Credenciales invalidas" },
        { status: 401 },
      );
    }

    if (!pharmacy.activo) {
      return NextResponse.json(
        {
          success: false,
          error: "Esta farmacia esta desactivada. Contacta al administrador.",
        },
        { status: 403 },
      );
    }

    const token = await tokenService.generate({
      userId: pharmacy.id,
      email: pharmacy.email,
      tipo: "FARMACIA",
      role: "FARMACIA",
      nombre: pharmacy.nombre,
      farmaciaId: pharmacy.id,
    });

    const response = NextResponse.json(
      {
        success: true,
        user: {
          id: pharmacy.id,
          nombre: pharmacy.nombre,
          email: pharmacy.email,
          tipo: "FARMACIA",
        },
      },
      { status: 200 },
    );

    setSessionCookie(response, AUTH_COOKIE_NAMES.FARMACIA, token);

    return response;
  } catch (error) {
    console.error("Error en pharmacy login:", error);
    return NextResponse.json(
      { success: false, error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
