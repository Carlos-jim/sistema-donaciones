import { prisma } from "@/lib/prisma";
import { Package, Clock, Activity, ArrowRight } from "lucide-react";
import Link from "next/link";

export default async function PharmacyDashboardPage() {
  // Fetch stats (mocked or real count queries)
  const receivedDonationsCount = await prisma.donacion.count({
    where: { estado: "RECIBIDA" },
  });

  const pendingRequestsCount = await prisma.solicitud.count({
    where: { estado: { in: ["RECIBIDA", "LISTA_PARA_RETIRO"] } },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-gray-900">
          Dashboard
        </h2>
        <p className="text-gray-500">
          Resumen de actividad e inventario de la farmacia.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="flex flex-col space-y-1.5 pb-2">
            <h3 className="text-sm font-medium text-gray-500">En Inventario</h3>
            <div className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Package className="h-5 w-5 text-teal-600" />
              {receivedDonationsCount}
            </div>
            <p className="text-xs text-gray-500">
              Donaciones recibidas físicamente
            </p>
          </div>
        </div>
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="flex flex-col space-y-1.5 pb-2">
            <h3 className="text-sm font-medium text-gray-500">
              Solicitudes Activas
            </h3>
            <div className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              {pendingRequestsCount}
            </div>
            <p className="text-xs text-gray-500">En proceso de entrega</p>
          </div>
        </div>
      </div>

      {/* Quick Actions / Recent Activity Placeholder */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4 rounded-xl border bg-white shadow-sm">
          <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">
              Accesos Rápidos
            </h3>
          </div>
          <div className="p-6 pt-0 grid gap-4">
            <Link
              href="/pharmacy/reception"
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
            >
              <div className="flex items-center gap-4">
                <div className="p-2 bg-teal-100 rounded-full group-hover:bg-teal-200 transaction-colors">
                  <Activity className="h-5 w-5 text-teal-700" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    Procesar Recepción
                  </p>
                  <p className="text-sm text-gray-500">
                    Ingresar código de donación o solicitud
                  </p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
