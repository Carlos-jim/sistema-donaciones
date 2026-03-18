import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { tokenService } from "@/lib/auth/token.service";

export async function GET() {
  try {
    const token = (await cookies()).get("auth-token")?.value;

    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const payload = await tokenService.verify(token);

    if (!payload || !payload.userId) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    const donacionesPropia = await prisma.donacion.findMany({
      where: {
        usuarioComunId: payload.userId,
      },
      include: {
        medicamentos: {
          include: {
            medicamento: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const solicitudesAceptadas = await prisma.solicitud.findMany({
      where: {
        donanteAsignadoId: payload.userId,
      },
      include: {
        medicamentos: {
          include: {
            medicamento: true,
          },
        },
        farmaciaEntrega: true,
      },
      orderBy: {
        assignedDate: "desc",
      },
    });

    // Normalize and combine
    const united = [
      ...donacionesPropia.map((d) => ({
        ...d,
        type: "DONATION_OFFER",
        // Map fields to a common structure if needed, or keep as is
      })),
      ...solicitudesAceptadas.map((s) => ({
        id: s.id,
        codigo: s.codigoComprobante || s.codigo,
        descripcion: s.motivo,
        donationPhotoUrl: null,
        recipePhotoUrl: s.recipePhotoUrl,
        estado: s.estado,
        direccion: s.farmaciaEntrega
          ? {
            calle: s.farmaciaEntrega.direccion,
            lat: s.farmaciaEntrega.latitude || 0,
            long: s.farmaciaEntrega.longitude || 0,
          }
          : null,
        createdAt: s.assignedDate || s.createdAt,
        type: "ACCEPTED_REQUEST",
        farmaciaConfirmada: s.farmaciaConfirmada,
        motivoRechazoFarmacia: s.motivoRechazoFarmacia,
        deliveryConfirmedAt: s.deliveryConfirmedAt,
        farmaciaEntrega: s.farmaciaEntrega
          ? { id: s.farmaciaEntrega.id, nombre: s.farmaciaEntrega.nombre, direccion: s.farmaciaEntrega.direccion }
          : null,
        medicamentos: s.medicamentos.map((sm) => ({
          cantidad: sm.cantidad,
          fechaExpiracion: null,
          medicamento: sm.medicamento
        })),
        requesterName: "Beneficiario Anónimo"
      })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json(united);
  } catch (error) {
    console.error("Error fetching donations:", error);
    return NextResponse.json(
      { error: "Error al obtener las donaciones" },
      { status: 500 },
    );
  }
}
