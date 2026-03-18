import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { tokenService } from "@/lib/auth/token.service";
import prisma from "@/lib/prisma";
import { compare } from "bcryptjs";

export async function PATCH(request: NextRequest) {
  try {
    const token = (await cookies()).get("auth-token")?.value;
    if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const payload = await tokenService.verify(token);
    if (!payload?.userId) return NextResponse.json({ error: "Token inválido" }, { status: 401 });

    const { password } = await request.json();
    if (!password) return NextResponse.json({ error: "Contraseña requerida" }, { status: 400 });

    const user = await prisma.usuarioComun.findUnique({ where: { id: payload.userId } });
    if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

    const valid = await compare(password, user.password);
    if (!valid) return NextResponse.json({ error: "Contraseña incorrecta" }, { status: 400 });

    await prisma.usuarioComun.update({
      where: { id: payload.userId },
      data: { activo: false },
    });

    const res = NextResponse.json({ success: true });
    res.cookies.set("auth-token", "", { maxAge: 0, path: "/" });
    return res;
  } catch (error) {
    console.error("Error deactivating account:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
