"use client";

import { useMemo, useState } from "react";
import {
  PackageSearch,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";

export type ReceivedMedicationHistoryItem = {
  id: string;
  receiptId: string;
  receiptCode: string | null;
  receiptDescription: string | null;
  receivedAt: string;
  origin: string;
  nombre: string;
  presentacion: string | null;
  concentracion: string | null;
  cantidad: number;
  lote: string | null;
  fechaExpiracion: string | null;
};

interface ReceivedMedicationsHistoryProps {
  medications: ReceivedMedicationHistoryItem[];
}

function formatDate(date: string | null) {
  if (!date) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat("es-VE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

function medicationDetail(medication: ReceivedMedicationHistoryItem) {
  const details = [medication.presentacion, medication.concentracion].filter(
    Boolean
  );

  return details.length > 0 ? details.join(" · ") : "Presentación no registrada";
}

export function ReceivedMedicationsHistory({
  medications,
}: ReceivedMedicationsHistoryProps) {
  const [query, setQuery] = useState("");
  const [origin, setOrigin] = useState("all");

  const origins = useMemo(
    () => [...new Set(medications.map((medication) => medication.origin))].sort(),
    [medications]
  );

  const filteredMedications = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("es");

    return medications.filter((medication) => {
      const matchesOrigin = origin === "all" || medication.origin === origin;
      const searchableContent = [
        medication.nombre,
        medication.presentacion,
        medication.concentracion,
        medication.lote,
        medication.receiptCode,
        medication.origin,
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("es");

      return matchesOrigin && searchableContent.includes(normalizedQuery);
    });
  }, [medications, origin, query]);

  const hasFilters = query.length > 0 || origin !== "all";

  const clearFilters = () => {
    setQuery("");
    setOrigin("all");
  };

  if (medications.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-14 text-center">
        <PackageSearch className="mx-auto h-9 w-9 text-slate-400" />
        <p className="mt-4 text-sm font-semibold text-slate-700">
          Aún no hay medicamentos recibidos
        </p>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
          Cada medicamento aparecerá aquí cuando una recepción sea confirmada en
          la farmacia.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por medicamento, lote o código..."
            className="border-slate-200 bg-white pl-9 shadow-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <SlidersHorizontal className="hidden h-4 w-4 text-slate-400 sm:block" />
          <select
            aria-label="Filtrar por origen"
            value={origin}
            onChange={(event) => setOrigin(event.target.value)}
            className="h-10 min-w-44 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:ring-2 focus:ring-teal-500 focus:ring-offset-1"
          >
            <option value="all">Todos los orígenes</option>
            {origins.map((itemOrigin) => (
              <option key={itemOrigin} value={itemOrigin}>
                {itemOrigin}
              </option>
            ))}
          </select>
          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex h-10 items-center gap-1 rounded-md px-2 text-sm font-medium text-slate-500 transition hover:bg-white hover:text-teal-700"
            >
              <X className="h-4 w-4" />
              <span className="hidden sm:inline">Limpiar</span>
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 px-1 text-sm text-slate-500">
        <p>
          {filteredMedications.length} {filteredMedications.length === 1 ? "medicamento registrado" : "medicamentos registrados"}
        </p>
        <p className="hidden sm:block">Más recientes primero</p>
      </div>

      {filteredMedications.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 px-6 py-12 text-center">
          <p className="text-sm font-semibold text-slate-700">
            No encontramos medicamentos con esos filtros
          </p>
          <button
            type="button"
            onClick={clearFilters}
            className="mt-3 text-sm font-semibold text-teal-700 hover:text-teal-800"
          >
            Ver todo el historial
          </button>
        </div>
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-2xl border border-slate-200 lg:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3.5">Medicamento</th>
                  <th className="px-5 py-3.5">Lote</th>
                  <th className="px-5 py-3.5 text-center">Cantidad</th>
                  <th className="px-5 py-3.5">Origen</th>
                  <th className="px-5 py-3.5">Recibido</th>
                  <th className="px-5 py-3.5">Vencimiento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredMedications.map((medication) => (
                  <tr key={medication.id} className="transition hover:bg-teal-50/40">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-900">{medication.nombre}</p>
                      <p className="mt-0.5 text-xs text-slate-500">{medicationDetail(medication)}</p>
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-slate-600">
                      {medication.lote || "—"}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className="inline-flex min-w-10 justify-center rounded-lg bg-teal-50 px-2.5 py-1 font-semibold text-teal-800">
                        {medication.cantidad}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-slate-700">{medication.origin}</p>
                      <p className="mt-0.5 text-xs text-slate-500">{medication.receiptCode || "Recepción sin código"}</p>
                    </td>
                    <td className="px-5 py-4 text-slate-700">{formatDate(medication.receivedAt)}</td>
                    <td className="px-5 py-4 text-slate-700">{formatDate(medication.fechaExpiracion)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 lg:hidden">
            {filteredMedications.map((medication) => (
              <article key={medication.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-900">{medication.nombre}</p>
                    <p className="mt-1 text-sm text-slate-500">{medicationDetail(medication)}</p>
                  </div>
                  <span className="rounded-lg bg-teal-50 px-2.5 py-1 text-sm font-semibold text-teal-800">
                    {medication.cantidad} uds.
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-slate-100 pt-4 text-sm">
                  <div><p className="text-xs text-slate-500">Lote</p><p className="mt-0.5 font-mono text-xs text-slate-700">{medication.lote || "—"}</p></div>
                  <div><p className="text-xs text-slate-500">Vencimiento</p><p className="mt-0.5 text-slate-700">{formatDate(medication.fechaExpiracion)}</p></div>
                  <div><p className="text-xs text-slate-500">Origen</p><p className="mt-0.5 text-slate-700">{medication.origin}</p></div>
                  <div><p className="text-xs text-slate-500">Recibido</p><p className="mt-0.5 text-slate-700">{formatDate(medication.receivedAt)}</p></div>
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
