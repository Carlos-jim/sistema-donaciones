import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { tokenService } from "@/lib/auth/token.service";
import { signDeliveryQrPayload } from "@/lib/delivery-codes";
import { processAbandonedPickups } from "@/lib/abandoned-pickups.service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      motivo,
      medicamentos,
      ubicacion,
      requiereReceta,
      tiempoEspera,
      recipePhotoUrl,
    } = body;

    const token = (await cookies()).get("auth-token")?.value;

    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const payload = await tokenService.verify(token);

    if (!payload || !payload.userId) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    // Assign to the verified user
    const userId = payload.userId;

    // Generate a unique code
    const generateCode = () => {
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      let code = "";
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return code;
    };

    let codigo = generateCode();
    // Simple retry logic unique check (optional but recommended)
    // For MVP/Demo scale, probability is low, but let's be safe-ish or just assume unique for now.
    // If collision, Prisma will throw, so we could wrap in loop, but let's keep it simple.

    // Create the solicitud
    const solicitud = await prisma.solicitud.create({
      data: {
        codigo: codigo,
        motivo: motivo || null,
        direccion: ubicacion
          ? {
              calle: ubicacion.address || "Ubicación seleccionada en mapa",
              lat: ubicacion.lat,
              long: ubicacion.lng,
            }
          : Prisma.JsonNull,
        requiresPrescription: requiereReceta || false,
        recipePhotoUrl: recipePhotoUrl || null,
        tiempoEspera: tiempoEspera || "BAJO", // Default to BAJO
        usuarioComunId: userId,
      },
    });

    // Create or find medicamentos and link them to the solicitud
    for (const med of medicamentos) {
      // Find or create the medicamento
      let medicamento = await prisma.medicamento.findFirst({
        where: { nombre: med.nombre },
      });

      if (!medicamento) {
        medicamento = await prisma.medicamento.create({
          data: {
            nombre: med.nombre,
            presentacion: med.unidad,
          },
        });
      }

      // Create the relation
      await prisma.solicitudMedicamento.create({
        data: {
          solicitudId: solicitud.id,
          medicamentoId: medicamento.id,
          cantidad: med.cantidad || 1,
          prioridad: 1,
        },
      });

      // Find matching donations (available)
      const matchingDonations = await prisma.donacionMedicamento.findMany({
        where: {
          medicamentoId: medicamento.id,
          donacion: {
            estado: "DISPONIBLE",
          },
        },
        include: {
          donacion: true,
        },
      });

      // Notify donors
      for (const match of matchingDonations) {
        if (match.donacion.usuarioComunId) {
          await prisma.notificacion.create({
            data: {
              userId: match.donacion.usuarioComunId,
              type: "MATCH_REQUEST",
              title: "¡Alguien necesita tu donación!",
              message: `Se ha solicitado ${med.nombre}, un medicamento que tienes disponible.`,
              link: "/dashboard/requests",
            },
          });
        }
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: "Solicitud creada exitosamente",
        solicitudId: solicitud.id,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating solicitud:", error);
    return NextResponse.json(
      { error: "Error al crear la solicitud" },
      { status: 500 },
    );
  }
}

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

    const solicitudes = await prisma.solicitud.findMany({
      where: {
        usuarioComunId: payload.userId,
      },
      include: {
        usuarioComun: {
          select: {
            nombre: true,
            email: true,
          },
        },
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
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const enriched = await Promise.all(
      solicitudes.map(async (solicitud) => {
        let requesterQrPayload: string | null = null;

        if (
          solicitud.codigoRetiroSolicitante &&
          solicitud.farmaciaEntregaId &&
          solicitud.estado === "LISTA_PARA_RETIRO"
        ) {
          requesterQrPayload = await signDeliveryQrPayload({
            solicitudId: solicitud.id,
            pharmacyId: solicitud.farmaciaEntregaId,
            code: solicitud.codigoRetiroSolicitante,
            role: "REQUESTER_PICKUP",
          });
        }

        return {
          ...solicitud,
          requesterQrPayload,
        };
      }),
    );

    return NextResponse.json(enriched);
  } catch (error) {
    console.error("Error fetching solicitudes:", error);
    return NextResponse.json(
      { error: "Error al obtener las solicitudes" },
      { status: 500 },
    );
  }
}
