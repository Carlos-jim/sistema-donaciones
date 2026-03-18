"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { approveRequest, rejectRequest, updateMedicamentoPriority } from "./actions";
import { Eye, CheckCircle, XCircle, FileText, Edit, Save, X, Clock, Pill, ClipboardList } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

// Define concise types matching Prisma output
type RequestItem = {
  id: string;
  createdAt: Date;
  usuarioComun: {
    nombre: string;
    cedula: string | null;
    email: string;
    telefono: string | null;
  };
  medicamentos: {
    id: string;
    cantidad: number;
    prioridad: number;
    prioridadOriginal?: number | null;
    fechaModificacionPrioridad?: Date | null;
    prioridadModificadaPor?: {
      nombre: string;
    } | null;
    medicamento: {
      nombre: string;
      presentacion: string | null;
    };
  }[];
  recipePhotoUrl: string | null;
  motivo: string | null;
  tiempoEspera: string;
};

export default function RequestsInbox({
  requests,
}: {
  requests: RequestItem[];
}) {
  const [selectedRequest, setSelectedRequest] = useState<RequestItem | null>(
    null,
  );
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [editingPriority, setEditingPriority] = useState<string | null>(null);
  const [tempPriorities, setTempPriorities] = useState<Record<string, number>>({});
  const [isUpdatingPriority, setIsUpdatingPriority] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const priorityConfig = {
    1: { label: "Baja",  bg: "bg-green-100  text-green-800  border-green-200",  activeBg: "bg-green-500  text-white border-green-500"  },
    2: { label: "Media", bg: "bg-yellow-100 text-yellow-800 border-yellow-200", activeBg: "bg-yellow-500 text-white border-yellow-500" },
    3: { label: "Alta",  bg: "bg-red-100    text-red-800    border-red-200",    activeBg: "bg-red-500    text-white border-red-500"    },
  };

  const urgencyConfig: Record<string, { label: string; dot: string; badge: string }> = {
    ALTO:  { label: "Urgente",  dot: "bg-red-500",    badge: "bg-red-50 text-red-700 border-red-200"    },
    MEDIO: { label: "Media",    dot: "bg-yellow-500", badge: "bg-yellow-50 text-yellow-700 border-yellow-200" },
    BAJO:  { label: "Baja",     dot: "bg-green-500",  badge: "bg-green-50 text-green-700 border-green-200"   },
  };

  const handlePriorityEdit = (medicamentoId: string, currentPriority: number) => {
    setEditingPriority(medicamentoId);
    setTempPriorities({ ...tempPriorities, [medicamentoId]: currentPriority });
  };

  const handlePrioritySave = async (medicamentoId: string) => {
    const newPriority = tempPriorities[medicamentoId];
    if (!newPriority || newPriority < 1 || newPriority > 3) {
      toast({
        title: "Error",
        description: "La prioridad debe estar entre 1 (Baja) y 3 (Alta)",
        variant: "destructive",
      });
      return;
    }

    setIsUpdatingPriority(true);
    try {
      const result = await updateMedicamentoPriority(medicamentoId, newPriority);
      
      if (result.success) {
        toast({
          title: "Prioridad Actualizada",
          description: result.message,
        });
        setEditingPriority(null);
        router.refresh();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar la prioridad.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingPriority(false);
    }
  };

  const handlePriorityCancel = (medicamentoId: string) => {
    setEditingPriority(null);
    const newTempPriorities = { ...tempPriorities };
    delete newTempPriorities[medicamentoId];
    setTempPriorities(newTempPriorities);
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;
    setIsLoading(true);
    try {
      await approveRequest(selectedRequest.id);
      toast({
        title: "Solicitud Aprobada",
        description: "La solicitud ha sido publicada exitosamente.",
      });
      setSelectedRequest(null);
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo aprobar la solicitud.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;
    if (!rejectionReason.trim()) {
      toast({
        title: "Requerido",
        description: "Debe ingresar un motivo de rechazo.",
        variant: "destructive",
      });
      return;
    }
    setIsLoading(true);
    try {
      await rejectRequest(selectedRequest.id, rejectionReason);
      toast({
        title: "Solicitud Rechazada",
        description: "La solicitud ha sido rechazada.",
        variant: "destructive",
      });
      setSelectedRequest(null);
      setIsRejecting(false);
      setRejectionReason("");
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo rechazar la solicitud.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-teal-600" />
            Solicitudes Pendientes
          </h2>
          <span className="text-xs text-gray-400">{requests.length} solicitud{requests.length !== 1 ? "es" : ""}</span>
        </div>

        {requests.length === 0 ? (
          <div className="py-20 flex flex-col items-center gap-4 text-center px-6">
            <div className="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center">
              <ClipboardList className="w-8 h-8 text-teal-300" />
            </div>
            <div>
              <p className="font-semibold text-gray-700">Sin solicitudes pendientes</p>
              <p className="text-sm text-gray-400 mt-1">Todas las solicitudes han sido revisadas.</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {requests.map((req) => {
              const urgency = urgencyConfig[req.tiempoEspera] ?? urgencyConfig.BAJO;
              const medNames = req.medicamentos.map((m) => m.medicamento.nombre);
              return (
                <div
                  key={req.id}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50/60 transition-colors group"
                >
                  {/* Urgency dot */}
                  <div className="shrink-0 flex flex-col items-center gap-1.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${urgency.dot}`} />
                  </div>

                  {/* Beneficiary */}
                  <div className="flex items-center gap-3 w-48 shrink-0">
                    <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center text-teal-700 font-bold text-sm shrink-0">
                      {req.usuarioComun.nombre.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm text-gray-900 truncate">{req.usuarioComun.nombre}</p>
                      <p className="text-xs text-gray-400">{req.usuarioComun.cedula || "Sin cédula"}</p>
                    </div>
                  </div>

                  {/* Meds */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap gap-1.5">
                      {medNames.slice(0, 3).map((name, i) => (
                        <span key={i} className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                          <Pill className="w-2.5 h-2.5 text-teal-500" />
                          {name}
                        </span>
                      ))}
                      {medNames.length > 3 && (
                        <span className="text-xs text-gray-400 px-1 py-0.5">+{medNames.length - 3} más</span>
                      )}
                    </div>
                  </div>

                  {/* Urgency badge */}
                  <span className={`hidden sm:inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border shrink-0 ${urgency.badge}`}>
                    <Clock className="w-3 h-3" />
                    {urgency.label}
                  </span>

                  {/* Date */}
                  <span className="text-xs text-gray-400 shrink-0 hidden md:block">
                    {new Date(req.createdAt).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                  </span>

                  {/* Action */}
                  <Button
                    size="sm"
                    className="shrink-0 bg-teal-600 hover:bg-teal-700 text-white shadow-sm shadow-teal-500/20 opacity-80 group-hover:opacity-100 transition-opacity"
                    onClick={() => { setSelectedRequest(req); setIsRejecting(false); }}
                  >
                    <Eye className="w-3.5 h-3.5 mr-1.5" />
                    Revisar
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>

        {/* Detail Dialog */}
        <Dialog
          open={!!selectedRequest}
          onOpenChange={(open) => !open && setSelectedRequest(null)}
        >
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Revisión de Solicitud</DialogTitle>
              <DialogDescription>
                Detalles del beneficiario y récipe médico.
              </DialogDescription>
            </DialogHeader>

            {selectedRequest && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-gray-50 to-white p-4 rounded-xl border">
                    <h3 className="font-semibold mb-2 flex items-center">
                      <FileText className="w-4 h-4 mr-2 text-teal-600" /> Datos del Beneficiario
                    </h3>
                    <div className="text-sm space-y-1">
                      <p>
                        <span className="font-medium">Nombre:</span>{" "}
                        {selectedRequest.usuarioComun.nombre}
                      </p>
                      <p>
                        <span className="font-medium">Cédula:</span>{" "}
                        {selectedRequest.usuarioComun.cedula || "N/A"}
                      </p>
                      <p>
                        <span className="font-medium">Email:</span>{" "}
                        {selectedRequest.usuarioComun.email}
                      </p>
                      <p>
                        <span className="font-medium">Teléfono:</span>{" "}
                        {selectedRequest.usuarioComun.telefono || "N/A"}
                      </p>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-gray-50 to-white p-4 rounded-xl border">
                    <h3 className="font-semibold mb-3">Medicamentos Solicitados</h3>
                    <ul className="space-y-3">
                      {selectedRequest.medicamentos.map((m) => {
                        const isEditing = editingPriority === m.id;
                        const currentPriority = (isEditing ? tempPriorities[m.id] : m.prioridad) as 1 | 2 | 3;
                        const cfg = priorityConfig[currentPriority] ?? priorityConfig[1];
                        return (
                          <li key={m.id} className="rounded-xl border border-gray-100 bg-white overflow-hidden shadow-sm">
                            {/* Top row: name + quantity */}
                            <div className="px-4 pt-3 pb-2 flex items-start justify-between gap-2">
                              <div>
                                <p className="font-semibold text-sm text-gray-900">
                                  {m.medicamento.nombre}
                                  {m.medicamento.presentacion && (
                                    <span className="font-normal text-gray-500"> — {m.medicamento.presentacion}</span>
                                  )}
                                </p>
                                <p className="text-xs text-gray-500 mt-0.5">Cantidad: <strong>{m.cantidad}</strong></p>
                              </div>
                              {!isEditing && (
                                <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full border ${cfg.bg}`}>
                                  {cfg.label}
                                </span>
                              )}
                            </div>

                            {/* Priority editor / edit trigger */}
                            <div className={`px-4 pb-3 ${isEditing ? "pt-1" : ""}`}>
                              {isEditing ? (
                                <div className="space-y-2.5">
                                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Prioridad</p>
                                  <div className="flex gap-2">
                                    {([1, 2, 3] as const).map((val) => {
                                      const c = priorityConfig[val];
                                      const selected = (tempPriorities[m.id] ?? m.prioridad) === val;
                                      return (
                                        <button
                                          key={val}
                                          type="button"
                                          disabled={isUpdatingPriority}
                                          onClick={() => setTempPriorities({ ...tempPriorities, [m.id]: val })}
                                          className={`flex-1 py-2 rounded-lg border text-sm font-semibold transition-all ${
                                            selected ? c.activeBg : `${c.bg} hover:opacity-80`
                                          }`}
                                        >
                                          {c.label}
                                        </button>
                                      );
                                    })}
                                  </div>
                                  <div className="flex gap-2 pt-1">
                                    <Button
                                      size="sm"
                                      className="flex-1 bg-teal-600 hover:bg-teal-700 text-white h-8"
                                      onClick={() => handlePrioritySave(m.id)}
                                      disabled={isUpdatingPriority}
                                    >
                                      <Save className="w-3.5 h-3.5 mr-1" />
                                      {isUpdatingPriority ? "Guardando..." : "Guardar"}
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-8 px-3"
                                      onClick={() => handlePriorityCancel(m.id)}
                                      disabled={isUpdatingPriority}
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handlePriorityEdit(m.id, m.prioridad)}
                                  disabled={isLoading || isRejecting}
                                  className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-teal-600 transition-colors disabled:opacity-40"
                                >
                                  <Edit className="w-3 h-3" />
                                  Cambiar prioridad
                                </button>
                              )}
                            </div>

                            {/* Modification history */}
                            {m.fechaModificacionPrioridad && (
                              <div className="px-4 pb-3 pt-0">
                                <p className="text-[11px] text-blue-600 bg-blue-50 rounded-lg px-2 py-1 border border-blue-100">
                                  Modificada: {m.prioridadOriginal} → {m.prioridad}
                                  {m.prioridadModificadaPor && ` · por ${m.prioridadModificadaPor.nombre}`}
                                  {` · ${new Date(m.fechaModificacionPrioridad).toLocaleDateString()}`}
                                </p>
                              </div>
                            )}
                          </li>
                        );
                      })}
                    </ul>

                    {selectedRequest.motivo && (
                      <div className="mt-4 text-sm bg-white border border-gray-100 rounded-xl p-3">
                        <span className="font-medium text-gray-700">Motivo: </span>
                        <span className="text-gray-600">{selectedRequest.motivo}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-700">Récipe Médico</h3>
                  <div className="border rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center min-h-[200px]">
                    {selectedRequest.recipePhotoUrl ? (
                      <div className="relative w-full h-full min-h-[300px]">
                        <Image
                          src={selectedRequest.recipePhotoUrl}
                          alt="Récipe"
                          fill
                          className="object-contain"
                        />
                      </div>
                    ) : (
                      <span className="text-gray-400">
                        Sin foto de récipe adjunta
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="mt-6 flex flex-col sm:flex-row gap-2 sm:justify-end">
              {!isRejecting ? (
                <>
                  <Button
                    variant="destructive"
                    onClick={() => setIsRejecting(true)}
                    disabled={isLoading}
                  >
                    <XCircle className="w-4 h-4 mr-2" /> Rechazar
                  </Button>
                  <Button
                    className="bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 shadow-lg shadow-teal-600/20"
                    onClick={handleApprove}
                    disabled={isLoading}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" /> Aprobar
                  </Button>
                </>
              ) : (
                <div className="w-full space-y-3">
                  <Label htmlFor="reason">Motivo de Rechazo</Label>
                  <Input
                    id="reason"
                    placeholder="Explique por qué se rechaza la solicitud..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                  />
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" onClick={() => setIsRejecting(false)}>
                      Cancelar
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleReject}
                      disabled={isLoading}
                    >
                      Confirmar Rechazo
                    </Button>
                  </div>
                </div>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
