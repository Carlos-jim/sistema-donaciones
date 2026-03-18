import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { tokenService } from "@/lib/auth/token.service";

function generateReceiptCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const timestamp = Date.now().toString(36).toUpperCase().slice(-4);
  let random = "";
  for (let i = 0; i < 4; i++) {
    random += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `DON-${timestamp}${random}`;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = (await cookies()).get("auth-token")?.value;
    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const payload = await tokenService.verify(token);
    if (!payload?.userId) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    const { id } = await params;
    const { pharmacyId } = await req.json();

    if (!pharmacyId) {
      return NextResponse.json({ error: "pharmacyId es requerido" }, { status: 400 });
    }

    const solicitud = await prisma.solicitud.findUnique({
      where: { id },
      select: {
        id: true,
        estado: true,
        usuarioComunId: true,
        donanteAsignadoId: true,
        farmaciaConfirmada: true,
      },
    });

    if (!solicitud) {
      return NextResponse.json({ error: "Solicitud no encontrada" }, { status: 404 });
    }

    // Solo el donante asignado puede cambiar la farmacia
    if (solicitud.donanteAsignadoId !== payload.userId) {
      return NextResponse.json(
        { error: "Solo el donante asignado puede cambiar la farmacia" },
        { status: 403 }
      );
    }

    if (solicitud.estado !== "EN_PROCESO") {
      return NextResponse.json(
        { error: "Solo se puede cambiar farmacia en solicitudes en proceso" },
        { status: 409 }
      );
    }

    // Solo permitir cambio si la farmacia fue rechazada
    if (solicitud.farmaciaConfirmada !== false) {
      return NextResponse.json(
        { error: "Solo se puede cambiar la farmacia si fue rechazada por el beneficiario" },
        { status: 409 }
      );
    }

    // Verificar que la nueva farmacia existe
    const farmacia = await prisma.farmacia.findUnique({
      where: { id: pharmacyId },
      select: { id: true, nombre: true, direccion: true },
    });

    if (!farmacia) {
      return NextResponse.json({ error: "Farmacia no encontrada" }, { status: 404 });
    }

    // Generar nuevo código de comprobante
    let codigoComprobante = generateReceiptCode();
    let attempts = 0;
    while (attempts < 5) {
      const existing = await prisma.solicitud.findUnique({ where: { codigoComprobante } });
      if (!existing) break;
      codigoComprobante = generateReceiptCode();
      attempts++;
    }

    // Actualizar farmacia y resetear confirmación a pendiente
    await prisma.solicitud.update({
      where: { id },
      data: {
        farmaciaEntregaId: pharmacyId,
        codigoComprobante,
        farmaciaConfirmada: null, // Pendiente de confirmación de nuevo
        motivoRechazoFarmacia: null,
      },
    });

    // Notificar al beneficiario de la nueva farmacia
    await prisma.notificacion.create({
      data: {
        userId: solicitud.usuarioComunId,
        type: "SYSTEM",
        title: "Nueva farmacia propuesta",
        message: `El donante ha seleccionado una nueva farmacia: ${farmacia.nombre} (${farmacia.direccion}). Por favor confirma si estás de acuerdo.`,
        link: `/dashboard/requests`,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Farmacia actualizada. El beneficiario será notificado.",
      data: { codigoComprobante, farmacia: { nombre: farmacia.nombre, direccion: farmacia.direccion } },
    });
  } catch (error) {
    console.error("Error changing pharmacy:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
