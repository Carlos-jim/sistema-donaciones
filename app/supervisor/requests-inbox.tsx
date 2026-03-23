"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  CheckCircle,
  ClipboardList,
  Clock,
  Edit,
  Eye,
  FileText,
  Pill,
  Save,
  Search,
  X,
  XCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import {
  approveRequest,
  rejectRequest,
  updateMedicamentoPriority,
} from "./actions";

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

const priorityConfig = {
  1: {
    label: "Baja",
    badge: "bg-green-100 text-green-800 border-green-200",
    active: "bg-green-600 text-white border-green-600",
  },
  2: {
    label: "Media",
    badge: "bg-yellow-100 text-yellow-800 border-yellow-200",
    active: "bg-yellow-500 text-white border-yellow-500",
  },
  3: {
    label: "Alta",
    badge: "bg-red-100 text-red-800 border-red-200",
    active: "bg-red-600 text-white border-red-600",
  },
} as const;

const urgencyConfig: Record<
  string,
  { label: string; dot: string; badge: string }
> = {
  ALTO: {
    label: "Alta",
    dot: "bg-red-500",
    badge: "bg-red-50 text-red-700 border-red-200",
  },
  MEDIO: {
    label: "Media",
    dot: "bg-yellow-500",
    badge: "bg-yellow-50 text-yellow-700 border-yellow-200",
  },
  BAJO: {
    label: "Baja",
    dot: "bg-green-500",
    badge: "bg-green-50 text-green-700 border-green-200",
  },
};

const PAGE_SIZES = [5, 10, 20] as const;
type UrgencyFilter = "ALL" | "ALTO" | "MEDIO" | "BAJO";

