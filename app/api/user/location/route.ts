import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { lat, lng } = body;

    if (lat === undefined || lng === undefined) {
      return NextResponse.json(
        { error: "Latitud y longitud son requeridas" },
        { status: 400 },
      );
    }

    // TODO: Get real user authentication
    // Mimicking existing behavior from other routes
    const usuario = await prisma.usuarioComun.findFirst();

    if (!usuario) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 },
      );
    }

    // Prepare address object
    // Note: In a real app we might want to reverse geocode here or expect address string
    const locationData = {
      lat,
      lng,
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
    console.error("Error upgrading user location:", error);
    return NextResponse.json(
      { error: "Error al actualizar la ubicación" },
      { status: 500 },
    );
  }
}
