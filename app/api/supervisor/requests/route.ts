import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionForRole } from "@/lib/auth/server-session";

export async function GET() {
  try {
    const session = await getSessionForRole("SUPERVISOR");

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const ente = await prisma.enteSalud.findUnique({
      where: { id: session.userId },
      select: { id: true, aprobado: true },
    });

    if (!ente || !ente.aprobado) {
      return NextResponse.json(
        { error: "Supervisor no autorizado" },
        { status: 403 },
      );
    }

    const requests = await prisma.solicitud.findMany({
      where: {
        estado: {
          in: ["PENDIENTE", "APROBADA", "RECHAZADA"],
        },
      },
      select: {
        id: true,
        createdAt: true,
        updatedAt: true,
        estado: true,
        recipePhotoUrl: true,
        motivo: true,
        tiempoEspera: true,
        rejectionReason: true,
        approvalDate: true,
        approvalInstitution: true,
        donanteAsignadoId: true,
        donanteAsignado: {
          select: {
            nombre: true,
            cedula: true,
            email: true,
          },
        },
        usuarioComun: {
          select: {
            nombre: true,
            cedula: true,
            email: true,
            telefono: true,
          },
        },
        medicamentos: {
          select: {
            id: true,
            cantidad: true,
            prioridad: true,
            prioridadOriginal: true,
            fechaModificacionPrioridad: true,
            prioridadModificadaPor: {
              select: {
                nombre: true,
              },
            },
            medicamento: {
              select: {
                nombre: true,
                presentacion: true,
              },
            },
          },
        },
        farmacia: {
          select: {
            id: true,
            nombre: true,
            direccion: true,
          },
        },
      },
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ requests }, { status: 200 });
  } catch (error) {
    console.error("Error al obtener solicitudes de supervisor:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
