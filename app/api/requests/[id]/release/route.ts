import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { tokenService } from "@/lib/auth/token.service";

export async function PATCH(
  _req: NextRequest,
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

    const solicitud = await prisma.solicitud.findUnique({
      where: { id },
      select: {
        id: true,
        estado: true,
        usuarioComunId: true,
        donanteAsignadoId: true,
      },
    });

    if (!solicitud) {
      return NextResponse.json({ error: "Solicitud no encontrada" }, { status: 404 });
    }

    // Solo el donante asignado puede liberar
    if (solicitud.donanteAsignadoId !== payload.userId) {
      return NextResponse.json(
        { error: "Solo el donante asignado puede liberar la solicitud" },
        { status: 403 }
      );
    }

    if (solicitud.estado !== "EN_PROCESO") {
      return NextResponse.json(
        { error: "Solo se pueden liberar solicitudes en proceso" },
        { status: 409 }
      );
    }

    // Limpiar asignación → solicitud vuelve a APROBADA para otros donantes
    await prisma.solicitud.update({
      where: { id },
      data: {
        estado: "APROBADA",
        donanteAsignadoId: null,
        assignedDate: null,
        farmaciaEntregaId: null,
        codigoComprobante: null,
        farmaciaConfirmada: null,
        motivoRechazoFarmacia: null,
      },
    });

    // Notificar al beneficiario
    await prisma.notificacion.create({
      data: {
        userId: solicitud.usuarioComunId,
        type: "SYSTEM",
        title: "Donante desvinculado",
        message:
          "El donante no pudo completar la entrega. Tu solicitud ha sido publicada nuevamente para que otros donantes puedan ayudarte.",
        link: `/dashboard/requests`,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Solicitud liberada. Vuelve a estar disponible para otros donantes.",
    });
  } catch (error) {
    console.error("Error releasing solicitud:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
