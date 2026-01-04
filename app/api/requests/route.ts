import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { motivo, medicamentos, ubicacion, requiereReceta } = body;

    // TODO: Get the actual user ID from the session
    // For now, we'll create a placeholder user or use an existing one
    let usuario = await prisma.usuarioComun.findFirst();

    if (!usuario) {
      // Create a default user for testing
      usuario = await prisma.usuarioComun.create({
        data: {
          nombre: "Usuario de Prueba",
          email: "test@example.com",
          password: "placeholder",
        },
      });
    }

    // Create the solicitud
    const solicitud = await prisma.solicitud.create({
      data: {
        motivo: motivo || null,
        latitude: ubicacion?.lat || null,
        longitude: ubicacion?.lng || null,
        requiresPrescription: requiereReceta || false,
        usuarioComunId: usuario.id,
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
    }

    return NextResponse.json(
      {
        success: true,
        message: "Solicitud creada exitosamente",
        solicitudId: solicitud.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating solicitud:", error);
    return NextResponse.json(
      { error: "Error al crear la solicitud" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const solicitudes = await prisma.solicitud.findMany({
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
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(solicitudes);
  } catch (error) {
    console.error("Error fetching solicitudes:", error);
    return NextResponse.json(
      { error: "Error al obtener las solicitudes" },
      { status: 500 }
    );
  }
}
