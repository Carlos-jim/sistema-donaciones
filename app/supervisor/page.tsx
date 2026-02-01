import { getPendingRequests } from "./actions";
import RequestsInbox from "./requests-inbox";

export const dynamic = "force-dynamic";

export default async function SupervisorDashboard() {
  const requests = await getPendingRequests();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">
            Gestión de Solicitudes
          </h2>
          <p className="text-gray-500">
            Revise y apruebe las solicitudes de medicamentos.
          </p>
        </div>
      </div>

      <RequestsInbox requests={JSON.parse(JSON.stringify(requests))} />
    </div>
  );
}
