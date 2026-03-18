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
        receptionConfirmedAt: true,
        donanteAsignadoId: true,
        farmaciaEntrega: { select: { nombre: true } },
      },
    });

    if (!solicitud) {
      return NextResponse.json({ error: "Solicitud no encontrada" }, { status: 404 });
    }

    if (solicitud.usuarioComunId !== payload.userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // El beneficiario puede confirmar recepción cuando la farmacia ya marcó COMPLETADA
    if (solicitud.estado !== "COMPLETADA") {
      return NextResponse.json(
        { error: "Solo puedes confirmar recepción cuando la solicitud está completada por la farmacia" },
        { status: 409 }
      );
    }

    if (solicitud.receptionConfirmedAt) {
      return NextResponse.json(
        { error: "Ya confirmaste la recepción" },
        { status: 409 }
      );
    }

    await prisma.solicitud.update({
      where: { id },
      data: { receptionConfirmedAt: new Date() },
    });

    // Notificar al donante de que el beneficiario confirmó recepción
    if (solicitud.donanteAsignadoId) {
      await prisma.notificacion.create({
        data: {
          userId: solicitud.donanteAsignadoId,
          type: "SYSTEM",
          title: "Donación recibida con éxito",
          message: `El beneficiario ha confirmado que recibió el medicamento. ¡Gracias por tu ayuda!`,
          link: `/dashboard/donations`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Has confirmado la recepción del medicamento.",
    });
  } catch (error) {
    console.error("Error confirming reception:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
