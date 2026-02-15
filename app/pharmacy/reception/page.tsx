"use client";

import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle,
  ClipboardCheck,
  Gift,
  HandHeart,
  Search,
  ShieldAlert,
} from "lucide-react";
import {
  confirmRequesterPickup,
  lookupByValidationCode,
  markDonationReceived,
  markDonorReceived,
  markReadyForPickup,
  rejectByPharmacy,
} from "../actions";

type ItemWithDetails = Awaited<
  ReturnType<typeof lookupByValidationCode>
> extends { data: infer DataShape }
  ? DataShape | null
  : null;

function statusClass(status: string) {
  if (["COMPLETADA", "RECIBIDA"].includes(status)) {
    return "bg-green-100 text-green-800";
  }
  if (["RECHAZADA", "ABANDONADA", "EXPIRADA"].includes(status)) {
    return "bg-red-100 text-red-800";
  }
  if (["LISTA_PARA_RETIRO", "EN_PROCESO", "APROBADA"].includes(status)) {
    return "bg-amber-100 text-amber-800";
  }
  return "bg-gray-100 text-gray-700";
}

function roleLabel(role: string | undefined) {
  switch (role) {
    case "DONOR_DELIVERY":
      return "Código de Donante";
    case "REQUESTER_PICKUP":
      return "Código de Solicitante";
    case "DONATION":
      return "Código de Donación";
    default:
      return "Código legado";
  }
}

