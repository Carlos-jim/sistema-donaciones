import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { tokenService } from "@/lib/auth/token.service";

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
    const { confirmed, motivo } = await req.json();

    if (typeof confirmed !== "boolean") {
      return NextResponse.json(
        { error: "El campo 'confirmed' es requerido (true/false)" },
        { status: 400 }
      );
    }

    const solicitud = await prisma.solicitud.findUnique({
      where: { id },
      select: {
        id: true,
        estado: true,
        usuarioComunId: true,
        donanteAsignadoId: true,
        farmaciaEntregaId: true,
        farmaciaConfirmada: true,
        farmaciaEntrega: { select: { nombre: true } },
      },
    });

    if (!solicitud) {
      return NextResponse.json({ error: "Solicitud no encontrada" }, { status: 404 });
    }

    // Solo el beneficiario puede confirmar/rechazar
    if (solicitud.usuarioComunId !== payload.userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    if (solicitud.estado !== "EN_PROCESO") {
      return NextResponse.json(
        { error: "Solo se puede confirmar/rechazar farmacia en solicitudes en proceso" },
        { status: 409 }
      );
    }

    if (!solicitud.farmaciaEntregaId) {
      return NextResponse.json(
        { error: "No hay farmacia asignada para confirmar" },
        { status: 409 }
      );
    }

    if (confirmed) {
      // Beneficiario confirma la farmacia
      await prisma.solicitud.update({
        where: { id },
        data: {
          farmaciaConfirmada: true,
          motivoRechazoFarmacia: null,
        },
      });

      // Notificar al donante
      if (solicitud.donanteAsignadoId) {
        await prisma.notificacion.create({
          data: {
            userId: solicitud.donanteAsignadoId,
            type: "SYSTEM",
            title: "Farmacia confirmada",
            message: `El beneficiario ha confirmado la farmacia ${solicitud.farmaciaEntrega?.nombre}. Puedes proceder con la entrega.`,
            link: `/dashboard/donations`,
          },
        });
      }

      return NextResponse.json({
        success: true,
        message: "Farmacia confirmada exitosamente.",
      });
    } else {
      // Beneficiario rechaza la farmacia
      if (!motivo?.trim()) {
        return NextResponse.json(
          { error: "Debes indicar un motivo para rechazar la farmacia" },
          { status: 400 }
        );
      }

      await prisma.solicitud.update({
        where: { id },
        data: {
          farmaciaConfirmada: false,
          motivoRechazoFarmacia: motivo.trim(),
        },
      });

      // Notificar al donante del rechazo
      if (solicitud.donanteAsignadoId) {
        await prisma.notificacion.create({
          data: {
            userId: solicitud.donanteAsignadoId,
            type: "SYSTEM",
            title: "Farmacia rechazada por el beneficiario",
            message: `El beneficiario no está de acuerdo con la farmacia "${solicitud.farmaciaEntrega?.nombre}". Motivo: ${motivo.trim()}. Puedes seleccionar otra farmacia o liberar la solicitud.`,
            link: `/dashboard/donations`,
          },
        });
      }

      return NextResponse.json({
        success: true,
        message: "Farmacia rechazada. El donante será notificado.",
      });
    }
  } catch (error) {
    console.error("Error confirming pharmacy:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
