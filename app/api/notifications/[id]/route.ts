import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { tokenService } from "@/lib/auth/token.service";
import prisma from "@/lib/prisma";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = (await cookies()).get("auth-token")?.value;
    if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const payload = await tokenService.verify(token);
    if (!payload?.userId) return NextResponse.json({ error: "Token inválido" }, { status: 401 });

    const { id } = await params;

    const notif = await prisma.notificacion.findUnique({ where: { id } });
    if (!notif || notif.userId !== payload.userId) {
      return NextResponse.json({ error: "No encontrada" }, { status: 404 });
    }

    await prisma.notificacion.update({ where: { id }, data: { activo: false } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error dismissing notification:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
