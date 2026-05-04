import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAdminFromCookie } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminFromCookie();
    if (!admin) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "general";

    if (type === "general") {
      const [
        totalUsuarios,
        totalFarmacias,
        totalSupervisores,
        totalSolicitudes,
        totalDonaciones,
        solicitudesPorEstado,
        donacionesPorEstado,
        topMedicamentos,
        ultimasSolicitudes,
        ultimasDonaciones,
      ] = await Promise.all([
        prisma.usuarioComun.count(),
        prisma.farmacia.count({ where: { activo: true } }),
        prisma.enteSalud.count({ where: { aprobado: true } }),
        prisma.solicitud.count(),
        prisma.donacion.count(),
        prisma.solicitud.groupBy({ by: ["estado"], _count: { estado: true } }),
        prisma.donacion.groupBy({ by: ["estado"], _count: { estado: true } }),
        prisma.solicitudMedicamento.groupBy({
          by: ["medicamentoId"],
          _count: { medicamentoId: true },
          orderBy: { _count: { medicamentoId: "desc" } },
          take: 10,
        }),
        prisma.solicitud.findMany({
          take: 20,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            createdAt: true,
            estado: true,
            tiempoEspera: true,
            usuarioComun: { select: { nombre: true, email: true } },
            medicamentos: { select: { medicamento: { select: { nombre: true } }, cantidad: true } },
          },
        }),
        prisma.donacion.findMany({
          take: 20,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            createdAt: true,
            estado: true,
            usuarioComun: { select: { nombre: true, email: true } },
            medicamentos: { select: { medicamento: { select: { nombre: true } }, cantidad: true } },
          },
        }),
      ]);

      const medIds = topMedicamentos.map((m) => m.medicamentoId);
      const meds = await prisma.medicamento.findMany({
        where: { id: { in: medIds } },
        select: { id: true, nombre: true },
      });

      const topMeds = topMedicamentos.map((item) => ({
        nombre: meds.find((m) => m.id === item.medicamentoId)?.nombre ?? "Desconocido",
        totalSolicitudes: item._count.medicamentoId,
      }));

      return NextResponse.json({
        resumen: {
          totalUsuarios,
          totalFarmacias,
          totalSupervisores,
          totalSolicitudes,
          totalDonaciones,
          solicitudesAtendidas: solicitudesPorEstado
            .filter((s) => ["COMPLETADA", "LISTA_PARA_RETIRO", "EN_PROCESO"].includes(s.estado))
            .reduce((acc, s) => acc + s._count.estado, 0),
        },
        solicitudesPorEstado: solicitudesPorEstado.map((s) => ({
          estado: s.estado,
          cantidad: s._count.estado,
        })),
        donacionesPorEstado: donacionesPorEstado.map((d) => ({
          estado: d.estado,
          cantidad: d._count.estado,
        })),
        topMedicamentos: topMeds,
        ultimasSolicitudes,
        ultimasDonaciones,
      });
    }

    if (type === "usuarios") {
      const usuarios = await prisma.usuarioComun.findMany({
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          nombre: true,
          email: true,
          cedula: true,
          telefono: true,
          createdAt: true,
          _count: {
            select: { solicitudes: true, donaciones: true },
          },
        },
      });
      return NextResponse.json(usuarios);
    }

    if (type === "donaciones") {
      const donaciones = await prisma.donacion.findMany({
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          codigo: true,
          estado: true,
          createdAt: true,
          usuarioComun: { select: { nombre: true, email: true } },
          medicamentos: {
            select: {
              medicamento: { select: { nombre: true, presentacion: true } },
              cantidad: true,
            },
          },
          farmacia: { select: { nombre: true } },
        },
      });
      return NextResponse.json(donaciones);
    }

    if (type === "solicitudes") {
      const solicitudes = await prisma.solicitud.findMany({
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          codigo: true,
          estado: true,
          tiempoEspera: true,
          motivo: true,
          createdAt: true,
          requiresPrescription: true,
          usuarioComun: { select: { nombre: true, email: true } },
          medicamentos: {
            select: {
              medicamento: { select: { nombre: true } },
              cantidad: true,
              prioridad: true,
            },
          },
          farmaciaEntrega: { select: { nombre: true } },
        },
      });
      return NextResponse.json(solicitudes);
    }

    return NextResponse.json({ error: "Tipo de reporte no válido" }, { status: 400 });
  } catch (error) {
    console.error("Error generating report:", error);
    return NextResponse.json({ error: "Error al generar el informe" }, { status: 500 });
  }
}
