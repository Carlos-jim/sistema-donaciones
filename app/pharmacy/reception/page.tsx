"use client";

import { useState, useEffect } from "react";
import { getSolicitudByCodigo, updateStatus, getPendingPickups } from "../actions";
import { EstadoSolicitud, EstadoDonacion } from "@prisma/client";
import {
  CheckCircle,
  Search,
  Package,
  ClipboardCheck,
  HandHeart,
  AlertTriangle,
  Gift,
  Bell,
  User,
} from "lucide-react";

type ItemWithDetails = Awaited<ReturnType<typeof getSolicitudByCodigo>>["data"];
type PendingPickup = Awaited<ReturnType<typeof getPendingPickups>>["data"][number];

export default function PharmacyPage() {
  const [codigo, setCodigo] = useState("");
  const [item, setItem] = useState<ItemWithDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [pendingPickups, setPendingPickups] = useState<PendingPickup[]>([]);

  // Load pending pickups on mount
  // We get farmaciaId from the first search result or URL — for now use a polling approach
  const loadPendingPickups = async (farmaciaId: string) => {
    const result = await getPendingPickups(farmaciaId);
    if (result.success) setPendingPickups(result.data);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setItem(null);

    const result = await getSolicitudByCodigo(codigo);
    if (result.success && result.data) {
      setItem(result.data);
      // If solicitud, load pending pickups for this pharmacy
      if (result.data.type === "SOLICITUD" && result.data.farmaciaEntregaId) {
        loadPendingPickups(result.data.farmaciaEntregaId);
      }
    } else {
      setError(result.error || "Código no encontrado");
    }
    setLoading(false);
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (!item) return;
    setActionLoading(true);
    const result = await updateStatus(item.id, item.type, newStatus);
    if (result.success) {
      const updated = await getSolicitudByCodigo(item.codigo!);
      if (updated.success && updated.data) {
        setItem(updated.data);
      }
    } else {
      alert("Error al actualizar el estado");
    }
    setActionLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full space-y-8">
        <div className="text-center">
          <HandHeart className="mx-auto h-12 w-12 text-teal-600" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Portal de Farmacia
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Gestiona la recepción, validación y entrega de donaciones y
            solicitudes.
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
                type="text"
                className="focus:ring-teal-500 focus:border-teal-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md p-3 border"
                placeholder="Ingresa el código (ej. A1B2C3)"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700 focus:outline-none disabled:opacity-50"
            >
              {loading ? "Buscando..." : "Buscar"}
            </button>
          </form>
          {error && <p className="mt-2 text-red-600 text-sm">{error}</p>}
        </div>

        {/* Action Section */}
        {item && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden animate-fade-in">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {item.type === "SOLICITUD" ? "Solicitud" : "Donación"} #
                    {item.codigo}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {item.type === "SOLICITUD"
                      ? `Beneficiario: ${item.usuarioComun?.nombre}`
                      : `Donante: ${item.usuarioComun?.nombre}`}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-semibold 
                  ${
                    item.estado === "RECIBIDA" || item.estado === "ENTREGADA"
                      ? "bg-blue-100 text-blue-800"
                      : item.estado === "LISTA_PARA_RETIRO"
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {item.estado.replace(/_/g, " ")}
                </span>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* SOLICITUD LOGIC */}
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
                  )}

                  {/* Step 2: Validate Medication */}
                  {item.estado === "RECIBIDA" && (
                    <div className="space-y-4">
                      <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-md">
                        <ClipboardCheck className="h-6 w-6 text-blue-600 mt-1" />
                        <div>
                          <h4 className="font-medium text-blue-900">
                            Validación Física
                          </h4>
                          <p className="text-sm text-blue-700">
                            Realiza el checklist de seguridad antes de habilitar
                            el retiro.
                          </p>
                        </div>
                      </div>
                      {/* ... Checklist omitted for brevity/simplicity in this refactor, can keep if needed ... */}
                      <div className="bg-gray-50 p-4 rounded-md space-y-2">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            className="rounded text-teal-600 focus:ring-teal-500"
                          />
                          <span className="text-sm text-gray-700">
                            Empaque sellado e íntegro
                          </span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            className="rounded text-teal-600 focus:ring-teal-500"
                          />
                          <span className="text-sm text-gray-700">
                            Fecha de vencimiento vigente
                          </span>
                        </label>
                      </div>

                      <div className="flex gap-4">
                        <button
                          onClick={() => handleStatusUpdate("RECHAZADA")}
                          disabled={actionLoading}
                          className="flex-1 px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50"
                        >
                          Rechazar
                        </button>
                        <button
                          onClick={() =>
                            handleStatusUpdate("LISTA_PARA_RETIRO")
                          }
                          disabled={actionLoading}
                          className="flex-1 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                        >
                          {actionLoading
                            ? "Procesando..."
                            : "Validación Exitosa"}
                        </button>
                      </div>
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
                      </div>
                      <button
                        onClick={() => handleStatusUpdate("COMPLETADA")}
                        disabled={actionLoading}
                        className="w-full px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700"
                      >
                        {actionLoading
                          ? "Finalizando..."
                          : "Confirmar Entrega y Cerrar"}
                      </button>
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

              {/* DONACION LOGIC */}
              {item.type === "DONACION" && (
                <>
                  <div className="grid sm:grid-cols-2 gap-4 mb-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-500">
                        Medicamento
                      </h4>
                      <p className="font-semibold text-gray-900 mt-1">
                        {item.medicamentos[0]?.medicamento.nombre}
                        <span className="text-gray-500 font-normal ml-2">
                          ({item.medicamentos[0]?.cantidad} unidades)
                        </span>
                      </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-500">
                        Estado Actual
                      </h4>
                      <p className="font-semibold text-gray-900 mt-1">
                        {item.estado}
                      </p>
                    </div>
                    {item.descripcion && (
                      <div className="bg-gray-50 p-4 rounded-lg sm:col-span-2">
                        <h4 className="text-sm font-medium text-gray-500">
                          Descripción
                        </h4>
                        <p className="text-gray-700 mt-1 text-sm">
                          {item.descripcion}
                        </p>
                      </div>
                    )}
                  </div>

                  {(item.estado === "DISPONIBLE" ||
                    item.estado === "RESERVADA") && (
                    <div className="space-y-4">
                      <div className="flex items-start gap-4 p-4 bg-teal-50 rounded-md">
                        <Gift className="h-6 w-6 text-teal-600 mt-1" />
                        <div>
                          <h4 className="font-medium text-teal-900">
                            Recepción de Donación
                          </h4>
                          <p className="text-sm text-teal-700">
                            Recibe los medicamentos del donante y verifica su
                            estado físico.
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleStatusUpdate("RECIBIDA")}
                        disabled={actionLoading}
                        className="w-full flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700"
                      >
                        {actionLoading
                          ? "Procesando..."
                          : "Confirmar Recepción (Marcar como Recibida)"}
                      </button>
                    </div>
                  )}

                  {(item.estado === "RECIBIDA" ||
                    item.estado === "ENTREGADA") && (
                    <div className="text-center py-8">
                      <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
                      <h3 className="mt-4 text-xl font-bold text-gray-900">
                        Donación Recibida Correctamente
                      </h3>
                      <p className="text-gray-500">
                        Los medicamentos ahora están en posesión de la farmacia
                        (Status: {item.estado}).
                      </p>
                    </div>
                  )}

                  {item.estado === "EXPIRADA" && (
                    <div className="text-center py-8">
                      <AlertTriangle className="mx-auto h-16 w-16 text-red-500" />
                      <h3 className="mt-4 text-xl font-bold text-gray-900">
                        Donación Expirada
                      </h3>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
