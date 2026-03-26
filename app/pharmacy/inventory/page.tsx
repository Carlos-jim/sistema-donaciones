import {
  ArrowRight,
  CalendarDays,
  Package,
  Pill,
  ScanLine,
  ShieldCheck,
  Warehouse,
} from "lucide-react";
import Link from "next/link";
import { getPharmacyInventoryData, type PharmacyInventoryReceipt } from "@/app/pharmacy/data";

function formatDate(date: Date | null) {
  if (!date) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat("es-VE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getOriginLabel(receipt: PharmacyInventoryReceipt) {
  if (receipt.origen === "ABANDONO_RETIRO") {
    return "Abandono de retiro";
  }

  if (receipt.origen === "ENTE_SALUD") {
    return receipt.enteSalud?.nombre
      ? `Ente de salud: ${receipt.enteSalud.nombre}`
      : "Ente de salud";
  }

  return receipt.usuarioComun?.nombre
    ? `Usuario: ${receipt.usuarioComun.nombre}`
    : "Usuario";
}

export default async function PharmacyInventoryPage() {
  const { pharmacy, summary, medications, receipts } = await getPharmacyInventoryData();

  const stats = [
    {
      label: "Recepciones registradas",
      value: summary.receivedDonationsCount,
      description: "Donaciones recibidas fisicamente en esta farmacia",
      icon: Warehouse,
      iconClass: "bg-teal-50 text-teal-700",
      borderClass: "border-teal-100",
    },
    {
      label: "Unidades recibidas",
      value: summary.totalUnits,
      description: "Cantidad total de medicamentos en inventario",
      icon: Pill,
      iconClass: "bg-cyan-50 text-cyan-700",
      borderClass: "border-cyan-100",
    },
    {
      label: "Medicamentos distintos",
      value: summary.uniqueMedicationCount,
      description: "Presentaciones distintas registradas",
      icon: Package,
      iconClass: "bg-amber-50 text-amber-700",
      borderClass: "border-amber-100",
    },
    {
      label: "Ultima recepcion",
      value: summary.lastReceivedAt ? formatDate(summary.lastReceivedAt) : "Sin movimientos",
      description: pharmacy.nombre,
      icon: CalendarDays,
      iconClass: "bg-emerald-50 text-emerald-700",
      borderClass: "border-emerald-100",
    },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <section className="rounded-3xl bg-gradient-to-r from-cyan-600 via-teal-600 to-teal-700 p-6 text-white shadow-lg">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
              <Warehouse className="h-6 w-6" />
            </div>
            <p className="mt-4 text-sm font-medium text-cyan-100">Inventario de farmacia</p>
            <h2 className="mt-1 text-3xl font-bold tracking-tight">{pharmacy.nombre}</h2>
            <p className="mt-2 max-w-2xl text-sm text-cyan-50">
              Aqui ves los medicamentos que ya fueron recibidos fisicamente y quedaron registrados en esta farmacia.
            </p>
          </div>

          <Link
            href="/pharmacy/reception"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-teal-700 shadow-sm transition hover:bg-cyan-50"
          >
            <ScanLine className="h-4 w-4" />
            Procesar otra recepcion
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
              <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${stat.iconClass}`}>
                <stat.icon className="h-5 w-5" />
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-5">
          <h3 className="text-lg font-semibold text-slate-900">Resumen por medicamento</h3>
          <p className="mt-1 text-sm text-slate-500">
            Cantidad acumulada y ultimos ingresos dentro del inventario de la farmacia.
          </p>
        </div>

        <div className="p-6">
          {medications.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">
              <p className="text-sm font-semibold text-slate-700">
                Todavia no hay medicamentos registrados en inventario
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Procesa una recepcion y, cuando la donacion quede recibida, aparecera aqui.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {medications.map((medication) => (
                <article
                  key={medication.medicamentoId}
                  className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-base font-semibold text-slate-900">
                        {medication.nombre}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {medication.presentacion || "Presentacion no registrada"}
                        {medication.concentracion ? ` · ${medication.concentracion}` : ""}
                      </p>
                    </div>
                    <div className="rounded-xl bg-white px-3 py-2 text-right shadow-sm">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Unidades
                      </p>
                      <p className="text-lg font-bold text-slate-900">
                        {medication.totalCantidad}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2 text-sm text-slate-600">
                    <p>{medication.donationCount} recepciones registradas</p>
                    <p>Ultimo ingreso: {formatDate(medication.lastReceivedAt)}</p>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {medication.origins.map((origin) => (
                      <span
                        key={origin}
                        className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200"
                      >
                        {origin}
                      </span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Historial de recepciones</h3>
            <p className="mt-1 text-sm text-slate-500">
              Detalle de las donaciones fisicas ya registradas en la farmacia.
            </p>
          </div>
          <Link
            href="/pharmacy/reception"
            className="inline-flex items-center gap-2 text-sm font-semibold text-teal-700 transition hover:text-teal-800"
          >
            Ir a recepcion
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="p-6">
          {receipts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">
              <p className="text-sm font-semibold text-slate-700">
                No hay recepciones para mostrar
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Cuando una donacion quede marcada como recibida, su detalle aparecera aqui.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {receipts.map((receipt) => (
                <article
                  key={receipt.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-base font-semibold text-slate-900">
                          {receipt.codigo || "Recepcion sin codigo visible"}
                        </h4>
                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                          Recibida
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-slate-600">{getOriginLabel(receipt)}</p>
                      {receipt.descripcion && (
                        <p className="mt-2 text-sm text-slate-500">{receipt.descripcion}</p>
                      )}
                    </div>

                    <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Fecha de registro
                      </p>
                      <p className="mt-1 text-sm font-medium text-slate-900">
                        {formatDate(receipt.updatedAt)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {receipt.medicamentos.map((medication) => (
                      <div
                        key={medication.id}
                        className="rounded-2xl border border-slate-100 bg-white p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-slate-900">
                              {medication.medicamento.nombre}
                            </p>
                            <p className="mt-1 text-sm text-slate-500">
                              {medication.medicamento.presentacion || "Presentacion no registrada"}
                              {medication.medicamento.concentracion
                                ? ` · ${medication.medicamento.concentracion}`
                                : ""}
                            </p>
                          </div>
                          <ShieldCheck className="h-5 w-5 text-teal-600" />
                        </div>
                        <div className="mt-4 space-y-1 text-sm text-slate-600">
                          <p>Cantidad: {medication.cantidad}</p>
                          <p>Lote: {medication.lote || "No indicado"}</p>
                          <p>Expira: {formatDate(medication.fechaExpiracion)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
