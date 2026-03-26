import { NextRequest, NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { z } from "zod";
import prisma from "@/lib/prisma";
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
        { error: parsed.error.errors[0].message },
        { status: 400 },
      );
    }

    const { email, password } = parsed.data;
    const admin = await prisma.administrador.findUnique({ where: { email } });

    if (!admin) {
      return NextResponse.json(
        { error: "Credenciales invalidas" },
        { status: 401 },
      );
    }

    const valid = await compare(password, admin.password);
    if (!valid) {
      return NextResponse.json(
        { error: "Credenciales invalidas" },
        { status: 401 },
      );
    }

    const token = await tokenService.generate({
      userId: admin.id,
      email: admin.email,
      tipo: "ADMIN",
      role: "ADMIN",
      nombre: admin.nombre,
      adminRole: admin.rol,
    });

    const response = NextResponse.json({
      success: true,
      admin: {
        id: admin.id,
        nombre: admin.nombre,
        email: admin.email,
        rol: admin.rol,
      },
    });

    setSessionCookie(response, AUTH_COOKIE_NAMES.ADMIN, token, 60 * 60 * 8);

    return response;
  } catch (error) {
    console.error("Admin login error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
