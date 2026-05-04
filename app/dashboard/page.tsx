import { cookies } from "next/headers";
import { tokenService } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DashboardClient from "./client-dashboard";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;
  let userLocation = null;

  if (token) {
    const payload = await tokenService.verify(token);

    if (payload?.email) {
      const user = await prisma.usuarioComun.findUnique({
        where: { email: payload.email },
        select: { direccion: true },
      });

      if (user?.direccion) {
        userLocation = user.direccion as { lat: number; lng: number };
      }
    }
  }

  // Calculate real statistics
  const totalSolicitudes = await prisma.solicitud.count();
  const totalDonaciones = await prisma.donacion.count();
  
  const solicitudesAtendidas = await prisma.solicitud.count({
    where: {
      estado: {
        in: ['RECIBIDA', 'LISTA_PARA_RETIRO', 'COMPLETADA', 'EN_PROCESO']
      }
    }
  });

  const tasaExito = totalSolicitudes > 0 
    ? Math.round((solicitudesAtendidas / totalSolicitudes) * 100) 
    : 0;

  const topMedicamentosDb = await prisma.solicitudMedicamento.groupBy({
    by: ['medicamentoId'],
    _count: {
      medicamentoId: true
    },
    orderBy: {
      _count: {
        medicamentoId: 'desc'
      }
    },
    take: 5
  });

  const medIds = topMedicamentosDb.map(m => m.medicamentoId);
  const meds = await prisma.medicamento.findMany({
    where: { id: { in: medIds } }
  });

  const medicamentosMasSolicitados = topMedicamentosDb.map(item => {
    const med = meds.find(m => m.id === item.medicamentoId);
    return {
      label: med?.nombre || 'Desconocido',
      value: `${item._count.medicamentoId} solicitudes`
    };
  });

  // Actividad reciente
  const recentDonations = await prisma.donacion.findMany({
    take: 4,
    orderBy: { createdAt: 'desc' },
    include: {
      medicamentos: {
        include: { medicamento: true }
      }
    }
  });

  const recentRequests = await prisma.solicitud.findMany({
    take: 4,
    orderBy: { createdAt: 'desc' },
    include: {
      medicamentos: {
        include: { medicamento: true }
      }
    }
  });

  const rawActivities = [
    ...recentDonations.map(d => {
       const medName = d.medicamentos[0]?.medicamento?.nombre || 'medicamento';
       let text = `Nueva donación de ${medName}`;
       if (d.estado === 'DISPONIBLE') text = `Nueva oferta pública: ${medName}`;
       else if (d.estado === 'ENTREGADA') text = `Se confirmó una donación de ${medName}`;
       return {
         text,
         date: d.createdAt
       }
    }),
    ...recentRequests.map(r => {
       const medName = r.medicamentos[0]?.medicamento?.nombre || 'medicamento';
       let text = `Nueva solicitud: ${medName}`;
       if (r.estado === 'COMPLETADA') text = `Solicitud completada: ${medName}`;
       else if (r.estado === 'LISTA_PARA_RETIRO') text = `Solicitud atendida con retiro en farmacia`;
       return {
         text,
         date: r.createdAt
       }
    })
  ];

  rawActivities.sort((a, b) => b.date.getTime() - a.date.getTime());
  const actividadReciente = rawActivities.slice(0, 4).map(activity => ({
    text: activity.text,
    time: `Hace ${formatDistanceToNow(activity.date, { locale: es })}`
  }));

  const statistics = {
    totalSolicitudes,
    totalDonaciones,
    solicitudesAtendidas,
    tasaExito,
    topMedicamentos: medicamentosMasSolicitados.length > 0 ? medicamentosMasSolicitados : [{ label: "Sin datos", value: "0" }],
    actividadReciente: actividadReciente.length > 0 ? actividadReciente : [{ text: "Sin actividad reciente", time: "Reciente" }]
  };

  return <DashboardClient initialUserLocation={userLocation} statistics={statistics} />;
}
