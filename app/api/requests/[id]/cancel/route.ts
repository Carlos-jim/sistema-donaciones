import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { tokenService } from "@/lib/auth/token.service";

const ESTADOS_CANCELABLES = ["PENDIENTE", "APROBADA"];

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
      return NextResponse.json(
        { error: "Solicitud no encontrada" },
        { status: 404 }
      );
    }

    // Solo el dueño puede cancelar
    if (solicitud.usuarioComunId !== payload.userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // Restricción: ya tiene donante asignado
    if (solicitud.donanteAsignadoId) {
      return NextResponse.json(
        {
          error:
            "No puedes cancelar esta solicitud porque ya hay un donante comprometido a ayudarte.",
        },
        { status: 409 }
      );
    }

    // Restricción: estado no cancelable
    if (!ESTADOS_CANCELABLES.includes(solicitud.estado)) {
      return NextResponse.json(
        {
          error: `No se puede cancelar una solicitud en estado "${solicitud.estado}".`,
        },
        { status: 409 }
      );
    }

    await prisma.solicitud.update({
      where: { id },
      data: { estado: "CANCELADA" },
    });

    return NextResponse.json({
      success: true,
      message: "Solicitud cancelada exitosamente.",
    });
  } catch (error) {
    console.error("Error cancelling solicitud:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