export default function PharmacyReceptionPage() {
  const [inputCode, setInputCode] = useState("");
  const [item, setItem] = useState<ItemWithDetails>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");

  const fetchCode = async (code: string) => {
    setLoading(true);
    setError("");
    const result = await lookupByValidationCode(code);
    if (result.success && result.data) {
      setItem(result.data);
    } else {
      setItem(null);
      setError(result.error || "Código no encontrado");
    }
    setLoading(false);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetchCode(inputCode);
  };

  const runAction = async (
    handler: () => Promise<{ success: boolean; error?: string }>,
  ) => {
    setActionLoading(true);
    const result = await handler();
    if (result.success) {
      await fetchCode(inputCode);
    } else {
      setError(result.error || "No se pudo completar la operación");
    }
    setActionLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="text-center">
          <HandHeart className="mx-auto h-12 w-12 text-teal-600" />
          <h2 className="mt-4 text-3xl font-bold text-gray-900">
            Recepción y Entrega en Farmacia
          </h2>
          <p className="text-sm text-gray-600 mt-2">
            Ingresa código manual o token QR para validar la operación.
          </p>
        </div>

        <div className="bg-white rounded-xl border shadow-sm p-4">
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                className="w-full border rounded-md pl-9 pr-3 py-2 text-sm"
                placeholder="Ingresa código DON-... / RET-... o token QR"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
              />
            </div>
            <button
              className="px-4 py-2 rounded-md bg-teal-600 text-white text-sm disabled:opacity-50"
              disabled={loading || !inputCode.trim()}
              type="submit"
            >
              {loading ? "Buscando..." : "Validar"}
            </button>
          </form>
          {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
        </div>

        {item && (
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className="p-5 border-b">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-gray-500">
                    {item.type === "SOLICITUD" ? "Solicitud" : "Donación"}
                  </p>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {item.type === "SOLICITUD"
                      ? item.codigoRetiroSolicitante ||
                        item.codigoEntregaDonante ||
                        item.codigo ||
                        item.codigoComprobante
                      : item.codigo}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {roleLabel(
                      "validationRole" in item ? item.validationRole : undefined,
                    )}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${statusClass(item.estado)}`}
                >
                  {item.estado.replace(/_/g, " ")}
                </span>
              </div>
            </div>

            <div className="p-5 space-y-5">
              {item.type === "SOLICITUD" && (
                <>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="rounded-lg bg-gray-50 border p-3">
                      <p className="text-xs text-gray-500">Beneficiario</p>
                      <p className="font-medium text-gray-900">
                        {item.usuarioComun?.nombre || "No disponible"}
                      </p>
                    </div>
                    <div className="rounded-lg bg-gray-50 border p-3">
                      <p className="text-xs text-gray-500">Donante asignado</p>
                      <p className="font-medium text-gray-900">
                        {item.donanteAsignado?.nombre || "No asignado"}
                      </p>
                    </div>
                  </div>

                  {(item.validationRole === "DONOR_DELIVERY" ||
                    item.validationRole === "LEGACY") && (
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-900">
                        Flujo de Entrega del Donante
                      </h4>

                      {(item.estado === "EN_PROCESO" ||
                        item.estado === "APROBADA") && (
                        <button
                          className="w-full py-2 rounded-md bg-blue-600 text-white text-sm disabled:opacity-50"
                          disabled={actionLoading}
                          onClick={() =>
                            runAction(() => markDonorReceived(item.id))
                          }
                        >
                          Confirmar recepción del donante
                        </button>
                      )}

                      {item.estado === "RECIBIDA" && (
                        <div className="space-y-3">
                          <button
                            className="w-full py-2 rounded-md bg-green-600 text-white text-sm disabled:opacity-50"
                            disabled={actionLoading}
                            onClick={() =>
                              runAction(() => markReadyForPickup(item.id))
                            }
                          >
                            Marcar como lista para retiro
                          </button>

                          <div className="rounded-lg border border-red-200 bg-red-50 p-3 space-y-2">
                            <div className="flex items-center gap-2 text-red-700">
                              <ShieldAlert className="h-4 w-4" />
                              <p className="font-medium text-sm">
                                Rechazo sanitario (vencido/dañado)
                              </p>
                            </div>
                            <textarea
                              className="w-full rounded-md border border-red-200 bg-white text-sm p-2"
                              placeholder="Motivo obligatorio del rechazo en farmacia"
                              value={rejectionReason}
                              onChange={(e) => setRejectionReason(e.target.value)}
                            />
                            <button
                              className="w-full py-2 rounded-md bg-red-600 text-white text-sm disabled:opacity-50"
                              disabled={actionLoading || !rejectionReason.trim()}
                              onClick={() =>
                                runAction(() =>
                                  rejectByPharmacy(item.id, rejectionReason),
                                )
                              }
                            >
                              Rechazar y cerrar caso
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {item.validationRole === "REQUESTER_PICKUP" && (
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-900">
                        Flujo de Retiro del Solicitante
                      </h4>
                      {item.estado === "LISTA_PARA_RETIRO" ? (
                        <button
                          className="w-full py-2 rounded-md bg-teal-600 text-white text-sm disabled:opacity-50"
                          disabled={actionLoading}
                          onClick={() =>
                            runAction(() => confirmRequesterPickup(item.id))
                          }
                        >
                          Confirmar retiro y cerrar solicitud
                        </button>
                      ) : (
                        <div className="rounded-md border bg-amber-50 text-amber-800 text-sm p-3">
                          Este código solo aplica cuando la solicitud está
                          LISTA PARA RETIRO.
                        </div>
                      )}
                    </div>
                  )}

                  {item.estado === "COMPLETADA" && (
                    <div className="rounded-md border border-green-200 bg-green-50 text-green-800 p-3 text-sm flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Solicitud cerrada correctamente.
                    </div>
                  )}

                  {item.estado === "ABANDONADA" && (
                    <div className="rounded-md border border-orange-200 bg-orange-50 text-orange-800 p-3 text-sm flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Solicitud abandonada por no retiro. Convertida en donación
                      flotante.
                    </div>
                  )}
                </>
              )}

              {item.type === "DONACION" && (
                <div className="space-y-3">
                  <div className="rounded-md border bg-teal-50 p-3 text-sm text-teal-800 flex items-center gap-2">
                    <Gift className="h-4 w-4" />
                    Donación directa registrada en farmacia.
                  </div>
                  {["DISPONIBLE", "RESERVADA"].includes(item.estado) ? (
                    <button
                      className="w-full py-2 rounded-md bg-teal-600 text-white text-sm disabled:opacity-50"
                      disabled={actionLoading}
                      onClick={() =>
                        runAction(() => markDonationReceived(item.id))
                      }
                    >
                      Confirmar recepción de donación
                    </button>
                  ) : (
                    <div className="rounded-md border bg-gray-50 text-gray-700 p-3 text-sm">
                      La donación ya fue procesada.
                    </div>
                  )}
                </div>
              )}

              <div>
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <ClipboardCheck className="h-4 w-4" />
                  Medicamentos
                </h4>
                <div className="space-y-2">
                  {item.medicamentos?.map((med) => (
                    <div
                      key={med.id}
                      className="rounded-md border bg-gray-50 p-3 text-sm flex items-center justify-between"
                    >
                      <span className="font-medium text-gray-900">
                        {med.medicamento.nombre}
                      </span>
                      <span className="text-gray-600">{med.cantidad}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
