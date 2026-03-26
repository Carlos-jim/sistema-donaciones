import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { tokenService } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function PUT(request: Request) {
  try {
    const token = (await cookies()).get("auth-token")?.value;

    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const payload = await tokenService.verify(token);
    if (!payload?.userId) {
      return NextResponse.json({ error: "Token invalido" }, { status: 401 });
    }

    const body = await request.json();
    const { lat, lng, address } = body;

    if (lat === undefined || lng === undefined) {
      return NextResponse.json(
        { error: "Latitud y longitud son requeridas" },
        { status: 400 },
      );
    }

    const usuario = await prisma.usuarioComun.findUnique({
      where: { id: payload.userId },
    });

    if (!usuario) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 },
      );
    }

    const locationData = {
      lat,
      lng,
      address,
      updatedAt: new Date().toISOString(),
    };

    const updatedUser = await prisma.usuarioComun.update({
      where: { id: usuario.id },
      data: {
        direccion: locationData,
      },
    });

    return NextResponse.json({
      success: true,
      location: updatedUser.direccion,
    });
  } catch (error) {
    console.error("Error updating user location:", error);
    return NextResponse.json(
      { error: "Error al actualizar la ubicacion" },
      { status: 500 },
    );
  }
}
