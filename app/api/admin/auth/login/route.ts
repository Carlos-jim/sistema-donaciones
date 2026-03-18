import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { compare } from "bcryptjs";
import { tokenService } from "@/lib/auth/token.service";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Email y contraseña requeridos" }, { status: 400 });
    }

    const admin = await prisma.administrador.findUnique({ where: { email } });
    if (!admin) {
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
    }

    const valid = await compare(password, admin.password);
    if (!valid) {
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
    }

    const token = await tokenService.generate({
      userId: admin.id,
      email: admin.email,
      tipo: "ADMIN",
    });

    const res = NextResponse.json({ success: true, admin: { id: admin.id, nombre: admin.nombre, email: admin.email, rol: admin.rol } });
    res.cookies.set("admin-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 8,
      path: "/",
    });
    return res;
  } catch (error) {
    console.error("Admin login error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
