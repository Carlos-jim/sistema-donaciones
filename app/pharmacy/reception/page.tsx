"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Bell,
  CheckCircle,
  HandHeart,
  Search,
  User,
  ShieldCheck,
} from "lucide-react";
import {
  getPendingPickups,
  lookupByValidationCode,
  type PendingPickupItem,
  type PharmacyLookupItem,
  updateStatus,
} from "../actions";

function statusLabel(status: string) {
  return status.replace(/_/g, " ");
}

function roleLabel(role?: string) {
  switch (role) {
    case "DONOR_DELIVERY":
      return "Entrega del donante";
    case "REQUESTER_PICKUP":
      return "Retiro del beneficiario";
    case "DONATION":
      return "Donacion";
    default:
      return "Validacion general";
  }
}

function statusClass(status: string) {
  switch (status) {
    case "COMPLETADA":
      return "bg-green-100 text-green-800";
    case "RECIBIDA":
    case "LISTA_PARA_RETIRO":
      return "bg-blue-100 text-blue-800";
    case "EN_PROCESO":
    case "APROBADA":
      return "bg-amber-100 text-amber-800";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

export default function PharmacyReceptionPage() {
  const [inputCode, setInputCode] = useState("");
  const [item, setItem] = useState<PharmacyLookupItem | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [pendingPickups, setPendingPickups] = useState<PendingPickupItem[]>([]);

  const loadPendingPickups = async (farmaciaId: string) => {
    const result = await getPendingPickups(farmaciaId);
    if (result.success) {
      setPendingPickups(result.data);
    }
  };

  const fetchCode = async (rawCode: string) => {
    setLoading(true);
    setError("");

    const result = await lookupByValidationCode(rawCode);

    if (!result.success) {
      setItem(null);
      setError(result.error || "Codigo no encontrado");
    } else {
      setItem(result.data);
      setRejectionReason("");

      if (
        result.data.type === "SOLICITUD" &&
        result.data.farmaciaEntregaId
      ) {
        await loadPendingPickups(result.data.farmaciaEntregaId);
      }
    }

    setLoading(false);
  };

  const handleSearch = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await fetchCode(inputCode);
  };

  const handleStatusUpdate = async (
    nextStatus: "RECIBIDA" | "LISTA_PARA_RETIRO" | "COMPLETADA" | "RECHAZADA",
  ) => {
    if (!item) return;

    setActionLoading(true);

    const result = await updateStatus(
      item.id,
      item.type,
      nextStatus,
      rejectionReason,
    );

    if (result.success) {
      await fetchCode(inputCode);
    } else {
      setError(result.error || "No se pudo actualizar el estado");
    }

    setActionLoading(false);
  };

  const displayCode = item
    ? item.type === "SOLICITUD"
      ? item.enteredCode ||
        item.codigoRetiroSolicitante ||
        item.codigoEntregaDonante ||
        item.codigoComprobante ||
        item.codigo ||
        "Sin codigo"
      : item.enteredCode || item.codigo || "Sin codigo"
    : "Sin codigo";

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="text-center">
          <HandHeart className="mx-auto h-12 w-12 text-teal-600" />
          <h1 className="mt-4 text-3xl font-bold text-gray-900">
            Recepcion de farmacia
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Valida codigos de entrega y retiro desde un solo panel.
          </p>
        </div>

        {pendingPickups.length > 0 && (
          <section className="rounded-xl border border-purple-200 bg-purple-50 p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-purple-800">
              <Bell className="h-4 w-4" />
              Beneficiarios por retirar ({pendingPickups.length})
            </div>
            <div className="space-y-2">
              {pendingPickups.map((pickup) => (
                <div
                  key={pickup.id}
                  className="flex items-center justify-between rounded-lg border border-purple-100 bg-white p-3"
                >
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-purple-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {pickup.usuarioComun.nombre}
                      </p>
                      <p className="text-xs text-gray-500">
                        Cedula:{" "}
                        <span className="font-mono text-purple-700">
                          {pickup.usuarioComun.cedula || "N/A"}
                        </span>
                      </p>
                      <p className="text-xs text-gray-400">
                        {pickup.medicamentos
                          .map((med) => med.medicamento.nombre)
                          .join(", ")}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-purple-700">
                    {pickup.codigoRetiroSolicitante ||
                      pickup.codigoComprobante ||
                      pickup.codigo ||
                      "Sin codigo"}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="rounded-xl border bg-white p-6 shadow-sm">
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-teal-500"
                placeholder="Ingresa codigo o QR"
                value={inputCode}
                onChange={(event) => setInputCode(event.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={loading || !inputCode.trim()}
              className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {loading ? "Buscando..." : "Validar"}
            </button>
          </form>

          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        </section>

        {item && (
          <section className="overflow-hidden rounded-xl border bg-white shadow-sm">
            <div className="border-b px-5 py-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-gray-500">
                    {item.type === "SOLICITUD" ? "Solicitud" : "Donacion"}
                  </p>
                  <h2 className="text-xl font-semibold text-gray-900">{displayCode}</h2>
                  <p className="mt-1 text-xs text-gray-500">
                    {roleLabel(item.validationRole)}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(item.estado)}`}
                >
                  {statusLabel(item.estado)}
                </span>
              </div>
            </div>

            <div className="space-y-5 p-5">
              {item.type === "SOLICITUD" && (
                <div className="rounded-xl border-2 border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50 p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-amber-700" />
                    <p className="text-sm font-bold uppercase tracking-wide text-amber-800">
                      Validacion obligatoria de identidad
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    {"donanteAsignado" in item && item.donanteAsignado && (
                      <div className="rounded-lg border border-blue-200 bg-white p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                          Donante
                        </p>
                        <p className="mt-1 text-sm font-medium text-gray-900">
                          {item.donanteAsignado.nombre}
                        </p>
                        <p className="text-sm text-gray-600">
                          Cedula:{" "}
                          <span className="font-mono text-blue-700">
                            {item.donanteAsignado.cedula || "N/A"}
                          </span>
                        </p>
                      </div>
                    )}

                    {"usuarioComun" in item && item.usuarioComun && (
                      <div className="rounded-lg border border-teal-200 bg-white p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
                          Beneficiario
                        </p>
                        <p className="mt-1 text-sm font-medium text-gray-900">
                          {item.usuarioComun.nombre}
                        </p>
                        <p className="text-sm text-gray-600">
                          Cedula:{" "}
                          <span className="font-mono text-teal-700">
                            {item.usuarioComun.cedula || "N/A"}
                          </span>
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {item.type === "DONACION" && "usuarioComun" in item && item.usuarioComun && (
                <div className="rounded-xl border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-white p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-blue-700" />
                    <p className="text-sm font-bold uppercase tracking-wide text-blue-800">
                      Validacion de identidad — Donante
                    </p>
                  </div>
                  <p className="text-sm font-medium text-gray-900">
                    {item.usuarioComun.nombre}
                  </p>
                  <p className="text-sm text-gray-600">
                    Cedula:{" "}
                    <span className="font-mono text-blue-700">
                      {item.usuarioComun.cedula || "N/A"}
                    </span>
                  </p>
                </div>
              )}

              {"farmaciaEntrega" in item && item.farmaciaEntrega && (
                <div className="rounded-lg border bg-gray-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500">
                    Farmacia
                  </p>
                  <p className="mt-1 font-medium text-gray-900">
                    {item.farmaciaEntrega.nombre}
                  </p>
                  <p className="text-sm text-gray-600">
                    {item.farmaciaEntrega.direccion}
                  </p>
                </div>
              )}

              <div className="space-y-3">
                <p className="text-sm font-semibold text-gray-900">
                  Insumos médicos
                </p>
                {item.medicamentos.map((med) => (
                  <div
                    key={med.id}
                    className="rounded-lg border border-gray-100 bg-gray-50 p-4"
                  >
                    <p className="font-medium text-gray-900">
                      {med.medicamento.nombre}
                    </p>
                    <p className="text-sm text-gray-600">
                      Cantidad: {med.cantidad}
                      {med.medicamento.presentacion
                        ? ` ${med.medicamento.presentacion}`
                        : ""}
                    </p>
                  </div>
                ))}
              </div>

              {item.type === "SOLICITUD" && item.deliveryConfirmedAt && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
                  El donante ya confirmo la entrega en farmacia.
                </div>
              )}

              {item.type === "SOLICITUD" && (
                <div className="space-y-3">
                  {(item.estado === "APROBADA" ||
                    item.estado === "EN_PROCESO" ||
                    item.estado === "PENDIENTE") && (
                    <button
                      type="button"
                      onClick={() => handleStatusUpdate("RECIBIDA")}
                      disabled={actionLoading}
                      className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                    >
                      {actionLoading
                        ? "Procesando..."
                        : "Marcar como recibida en farmacia"}
                    </button>
                  )}

                  {item.estado === "RECIBIDA" && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleStatusUpdate("LISTA_PARA_RETIRO")}
                        disabled={actionLoading}
                        className="w-full rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                      >
                        {actionLoading
                          ? "Procesando..."
                          : "Marcar lista para retiro"}
                      </button>

                      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                        <div className="mb-2 flex items-center gap-2 text-sm font-medium text-red-700">
                          <AlertTriangle className="h-4 w-4" />
                          Rechazo sanitario
                        </div>
                        <textarea
                          value={rejectionReason}
                          onChange={(event) =>
                            setRejectionReason(event.target.value)
                          }
                          placeholder="Motivo del rechazo en farmacia"
                          className="min-h-24 w-full rounded-lg border border-red-200 bg-white p-3 text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => handleStatusUpdate("RECHAZADA")}
                          disabled={
                            actionLoading || rejectionReason.trim().length === 0
                          }
                          className="mt-3 w-full rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                        >
                          Rechazar y reactivar solicitud
                        </button>
                      </div>
                    </>
                  )}

                  {item.estado === "LISTA_PARA_RETIRO" && (
                    <button
                      type="button"
                      onClick={() => handleStatusUpdate("COMPLETADA")}
                      disabled={actionLoading}
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                    >
                      <CheckCircle className="h-4 w-4" />
                      {actionLoading
                        ? "Procesando..."
                        : "Confirmar entrega final"}
                    </button>
                  )}
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
