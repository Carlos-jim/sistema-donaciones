import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAdminFromCookie } from "@/lib/admin-auth";

export async function GET() {
  try {
    const admin = await getAdminFromCookie();
    if (!admin) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Gather all the data we can export
    const [
      usuarios,
      farmacias,
      supervisores,
      solicitudes,
      donaciones,
      medicamentos,
    ] = await Promise.all([
      prisma.usuarioComun.findMany({
        select: {
          id: true, nombre: true, email: true, cedula: true,
          telefono: true, createdAt: true,
          _count: { select: { solicitudes: true, donaciones: true } },
        },
      }),
      prisma.farmacia.findMany({
        select: {
          id: true, nombre: true, email: true, telefono: true,
          direccion: true, horario: true, activo: true, createdAt: true,
        },
      }),
      prisma.enteSalud.findMany({
        select: {
          id: true, nombre: true, email: true, telefono: true,
          direccion: true, aprobado: true, createdAt: true,
        },
      }),
      prisma.solicitud.findMany({
        select: {
          id: true, codigo: true, estado: true, tiempoEspera: true,
          motivo: true, requiresPrescription: true,
          rejectionReason: true, createdAt: true, updatedAt: true,
          usuarioComun: { select: { nombre: true, email: true } },
          medicamentos: {
            select: {
              cantidad: true,
              medicamento: { select: { nombre: true, presentacion: true } },
            },
          },
          farmaciaEntrega: { select: { nombre: true } },
        },
      }),
      prisma.donacion.findMany({
        select: {
          id: true, codigo: true, estado: true,
          createdAt: true, updatedAt: true,
          usuarioComun: { select: { nombre: true, email: true } },
          medicamentos: {
            select: {
              cantidad: true,
              medicamento: { select: { nombre: true, presentacion: true } },
            },
          },
          farmacia: { select: { nombre: true } },
        },
      }),
      prisma.medicamento.findMany({
        select: {
          id: true, nombre: true, principioActivo: true,
          presentacion: true, concentracion: true, activo: true, createdAt: true,
        },
      }),
    ]);

    const backup = {
      generatedAt: new Date().toISOString(),
      version: "1.0",
      data: {
        usuarios,
        farmacias,
        supervisores,
        solicitudes,
        donaciones,
        medicamentos,
      },
      stats: {
        totalUsuarios: usuarios.length,
        totalFarmacias: farmacias.length,
        totalSupervisores: supervisores.length,
        totalSolicitudes: solicitudes.length,
        totalDonaciones: donaciones.length,
        totalMedicamentos: medicamentos.length,
      },
    };

    return new NextResponse(JSON.stringify(backup, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="backup-donaciones-${new Date().toISOString().split("T")[0]}.json"`,
      },
    });
  } catch (error) {
    console.error("Error creating backup:", error);
    return NextResponse.json({ error: "Error al generar el backup" }, { status: 500 });
  }
}
