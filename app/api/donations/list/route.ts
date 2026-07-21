import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { tokenService } from "@/lib/auth/token.service";
import { getReadableQrPayload } from "@/lib/delivery-codes";
import { processAbandonedPickups } from "@/lib/abandoned-pickups.service";

export async function GET() {
  try {
    try {
      await processAbandonedPickups(new Date());
    } catch (maintenanceError) {
      console.error(
        "Background abandoned pickup processing failed:",
        maintenanceError,
      );
    }

    const token = (await cookies()).get("auth-token")?.value;

    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const payload = await tokenService.verify(token);

    if (!payload?.userId) {
      return NextResponse.json({ error: "Token invalido" }, { status: 401 });
    }

    const ownOffers = await prisma.donacion.findMany({
      where: {
        usuarioComunId: payload.userId,
      },
      include: {
        farmacia: {
          select: {
            id: true,
            nombre: true,
            direccion: true,
            latitude: true,
            longitude: true,
          },
        },
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

    const acceptedDeliveries = await prisma.solicitud.findMany({
      where: {
        donanteAsignadoId: payload.userId,
      },
      select: {
        id: true,
        createdAt: true,
        estado: true,
        motivo: true,
        assignedDate: true,
        codigoComprobante: true,
        codigoEntregaDonante: true,
        farmaciaConfirmada: true,
        motivoRechazoFarmacia: true,
        deliveryConfirmedAt: true,
        farmaciaEntregaId: true,
        farmaciaEntrega: {
          select: {
            id: true,
            nombre: true,
            direccion: true,
            latitude: true,
            longitude: true,
          },
        },
        medicamentos: {
          include: {
            medicamento: true,
          },
        },
      },
      orderBy: {
        assignedDate: "desc",
      },
    });

    const deliveriesWithQr = acceptedDeliveries.map((delivery) => ({
      ...delivery,
      donorQrPayload: delivery.codigoEntregaDonante
        ? getReadableQrPayload(delivery.codigoEntregaDonante)
        : null,
    }));

    return NextResponse.json({
      ownOffers,
      acceptedDeliveries: deliveriesWithQr,
    });
  } catch (error) {
    console.error("Error fetching donations:", error);
    return NextResponse.json(
      { error: "Error al obtener las donaciones" },
      { status: 500 },
    );
  }
}
