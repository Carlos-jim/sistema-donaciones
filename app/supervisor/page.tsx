import { getPendingRequests } from "./actions";
import RequestsInbox from "./requests-inbox";
import { Clock, CheckCircle2, ClipboardList } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SupervisorDashboard() {
  const requests = await getPendingRequests();

  const highUrgency = requests.filter((r) => r.tiempoEspera === "ALTO").length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">
          Gestión de Solicitudes
        </h2>
        <p className="text-gray-500 mt-1">
          Revisa y aprueba las solicitudes de medicamentos pendientes.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: "Pendientes de revisión",
            value: requests.length,
            icon: ClipboardList,
            iconBg: "bg-teal-50",
            iconColor: "text-teal-600",
            valuColor: "text-gray-900",
          },
          {
            label: "Urgencia alta",
            value: highUrgency,
            icon: Clock,
            iconBg: "bg-red-50",
            iconColor: "text-red-500",
            valuColor: "text-red-600",
          },
          {
            label: "Otras urgencias",
            value: requests.length - highUrgency,
            icon: CheckCircle2,
            iconBg: "bg-green-50",
            iconColor: "text-green-600",
            valuColor: "text-gray-900",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4"
          >
            <div className={`w-12 h-12 ${s.iconBg} rounded-xl flex items-center justify-center shrink-0`}>
              <s.icon className={`w-6 h-6 ${s.iconColor}`} />
            </div>
            <div>
              <p className={`text-2xl font-bold ${s.valuColor}`}>{s.value}</p>
              <p className="text-sm text-gray-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <RequestsInbox requests={JSON.parse(JSON.stringify(requests))} />
    </div>
  );
}