export default function RequestsInbox({
  requests,
}: {
  requests: RequestItem[];
}) {
  const router = useRouter();
  const { toast } = useToast();

  // ── Filter & pagination state ────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [urgencyFilter, setUrgencyFilter] = useState<UrgencyFilter>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZES)[number]>(5);

  // ── Dialog state ─────────────────────────────────────────
  const [selectedRequest, setSelectedRequest] = useState<RequestItem | null>(
    null,
  );
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [editingPriority, setEditingPriority] = useState<string | null>(null);
  const [tempPriorities, setTempPriorities] = useState<Record<string, number>>(
    {},
  );
  const [isUpdatingPriority, setIsUpdatingPriority] = useState(false);

  // ── Filtered & paginated data ────────────────────────────
  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return requests.filter((r) => {
      const matchesUrgency = urgencyFilter === "ALL" || r.tiempoEspera === urgencyFilter;
      const matchesSearch =
        !q ||
        r.usuarioComun.nombre.toLowerCase().includes(q) ||
        (r.usuarioComun.cedula ?? "").toLowerCase().includes(q) ||
        r.medicamentos.some((m) => m.medicamento.nombre.toLowerCase().includes(q));
      return matchesUrgency && matchesSearch;
    });
  }, [requests, searchQuery, urgencyFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginated = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const resetPage = () => setCurrentPage(1);

  const handleSearchChange = (v: string) => { setSearchQuery(v); resetPage(); };
  const handleUrgencyChange = (v: UrgencyFilter) => { setUrgencyFilter(v); resetPage(); };

  const handleApprove = async () => {
    if (!selectedRequest) return;

    setIsLoading(true);
    try {
      await approveRequest(selectedRequest.id);
      toast({
        title: "Solicitud aprobada",
        description: "La solicitud fue publicada correctamente.",
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
        title: "Motivo requerido",
        description: "Debes escribir un motivo de rechazo.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await rejectRequest(selectedRequest.id, rejectionReason);
      toast({
        title: "Solicitud rechazada",
        description: "La solicitud fue rechazada.",
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

  const startPriorityEdit = (medicamentoId: string, currentPriority: number) => {
    setEditingPriority(medicamentoId);
    setTempPriorities((current) => ({
      ...current,
      [medicamentoId]: currentPriority,
    }));
  };

  const savePriority = async (solicitudMedicamentoId: string) => {
    const nextPriority = tempPriorities[solicitudMedicamentoId];
    if (!nextPriority || nextPriority < 1 || nextPriority > 3) return;

    setIsUpdatingPriority(true);
    try {
      const result = await updateMedicamentoPriority(
        solicitudMedicamentoId,
        nextPriority,
      );

      if (!result.success) {
        throw new Error("Priority update failed");
      }

      toast({
        title: "Prioridad actualizada",
        description: "Se guardo el nuevo nivel de prioridad.",
      });
      setEditingPriority(null);
      router.refresh();
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

  const urgencyBadge = (tiempoEspera: string) =>
    urgencyConfig[tiempoEspera] ?? urgencyConfig.BAJO;

  const urgencyButtons: { key: UrgencyFilter; label: string; dot?: string }[] = [
    { key: "ALL", label: "Todas" },
    { key: "ALTO", label: "Alta", dot: "bg-red-500" },
    { key: "MEDIO", label: "Media", dot: "bg-yellow-500" },
    { key: "BAJO", label: "Baja", dot: "bg-green-500" },
  ];

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="flex items-center gap-2 font-semibold text-gray-800">
            <ClipboardList className="h-4 w-4 text-teal-600" />
            Solicitudes pendientes
          </h2>
          <span className="text-xs text-gray-400">
            {filtered.length !== requests.length
              ? `${filtered.length} de ${requests.length} solicitud${requests.length === 1 ? "" : "es"}`
              : `${requests.length} solicitud${requests.length === 1 ? "" : "es"}`}
          </span>
        </div>

        {/* Filters toolbar */}
        <div className="flex flex-col gap-3 border-b border-gray-50 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Search */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <Input
              placeholder="Buscar por paciente o medicamento..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="h-9 rounded-xl border-gray-200 pl-9 text-sm focus:border-teal-400 focus:ring-teal-400/20"
            />
          </div>

          {/* Urgency filter pills */}
          <div className="flex items-center gap-1.5">
            {urgencyButtons.map(({ key, label, dot }) => (
              <button
                key={key}
                onClick={() => handleUrgencyChange(key)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  urgencyFilter === key
                    ? "border-teal-500 bg-teal-600 text-white"
                    : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                {dot && (
                  <span className={`h-1.5 w-1.5 rounded-full ${urgencyFilter === key ? "bg-white" : dot}`} />
                )}
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        {requests.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50">
              <ClipboardList className="h-8 w-8 text-teal-300" />
            </div>
            <div>
              <p className="font-semibold text-gray-700">
                No hay solicitudes pendientes
              </p>
              <p className="mt-1 text-sm text-gray-400">
                Todo esta revisado por ahora.
              </p>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100">
              <Search className="h-6 w-6 text-gray-300" />
            </div>
            <div>
              <p className="font-semibold text-gray-600">Sin resultados</p>
              <p className="mt-1 text-sm text-gray-400">
                Intenta con otro término o quita los filtros.
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {paginated.map((request) => {
              const urgency = urgencyBadge(request.tiempoEspera);
              const medicationNames = request.medicamentos.map(
                (item) => item.medicamento.nombre,
              );

              return (
                <div
                  key={request.id}
                  className="group flex items-center gap-4 px-6 py-4 transition-colors hover:bg-gray-50/70"
                >
                  <div className="flex shrink-0 flex-col items-center gap-1.5">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${urgency.dot}`}
                    />
                  </div>

                  <div className="flex w-52 shrink-0 items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-sm font-bold text-teal-700">
                      {request.usuarioComun.nombre.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-900">
                        {request.usuarioComun.nombre}
                      </p>
                      <p className="text-xs text-gray-400">
                        {request.usuarioComun.cedula || "Sin cedula"}
                      </p>
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap gap-1.5">
                      {medicationNames.slice(0, 3).map((name) => (
                        <span
                          key={name}
                          className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700"
                        >
                          <Pill className="h-2.5 w-2.5 text-teal-500" />
                          {name}
                        </span>
                      ))}
                      {medicationNames.length > 3 && (
                        <span className="px-1 py-0.5 text-xs text-gray-400">
                          +{medicationNames.length - 3} mas
                        </span>
                      )}
                    </div>
                  </div>

                  <span
                    className={`hidden shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium sm:inline-flex ${urgency.badge}`}
                  >
                    <Clock className="h-3 w-3" />
                    {urgency.label}
                  </span>

                  <span className="hidden shrink-0 text-xs text-gray-400 md:block">
                    {new Date(request.createdAt).toLocaleDateString("es-ES", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>

                  <Button
                    size="sm"
                    className="shrink-0 bg-teal-600 text-white shadow-sm shadow-teal-500/20 transition-opacity group-hover:opacity-100"
                    onClick={() => {
                      setSelectedRequest(request);
                      setIsRejecting(false);
                    }}
                  >
                    <Eye className="mr-1.5 h-3.5 w-3.5" />
                    Revisar
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination footer */}
        {filtered.length > 0 && (
          <div className="flex items-center justify-between border-t border-gray-100 px-6 py-3">
            {/* Left: page size selector + info */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400">Mostrar</span>
              <div className="flex gap-1">
                {PAGE_SIZES.map((size) => (
                  <button
                    key={size}
                    onClick={() => { setPageSize(size); resetPage(); }}
                    className={`h-7 w-8 rounded-lg text-xs font-medium transition-colors ${
                      pageSize === size
                        ? "bg-teal-600 text-white"
                        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
              <span className="text-xs text-gray-400">
                {filtered.length === 0
                  ? "0 resultados"
                  : `${(safePage - 1) * pageSize + 1}–${Math.min(safePage * pageSize, filtered.length)} de ${filtered.length}`}
              </span>
            </div>

            {/* Right: page nav */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
                .reduce<(number | "...")[]>((acc, p, idx, arr) => {
                  if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("...");
                  acc.push(p);
                  return acc;
                }, [])
                .map((item, idx) =>
                  item === "..." ? (
                    <span key={`ellipsis-${idx}`} className="px-1 text-xs text-gray-400">…</span>
                  ) : (
                    <button
                      key={item}
                      onClick={() => setCurrentPage(item as number)}
                      className={`h-8 min-w-[2rem] rounded-lg px-2 text-xs font-medium transition-colors ${
                        safePage === item
                          ? "bg-teal-600 text-white"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {item}
                    </button>
                  )
                )}

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <Dialog
        open={!!selectedRequest}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedRequest(null);
            setIsRejecting(false);
            setRejectionReason("");
            setEditingPriority(null);
          }
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Revision de solicitud</DialogTitle>
            <DialogDescription>
              Revisa datos del beneficiario, recipe y prioridades antes de
              aprobar.
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div className="rounded-xl border bg-gray-50 p-4">
                  <h3 className="mb-2 flex items-center font-semibold text-gray-800">
                    <FileText className="mr-2 h-4 w-4 text-teal-600" />
                    Datos del beneficiario
                  </h3>
                  <div className="space-y-1 text-sm text-gray-700">
                    <p>
                      <span className="font-medium">Nombre:</span>{" "}
                      {selectedRequest.usuarioComun.nombre}
                    </p>
                    <p>
                      <span className="font-medium">Cedula:</span>{" "}
                      {selectedRequest.usuarioComun.cedula || "N/A"}
                    </p>
                    <p>
                      <span className="font-medium">Email:</span>{" "}
                      {selectedRequest.usuarioComun.email}
                    </p>
                    <p>
                      <span className="font-medium">Telefono:</span>{" "}
                      {selectedRequest.usuarioComun.telefono || "N/A"}
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border bg-gray-50 p-4">
                  <h3 className="mb-3 font-semibold text-gray-800">
                    Medicamentos solicitados
                  </h3>
                  <ul className="space-y-3">
                    {selectedRequest.medicamentos.map((med) => {
                      const isEditing = editingPriority === med.id;
                      const currentPriority =
                        (tempPriorities[med.id] ?? med.prioridad) as 1 | 2 | 3;
                      const config =
                        priorityConfig[currentPriority] ?? priorityConfig[1];

                      return (
                        <li
                          key={med.id}
                          className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-semibold text-gray-900">
                                {med.medicamento.nombre}
                              </p>
                              <p className="text-sm text-gray-500">
                                Cantidad: {med.cantidad}
                                {med.medicamento.presentacion
                                  ? ` ${med.medicamento.presentacion}`
                                  : ""}
                              </p>
                            </div>
                            {!isEditing && (
                              <span
                                className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${config.badge}`}
                              >
                                {config.label}
                              </span>
                            )}
                          </div>

                          {isEditing ? (
                            <div className="mt-3 space-y-3">
                              <div className="flex gap-2">
                                {([1, 2, 3] as const).map((value) => {
                                  const buttonConfig = priorityConfig[value];
                                  const isSelected =
                                    (tempPriorities[med.id] ?? med.prioridad) ===
                                    value;

                                  return (
                                    <button
                                      key={value}
                                      type="button"
                                      disabled={isUpdatingPriority}
                                      onClick={() =>
                                        setTempPriorities((current) => ({
                                          ...current,
                                          [med.id]: value,
                                        }))
                                      }
                                      className={`flex-1 rounded-lg border px-3 py-2 text-sm font-semibold ${
                                        isSelected
                                          ? buttonConfig.active
                                          : buttonConfig.badge
                                      }`}
                                    >
                                      {buttonConfig.label}
                                    </button>
                                  );
                                })}
                              </div>

                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  className="flex-1 bg-teal-600 text-white hover:bg-teal-700"
                                  onClick={() => savePriority(med.id)}
                                  disabled={isUpdatingPriority}
                                >
                                  <Save className="mr-1 h-3.5 w-3.5" />
                                  Guardar
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditingPriority(null)}
                                  disabled={isUpdatingPriority}
                                >
                                  <X className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() =>
                                startPriorityEdit(med.id, med.prioridad)
                              }
                              className="mt-3 inline-flex items-center gap-1 text-xs text-gray-500 transition-colors hover:text-teal-600"
                            >
                              <Edit className="h-3 w-3" />
                              Cambiar prioridad
                            </button>
                          )}

                          {med.fechaModificacionPrioridad && (
                            <p className="mt-3 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-[11px] text-blue-700">
                              Prioridad modificada de {med.prioridadOriginal} a{" "}
                              {med.prioridad}
                              {med.prioridadModificadaPor
                                ? ` por ${med.prioridadModificadaPor.nombre}`
                                : ""}
                            </p>
                          )}
                        </li>
                      );
                    })}
                  </ul>

                  {selectedRequest.motivo && (
                    <div className="mt-4 rounded-xl border bg-white p-3 text-sm text-gray-700">
                      <span className="font-medium">Motivo:</span>{" "}
                      {selectedRequest.motivo}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-gray-700">Recipe medico</h3>
                <div className="flex min-h-[240px] items-center justify-center overflow-hidden rounded-xl border bg-gray-100">
                  {selectedRequest.recipePhotoUrl ? (
                    <div className="relative min-h-[320px] w-full">
                      <Image
                        src={selectedRequest.recipePhotoUrl}
                        alt="Recipe medico"
                        fill
                        className="object-contain"
                      />
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">
                      Sin foto de recipe adjunta
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
            {!isRejecting ? (
              <>
                <Button
                  variant="destructive"
                  onClick={() => setIsRejecting(true)}
                  disabled={isLoading}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Rechazar
                </Button>
                <Button
                  className="bg-teal-600 text-white hover:bg-teal-700"
                  onClick={handleApprove}
                  disabled={isLoading}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Aprobar
                </Button>
              </>
            ) : (
              <div className="w-full space-y-3">
                <Label htmlFor="rejection-reason">Motivo de rechazo</Label>
                <Input
                  id="rejection-reason"
                  placeholder="Explica por que se rechaza la solicitud"
                  value={rejectionReason}
                  onChange={(event) => setRejectionReason(event.target.value)}
                />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => setIsRejecting(false)}
                    disabled={isLoading}
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleReject}
                    disabled={isLoading}
                  >
                    Confirmar rechazo
                  </Button>
                </div>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
