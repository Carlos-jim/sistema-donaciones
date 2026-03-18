"use client";

import { useState, useEffect } from "react";
import { getSolicitudByCodigo, updateStatus, getPendingPickups } from "../actions";
import { EstadoSolicitud, EstadoDonacion } from "@prisma/client";
import {
  AlertTriangle,
  CheckCircle,
  ClipboardCheck,
  Gift,
  HandHeart,
  AlertTriangle,
  Gift,
  Bell,
  User,
} from "lucide-react";

type ItemWithDetails = Awaited<ReturnType<typeof getSolicitudByCodigo>>["data"];
type PendingPickup = Awaited<ReturnType<typeof getPendingPickups>>["data"][number];

export default function PharmacyReceptionPage() {
  const [inputCode, setInputCode] = useState("");
  const [item, setItem] = useState<ItemWithDetails>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [pendingPickups, setPendingPickups] = useState<PendingPickup[]>([]);

  // Load pending pickups on mount
  // We get farmaciaId from the first search result or URL — for now use a polling approach
  const loadPendingPickups = async (farmaciaId: string) => {
    const result = await getPendingPickups(farmaciaId);
    if (result.success) setPendingPickups(result.data);
  };

  const fetchCode = async (code: string) => {
    setLoading(true);
    setError("");
    const result = await lookupByValidationCode(code);
    if (result.success && result.data) {
      setItem(result.data);
      // If solicitud, load pending pickups for this pharmacy
      if (result.data.type === "SOLICITUD" && result.data.farmaciaEntregaId) {
        loadPendingPickups(result.data.farmaciaEntregaId);
      }
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
      const updated = await getSolicitudByCodigo(item.codigo!);
      if (updated.success && updated.data) {
        setItem(updated.data);
      }
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

        {/* Pending Pickups Notification */}
        {pendingPickups.length > 0 && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-purple-800 flex items-center gap-2 mb-3">
              <Bell className="h-4 w-4" />
              Beneficiarios que vendrán a retirar ({pendingPickups.length})
            </h3>
            <div className="space-y-2">
              {pendingPickups.map((pickup) => (
                <div key={pickup.id} className="flex items-center justify-between bg-white rounded-lg p-3 border border-purple-100">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-purple-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{pickup.usuarioComun.nombre}</p>
                      <p className="text-xs text-gray-500">
                        {pickup.medicamentos.map(m => m.medicamento.nombre).join(", ")}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-purple-600 font-medium">
                    {pickup.codigoComprobante || pickup.codigo}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search Section */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
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
                  {/* Donor delivery confirmation indicator */}
                  {item.estado === "EN_PROCESO" && (
                    <div className="space-y-4">
                      {item.deliveryConfirmedAt ? (
                        <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-md border border-blue-200">
                          <CheckCircle className="h-6 w-6 text-blue-600 mt-1" />
                          <div>
                            <h4 className="font-medium text-blue-900">
                              El donante confirmó la entrega
                            </h4>
                            <p className="text-sm text-blue-700">
                              El donante indica que entregó el medicamento en esta farmacia el {new Date(item.deliveryConfirmedAt).toLocaleDateString("es-ES", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}.
                              Cuando lo recibas, marca como &quot;Recibido&quot;.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start gap-4 p-4 bg-yellow-50 rounded-md border border-yellow-200">
                          <AlertTriangle className="h-6 w-6 text-yellow-600 mt-1" />
                          <div>
                            <h4 className="font-medium text-yellow-900">
                              Esperando entrega del donante
                            </h4>
                            <p className="text-sm text-yellow-700">
                              El donante aún no ha confirmado que entregó el medicamento.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Step 1: Receive Package */}
                  {(item.estado === "EN_PROCESO" ||
                    item.estado === "PENDIENTE" ||
                    item.estado === "APROBADA") && (
                    <div className="space-y-4">
                      <div className="flex items-start gap-4 p-4 bg-yellow-50 rounded-md">
                        <Package className="h-6 w-6 text-yellow-600 mt-1" />
                        <div>
                          <h4 className="font-medium text-yellow-900">
                            Confirmar Recepción
                          </h4>
                          <p className="text-sm text-yellow-700">
                            Verifica que el paquete ha llegado físicamente a la
                            farmacia.
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleStatusUpdate("RECIBIDA")}
                        disabled={actionLoading}
                        className="w-full flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                      >
                        {actionLoading
                          ? "Procesando..."
                          : "Marcar como Recibido en Farmacia"}
                      </button>
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

                  {/* Step 3: Final Handover */}
                  {item.estado === "LISTA_PARA_RETIRO" && (
                    <div className="space-y-4">
                      {/* Pickup notification from beneficiary */}
                      {item.pickupConfirmedAt ? (
                        <div className="flex items-start gap-4 p-4 bg-purple-50 rounded-md border border-purple-200">
                          <Bell className="h-6 w-6 text-purple-600 mt-1" />
                          <div>
                            <h4 className="font-medium text-purple-900">
                              El beneficiario confirmó que vendrá a retirar
                            </h4>
                            <p className="text-sm text-purple-700">
                              {item.usuarioComun?.nombre} avisó que irá a la farmacia.
                              Confirmado el {new Date(item.pickupConfirmedAt).toLocaleDateString("es-ES", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start gap-4 p-4 bg-yellow-50 rounded-md border border-yellow-200">
                          <AlertTriangle className="h-6 w-6 text-yellow-600 mt-1" />
                          <div>
                            <h4 className="font-medium text-yellow-900">
                              Esperando confirmación del beneficiario
                            </h4>
                            <p className="text-sm text-yellow-700">
                              El beneficiario aún no ha confirmado que vendrá a retirar.
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="flex items-start gap-4 p-4 bg-green-50 rounded-md">
                        <CheckCircle className="h-6 w-6 text-green-600 mt-1" />
                        <div>
                          <h4 className="font-medium text-green-900">
                            Entrega Final
                          </h4>
                          <p className="text-sm text-green-700">
                            Verifica el récipe y la identidad del beneficiario.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {item.estado === "COMPLETADA" && (
                    <div className="text-center py-8">
                      <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
                      <h3 className="mt-4 text-xl font-bold text-gray-900">
                        Solicitud Completada
                      </h3>
                      {item.receptionConfirmedAt ? (
                        <p className="text-green-600 mt-2 text-sm">
                          El beneficiario confirmó la recepción el {new Date(item.receptionConfirmedAt).toLocaleDateString("es-ES")}.
                        </p>
                      ) : (
                        <p className="text-yellow-600 mt-2 text-sm">
                          Esperando confirmación de recepción por parte del beneficiario.
                        </p>
                      )}
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
