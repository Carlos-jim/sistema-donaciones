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
        pickupConfirmedAt: true,
        farmaciaEntregaId: true,
        farmaciaEntrega: { select: { nombre: true } },
        donanteAsignadoId: true,
      },
    });

    if (!solicitud) {
      return NextResponse.json({ error: "Solicitud no encontrada" }, { status: 404 });
    }

    if (solicitud.usuarioComunId !== payload.userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    if (solicitud.estado !== "LISTA_PARA_RETIRO") {
      return NextResponse.json(
        { error: "Solo puedes confirmar retiro cuando la solicitud está lista para retiro" },
        { status: 409 }
      );
    }

    if (solicitud.pickupConfirmedAt) {
      return NextResponse.json(
        { error: "Ya confirmaste que irás a retirar" },
        { status: 409 }
      );
    }

    await prisma.solicitud.update({
      where: { id },
      data: { pickupConfirmedAt: new Date() },
    });

    // Notificar al donante
    if (solicitud.donanteAsignadoId) {
      await prisma.notificacion.create({
        data: {
          userId: solicitud.donanteAsignadoId,
          type: "SYSTEM",
          title: "El beneficiario irá a retirar",
          message: `El beneficiario ha confirmado que irá a retirar el medicamento en ${solicitud.farmaciaEntrega?.nombre}.`,
          link: `/dashboard/donations`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Has confirmado que irás a retirar. La farmacia ha sido notificada.",
    });
  } catch (error) {
    console.error("Error confirming pickup:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
