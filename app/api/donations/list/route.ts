import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { tokenService } from "@/lib/auth/token.service";
import { signDeliveryQrPayload } from "@/lib/delivery-codes";
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

    if (!payload || !payload.userId) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
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
        estado: true,
        motivo: true,
        assignedDate: true,
        fechaRecepcionFarmacia: true,
        fechaListaRetiro: true,
        fechaLimiteRetiro: true,
        fechaRetiro: true,
        codigoEntregaDonante: true,
        codigoRetiroSolicitante: true,
        farmaciaEntregaId: true,
        medicamentos: {
          include: {
            medicamento: true,
          },
        },
        farmaciaEntrega: {
          select: {
            id: true,
            nombre: true,
            direccion: true,
            latitude: true,
            longitude: true,
          },
        },
      },
      orderBy: {
        assignedDate: "desc",
      },
    });

    const deliveriesWithQr = await Promise.all(
      acceptedDeliveries.map(async (delivery) => {
        let donorQrPayload: string | null = null;
        let requesterQrPayload: string | null = null;

        if (delivery.codigoEntregaDonante && delivery.farmaciaEntregaId) {
          donorQrPayload = await signDeliveryQrPayload({
            solicitudId: delivery.id,
            pharmacyId: delivery.farmaciaEntregaId,
            code: delivery.codigoEntregaDonante,
            role: "DONOR_DELIVERY",
          });
        }

        if (delivery.codigoRetiroSolicitante && delivery.farmaciaEntregaId) {
          requesterQrPayload = await signDeliveryQrPayload({
            solicitudId: delivery.id,
            pharmacyId: delivery.farmaciaEntregaId,
            code: delivery.codigoRetiroSolicitante,
            role: "REQUESTER_PICKUP",
          });
        }

        return {
          id: delivery.id,
          estado: delivery.estado,
          motivo: delivery.motivo,
          assignedDate: delivery.assignedDate,
          fechaRecepcionFarmacia: delivery.fechaRecepcionFarmacia,
          fechaListaRetiro: delivery.fechaListaRetiro,
          fechaLimiteRetiro: delivery.fechaLimiteRetiro,
          fechaRetiro: delivery.fechaRetiro,
          codigoEntregaDonante: delivery.codigoEntregaDonante,
          codigoRetiroSolicitante: delivery.codigoRetiroSolicitante,
          farmaciaEntrega: delivery.farmaciaEntrega,
          medicamentos: delivery.medicamentos,
          beneficiaryLabel: "Beneficiario anónimo",
          donorQrPayload,
          requesterQrPayload,
        };
      }),
    );

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
