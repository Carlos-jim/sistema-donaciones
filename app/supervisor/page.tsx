import { CheckCircle2, ClipboardList, XCircle } from "lucide-react";
import { getSupervisorRequests } from "./actions";
import RequestsInbox from "./requests-inbox";

export const dynamic = "force-dynamic";

export default async function SupervisorDashboard() {
  const requests = await getSupervisorRequests();

  const pendingCount = requests.filter((request) => request.estado === "PENDIENTE").length;
  const approvedCount = requests.filter((request) => request.estado === "APROBADA").length;
  const rejectedCount = requests.filter((request) => request.estado === "RECHAZADA").length;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">
          Gestion de Solicitudes
        </h2>
        <p className="mt-1 text-gray-500">
          Revisa pendientes, consulta las aprobadas y corrige rapido si te equivocas.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          {
            label: "Pendientes",
            value: pendingCount,
            icon: ClipboardList,
            iconBg: "bg-yellow-50",
            iconColor: "text-yellow-600",
            valueColor: "text-gray-900",
          },
          {
            label: "Aprobadas",
            value: approvedCount,
            icon: CheckCircle2,
            iconBg: "bg-teal-50",
            iconColor: "text-teal-600",
            valueColor: "text-teal-700",
          },
          {
            label: "Rechazadas",
            value: rejectedCount,
            icon: XCircle,
            iconBg: "bg-red-50",
            iconColor: "text-red-500",
            valueColor: "text-red-600",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
          >
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${stat.iconBg}`}
            >
              <stat.icon className={`h-6 w-6 ${stat.iconColor}`} />
            </div>
            <div>
              <p className={`text-2xl font-bold ${stat.valueColor}`}>
                {stat.value}
              </p>
              <p className="text-sm text-gray-500">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <RequestsInbox requests={JSON.parse(JSON.stringify(requests))} />
    </div>
  );
}
