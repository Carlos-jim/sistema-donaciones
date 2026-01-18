import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { tokenService } from "@/lib/auth";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value;

    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const payload = await tokenService.verify(token);
    if (!payload?.email) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    const user = await prisma.usuarioComun.findUnique({
      where: { email: payload.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 },
      );
    }

    const notifications = await prisma.notificacion.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value;

    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const payload = await tokenService.verify(token);
    if (!payload?.email) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    const user = await prisma.usuarioComun.findUnique({
      where: { email: payload.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 },
      );
    }

    const body = await request.json();
    const { id, all } = body;

    if (all) {
      await prisma.notificacion.updateMany({
        where: { userId: user.id, read: false },
        data: { read: true },
      });
    } else if (id) {
      await prisma.notificacion.update({
        where: { id, userId: user.id },
        data: { read: true },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating notifications:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
