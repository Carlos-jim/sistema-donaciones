import { CalendarDays, ClipboardList, PackageCheck, Pill, ScanLine } from "lucide-react";
import Link from "next/link";
import { getPharmacyInventoryData } from "@/app/pharmacy/data";
import {
  ReceivedMedicationsHistory,
  type ReceivedMedicationHistoryItem,
} from "@/app/pharmacy/inventory/received-medications-history";

function formatDate(date: Date | null) {
  if (!date) {
    return "Sin movimientos";
  }

  return new Intl.DateTimeFormat("es-VE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export default async function PharmacyInventoryPage() {
  const { pharmacy, receivedMedications, summary } =
    await getPharmacyInventoryData();

  const stats = [
    {
      label: "Medicamentos recibidos",
      value: receivedMedications.length,
      description: "Registros individuales confirmados",
      icon: ClipboardList,
      iconClass: "bg-teal-50 text-teal-700",
      borderClass: "border-teal-100",
    },
    {
      label: "Unidades recibidas",
      value: summary.totalUnits,
      description: "Total acumulado en las recepciones",
      icon: Pill,
      iconClass: "bg-cyan-50 text-cyan-700",
      borderClass: "border-cyan-100",
    },
    {
      label: "Medicamentos distintos",
      value: summary.uniqueMedicationCount,
      description: "Tipos de medicamento registrados",
      icon: PackageCheck,
      iconClass: "bg-amber-50 text-amber-700",
      borderClass: "border-amber-100",
    },
    {
      label: "Último registro",
      value: formatDate(summary.lastReceivedAt),
      description: pharmacy.nombre,
      icon: CalendarDays,
      iconClass: "bg-emerald-50 text-emerald-700",
      borderClass: "border-emerald-100",
    },
  ];

  const history: ReceivedMedicationHistoryItem[] = receivedMedications.map(
    (medication) => ({
      ...medication,
      receivedAt: medication.receivedAt.toISOString(),
      fechaExpiracion: medication.fechaExpiracion?.toISOString() ?? null,
    })
  );

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-teal-700 via-teal-600 to-cyan-600 p-6 text-white shadow-lg">
        <div className="absolute -right-12 -top-16 h-48 w-48 rounded-full border border-white/15" />
        <div className="absolute -bottom-24 right-32 h-40 w-40 rounded-full bg-cyan-300/10" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20">
              <ClipboardList className="h-6 w-6" />
            </div>
            <p className="mt-4 text-sm font-medium text-teal-100">
              Registro de farmacia
            </p>
            <h2 className="mt-1 text-3xl font-bold tracking-tight">
              Historial de medicamentos recibidos
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-teal-50">
              Consulta cada medicamento confirmado en {pharmacy.nombre}, con su
              lote, vencimiento, origen y fecha de recepción.
            </p>
          </div>

          <Link
            href="/pharmacy/reception"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-teal-700 shadow-sm transition hover:bg-teal-50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-teal-600"
          >
            <ScanLine className="h-4 w-4" />
            Procesar recepción
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <article
            key={stat.label}
            className={`rounded-2xl border bg-white p-5 shadow-sm ${stat.borderClass}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                <p className="mt-1 text-sm font-semibold text-slate-700">{stat.label}</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">{stat.description}</p>
              </div>
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${stat.iconClass}`}>
                <stat.icon className="h-5 w-5" />
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              Historial de medicamentos recibidos
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Cada fila corresponde a un medicamento registrado en una recepción confirmada.
            </p>
          </div>
          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Solo recepciones confirmadas
          </span>
        </div>

        <div className="p-4 sm:p-6">
          <ReceivedMedicationsHistory medications={history} />
        </div>
      </section>
    </div>
  );
}
