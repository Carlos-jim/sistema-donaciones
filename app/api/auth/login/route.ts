import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { setSessionCookie } from "@/lib/auth/cookie";
import { AUTH_COOKIE_NAMES } from "@/lib/auth/roles";
import { AuthService } from "@/lib/auth/auth.service";
import { passwordService } from "@/lib/auth/password.service";
import { tokenService } from "@/lib/auth/token.service";
import { userRepository } from "@/lib/auth/user.repository";

const loginSchema = z.object({
  email: z.string().email("Correo electronico invalido"),
  password: z.string().min(1, "La contrasena es requerida"),
});

const authService = new AuthService(
  passwordService,
  tokenService,
  userRepository,
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = loginSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error.errors[0].message,
        },
        { status: 400 },
      );
    }

    const result = await authService.login(validation.data);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 401 },
      );
    }

    const response = NextResponse.json(
      {
        success: true,
        user: result.user,
      },
      { status: 200 },
    );

    setSessionCookie(response, AUTH_COOKIE_NAMES.COMUN, result.token!);

    return response;
  } catch (error) {
    console.error("Error en login:", error);
    return NextResponse.json(
      { success: false, error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
