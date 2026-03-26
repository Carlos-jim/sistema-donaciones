import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { tokenService } from "@/lib/auth/token.service";

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const token = (await cookies()).get("auth-token")?.value;
    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const payload = await tokenService.verify(token);
    if (!payload?.userId) {
      return NextResponse.json({ error: "Token invalido" }, { status: 401 });
    }

    const { id } = await params;

    const solicitud = await prisma.solicitud.findUnique({
      where: { id },
      select: {
        id: true,
        estado: true,
        donanteAsignadoId: true,
        usuarioComunId: true,
        deliveryConfirmedAt: true,
        farmaciaEntrega: { select: { nombre: true } },
        codigoRetiroSolicitante: true,
      },
    });

    if (!solicitud) {
      return NextResponse.json(
        { error: "Solicitud no encontrada" },
        { status: 404 },
      );
    }

    if (solicitud.donanteAsignadoId !== payload.userId) {
      return NextResponse.json(
        { error: "Solo el donante asignado puede confirmar la entrega" },
        { status: 403 },
      );
    }

    if (solicitud.estado !== "EN_PROCESO") {
      return NextResponse.json(
        { error: "Solo se puede confirmar entrega en solicitudes en proceso" },
        { status: 409 },
      );
    }

    if (solicitud.deliveryConfirmedAt) {
      return NextResponse.json(
        { error: "Ya confirmaste la entrega" },
        { status: 409 },
      );
    }

    await prisma.solicitud.update({
      where: { id },
      data: { deliveryConfirmedAt: new Date() },
    });

    await prisma.notificacion.create({
      data: {
        userId: solicitud.usuarioComunId,
        type: "SYSTEM",
        title: "El donante entrego en la farmacia",
        message: `El donante ha confirmado que entrego el medicamento en ${solicitud.farmaciaEntrega?.nombre}. La farmacia lo validara pronto. Tu codigo de retiro es ${solicitud.codigoRetiroSolicitante || "N/A"}.`,
        link: "/dashboard/requests",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Entrega confirmada. La farmacia validara el medicamento.",
    });
  } catch (error) {
    console.error("Error confirming delivery:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
