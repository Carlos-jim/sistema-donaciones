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
        codigo: s.codigoComprobante || s.codigo, // Use receipt code if available
        descripcion: s.motivo,
        donationPhotoUrl: null, // Requests don't have donation photos usually
        recipePhotoUrl: s.recipePhotoUrl, // Important: Include recipe photo
        estado: s.estado,
        direccion: s.farmaciaEntrega
          ? {
            calle: s.farmaciaEntrega.direccion,
            lat: s.farmaciaEntrega.latitude || 0,
            long: s.farmaciaEntrega.longitude || 0,
          }
          : null, // Or user location if needed
        createdAt: s.assignedDate || s.createdAt,
        type: "ACCEPTED_REQUEST",
        medicamentos: s.medicamentos.map((sm) => ({
          cantidad: sm.cantidad,
          fechaExpiracion: null, // Requests usually don't have this info until donation
          medicamento: sm.medicamento
        })),
        requesterName: "Beneficiario Anónimo" // Or fetch user name
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
