"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock,
  Edit,
  Eye,
  FileText,
  Pill,
  RotateCcw,
  Save,
  Search,
  X,
  XCircle,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import {
  approveRequest,
  rejectRequest,
  restoreRequestToPending,
  updateMedicamentoPriority,
} from "./actions";

type SupervisorRequestStatus = "PENDIENTE" | "APROBADA" | "RECHAZADA";
type StatusFilter = "ALL" | SupervisorRequestStatus;
type UrgencyFilter = "ALL" | "ALTO" | "MEDIO" | "BAJO";

type RequestItem = {
  id: string;
  createdAt: string;
  updatedAt: string;
  estado: SupervisorRequestStatus;
  recipePhotoUrl: string | null;
  motivo: string | null;
  tiempoEspera: string;
  rejectionReason: string | null;
  approvalDate: string | null;
  approvalInstitution: string | null;
  donanteAsignadoId: string | null;
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
    fechaModificacionPrioridad?: string | null;
    prioridadModificadaPor?: {
      nombre: string;
    } | null;
    medicamento: {
      nombre: string;
      presentacion: string | null;
    };
  }[];
  farmacia: {
    id: string;
    nombre: string;
    direccion: string;
  } | null;
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

const statusConfig: Record<
  SupervisorRequestStatus,
  { label: string; badge: string; helper: string }
> = {
  PENDIENTE: {
    label: "Pendiente",
    badge: "bg-yellow-50 text-yellow-700 border-yellow-200",
    helper: "Aun no ha sido publicada para donantes.",
  },
  APROBADA: {
    label: "Aprobada",
    badge: "bg-teal-50 text-teal-700 border-teal-200",
    helper: "Ya esta visible para donantes.",
  },
  RECHAZADA: {
    label: "Rechazada",
    badge: "bg-red-50 text-red-700 border-red-200",
    helper: "No esta visible para donantes.",
  },
};

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

function formatShortDate(date: string) {
  return new Date(date).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
  });
}

function formatDateTime(date: string | null) {
  if (!date) return "N/A";

  return new Date(date).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function canRestore(request: RequestItem) {
  return (
    (request.estado === "APROBADA" || request.estado === "RECHAZADA") &&
    !request.donanteAsignadoId
  );
}

function canApprove(request: RequestItem) {
  return request.estado === "PENDIENTE" || request.estado === "RECHAZADA";
}

export default function RequestsInbox({
  requests,
}: {
  requests: RequestItem[];
}) {
  const { toast } = useToast();
  const [tableRequests, setTableRequests] = useState<RequestItem[]>(requests);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [urgencyFilter, setUrgencyFilter] = useState<UrgencyFilter>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZES)[number]>(5);

  const [selectedRequest, setSelectedRequest] = useState<RequestItem | null>(
    null,
  );
  const [approveTarget, setApproveTarget] = useState<RequestItem | null>(null);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [editingPriority, setEditingPriority] = useState<string | null>(null);
  const [tempPriorities, setTempPriorities] = useState<Record<string, number>>(
    {},
  );
  const [isUpdatingPriority, setIsUpdatingPriority] = useState(false);

  const refreshTable = useCallback(
    async (showLoader = false) => {
      if (showLoader) {
        setIsRefreshing(true);
      }

      try {
        const response = await fetch("/api/supervisor/requests", {
          method: "GET",
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(
            "No se pudieron obtener las solicitudes actualizadas",
          );
        }

        const data = await response.json();
        const nextRequests = (data.requests ?? []) as RequestItem[];
        setTableRequests(nextRequests);

        setSelectedRequest((current) =>
          current
            ? (nextRequests.find((item) => item.id === current.id) ?? null)
            : null,
        );
        setApproveTarget((current) =>
          current
            ? (nextRequests.find((item) => item.id === current.id) ?? null)
            : null,
        );
      } catch {
        if (showLoader) {
          toast({
            title: "No se pudo actualizar",
            description: "Intenta nuevamente en unos segundos.",
            variant: "destructive",
          });
        }
      } finally {
        if (showLoader) {
          setIsRefreshing(false);
        }
      }
    },
    [toast],
  );

  useEffect(() => {
    setTableRequests(requests);
  }, [requests]);

  useEffect(() => {
    const timer = setInterval(() => {
      void refreshTable();
    }, 10000);

    return () => clearInterval(timer);
  }, [refreshTable]);

  const counts = useMemo(
    () => ({
      pending: tableRequests.filter((request) => request.estado === "PENDIENTE")
        .length,
      approved: tableRequests.filter((request) => request.estado === "APROBADA")
        .length,
      rejected: tableRequests.filter(
        (request) => request.estado === "RECHAZADA",
      ).length,
    }),
    [tableRequests],
  );

  const filtered = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    return tableRequests.filter((request) => {
      const matchesStatus =
        statusFilter === "ALL" || request.estado === statusFilter;
      const matchesUrgency =
        urgencyFilter === "ALL" || request.tiempoEspera === urgencyFilter;
      const matchesSearch =
        !query ||
        request.usuarioComun.nombre.toLowerCase().includes(query) ||
        (request.usuarioComun.cedula ?? "").toLowerCase().includes(query) ||
        request.medicamentos.some((medication) =>
          medication.medicamento.nombre.toLowerCase().includes(query),
        );

      return matchesStatus && matchesUrgency && matchesSearch;
    });
  }, [tableRequests, searchQuery, statusFilter, urgencyFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginated = filtered.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize,
  );

  const closeReviewDialog = () => {
    setSelectedRequest(null);
    setIsRejecting(false);
    setRejectionReason("");
    setEditingPriority(null);
  };

  const handleApprove = async () => {
    if (!approveTarget) return;

    setIsLoading(true);

    try {
      await approveRequest(approveTarget.id);
      toast({
        title: "Solicitud aprobada",
        description: "La solicitud ahora aparece en la lista de aprobadas.",
      });
      setApproveTarget(null);
      closeReviewDialog();
      await refreshTable();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "No se pudo aprobar la solicitud.",
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
        description: "La solicitud paso a la lista de rechazadas.",
      });
      closeReviewDialog();
      await refreshTable();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "No se pudo rechazar la solicitud.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestore = async () => {
    if (!selectedRequest) return;

    setIsLoading(true);

    try {
      await restoreRequestToPending(selectedRequest.id);
      toast({
        title: "Solicitud revertida",
        description:
          "La solicitud volvio a pendientes para que puedas revisarla otra vez.",
      });
      closeReviewDialog();
      await refreshTable();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "No se pudo revertir la solicitud.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const startPriorityEdit = (
    medicamentoId: string,
    currentPriority: number,
  ) => {
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
      await refreshTable();
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

  const statusButtons: { key: StatusFilter; label: string; count: number }[] = [
    { key: "ALL", label: "Todas", count: tableRequests.length },
    { key: "PENDIENTE", label: "Pendientes", count: counts.pending },
    { key: "APROBADA", label: "Aprobadas", count: counts.approved },
    { key: "RECHAZADA", label: "Rechazadas", count: counts.rejected },
  ];

  const urgencyButtons: { key: UrgencyFilter; label: string; dot?: string }[] =
    [
      { key: "ALL", label: "Todas" },
      { key: "ALTO", label: "Alta", dot: "bg-red-500" },
      { key: "MEDIO", label: "Media", dot: "bg-yellow-500" },
      { key: "BAJO", label: "Baja", dot: "bg-green-500" },
    ];

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="flex items-center gap-2 font-semibold text-gray-800">
            <ClipboardList className="h-4 w-4 text-teal-600" />
            Solicitudes gestionables
          </h2>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400">
              {filtered.length !== tableRequests.length
                ? `${filtered.length} de ${tableRequests.length} solicitudes`
                : `${tableRequests.length} solicitudes`}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void refreshTable(true)}
              disabled={isRefreshing}
              className="h-8 rounded-lg border-gray-200 text-xs"
            >
              <RotateCcw
                className={`mr-1.5 h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`}
              />
              Actualizar
            </Button>
          </div>
        </div>

        <div className="space-y-3 border-b border-gray-50 px-6 py-4">
          <div className="flex flex-wrap gap-2">
            {statusButtons.map((button) => (
              <button
                key={button.key}
                type="button"
                onClick={() => {
                  setStatusFilter(button.key);
                  setCurrentPage(1);
                }}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  statusFilter === button.key
                    ? "border-teal-500 bg-teal-600 text-white"
                    : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <span>{button.label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                    statusFilter === button.key
                      ? "bg-white/20 text-white"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {button.count}
                </span>
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Buscar por paciente o medicamento..."
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                  setCurrentPage(1);
                }}
                className="h-9 rounded-xl border-gray-200 pl-9 text-sm focus:border-teal-400 focus:ring-teal-400/20"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {urgencyButtons.map(({ key, label, dot }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setUrgencyFilter(key);
                    setCurrentPage(1);
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    urgencyFilter === key
                      ? "border-teal-500 bg-teal-600 text-white"
                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {dot && (
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        urgencyFilter === key ? "bg-white" : dot
                      }`}
                    />
                  )}
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {tableRequests.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50">
              <ClipboardList className="h-8 w-8 text-teal-300" />
            </div>
            <div>
              <p className="font-semibold text-gray-700">
                No hay solicitudes para gestionar
              </p>
              <p className="mt-1 text-sm text-gray-400">
                Cuando entren nuevas solicitudes apareceran aqui.
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
                Intenta con otro termino o cambia los filtros.
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {paginated.map((request) => {
              const urgency = urgencyBadge(request.tiempoEspera);
              const status = statusConfig[request.estado];

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

                  <div className="flex w-56 shrink-0 items-center gap-3">
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
                      {request.medicamentos.slice(0, 3).map((medication) => (
                        <span
                          key={medication.id}
                          className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700"
                        >
                          <Pill className="h-2.5 w-2.5 text-teal-500" />
                          {medication.medicamento.nombre}
                        </span>
                      ))}
                      {request.medicamentos.length > 3 && (
                        <span className="px-1 py-0.5 text-xs text-gray-400">
                          +{request.medicamentos.length - 3} mas
                        </span>
                      )}
                    </div>
                  </div>

                  <span
                    className={`hidden shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium md:inline-flex ${status.badge}`}
                  >
                    {status.label}
                  </span>

                  <span
                    className={`hidden shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium sm:inline-flex ${urgency.badge}`}
                  >
                    <Clock className="h-3 w-3" />
                    {urgency.label}
                  </span>

                  <span className="hidden shrink-0 text-xs text-gray-400 lg:block">
                    {formatShortDate(request.updatedAt || request.createdAt)}
                  </span>

                  <Button
                    size="sm"
                    className="shrink-0 bg-teal-600 text-white shadow-sm shadow-teal-500/20"
                    onClick={() => {
                      setSelectedRequest(request);
                      setIsRejecting(false);
                      setRejectionReason("");
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

        {filtered.length > 0 && (
          <div className="flex items-center justify-between border-t border-gray-100 px-6 py-3">
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400">Mostrar</span>
              <div className="flex gap-1">
                {PAGE_SIZES.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => {
                      setPageSize(size);
                      setCurrentPage(1);
                    }}
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
                {(safePage - 1) * pageSize + 1}-
                {Math.min(safePage * pageSize, filtered.length)} de{" "}
                {filtered.length}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={safePage === 1}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              {Array.from({ length: totalPages }, (_, index) => index + 1)
                .filter(
                  (page) =>
                    page === 1 ||
                    page === totalPages ||
                    Math.abs(page - safePage) <= 1,
                )
                .reduce<(number | "...")[]>((items, page, index, pages) => {
                  if (index > 0 && page - (pages[index - 1] as number) > 1) {
                    items.push("...");
                  }
                  items.push(page);
                  return items;
                }, [])
                .map((item, index) =>
                  item === "..." ? (
                    <span
                      key={`ellipsis-${index}`}
                      className="px-1 text-xs text-gray-400"
                    >
                      ...
                    </span>
                  ) : (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setCurrentPage(item as number)}
                      className={`h-8 min-w-[2rem] rounded-lg px-2 text-xs font-medium transition-colors ${
                        safePage === item
                          ? "bg-teal-600 text-white"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {item}
                    </button>
                  ),
                )}

              <button
                type="button"
                onClick={() =>
                  setCurrentPage((page) => Math.min(totalPages, page + 1))
                }
                disabled={safePage === totalPages}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
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
            closeReviewDialog();
          }
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Revision de solicitud</DialogTitle>
            <DialogDescription>
              Revisa datos del beneficiario, receta y prioridades antes de
              decidir.
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="mt-4 space-y-6">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${statusConfig[selectedRequest.estado].badge}`}
                >
                  {statusConfig[selectedRequest.estado].label}
                </span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium ${urgencyBadge(selectedRequest.tiempoEspera).badge}`}
                >
                  <Clock className="h-3 w-3" />
                  {urgencyBadge(selectedRequest.tiempoEspera).label}
                </span>
                <span className="text-xs text-gray-400">
                  Actualizada: {formatDateTime(selectedRequest.updatedAt)}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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
                    <h3 className="mb-2 font-semibold text-gray-800">
                      Estado actual
                    </h3>
                    <p className="text-sm text-gray-700">
                      {statusConfig[selectedRequest.estado].helper}
                    </p>
                    {selectedRequest.approvalDate && (
                      <p className="mt-2 text-sm text-gray-600">
                        <span className="font-medium">Ultima aprobacion:</span>{" "}
                        {formatDateTime(selectedRequest.approvalDate)}
                      </p>
                    )}
                    {selectedRequest.approvalInstitution && (
                      <p className="mt-1 text-sm text-gray-600">
                        <span className="font-medium">Institucion:</span>{" "}
                        {selectedRequest.approvalInstitution}
                      </p>
                    )}
                    {selectedRequest.rejectionReason && (
                      <div className="mt-3 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">
                        <span className="font-medium">Motivo actual:</span>{" "}
                        {selectedRequest.rejectionReason}
                      </div>
                    )}
                  </div>

                  <div className="rounded-xl border bg-gray-50 p-4">
                    <h3 className="mb-3 font-semibold text-gray-800">
                      Medicamentos solicitados
                    </h3>
                    <ul className="space-y-3">
                      {selectedRequest.medicamentos.map((medication) => {
                        const isEditing = editingPriority === medication.id;
                        const currentPriority = (tempPriorities[
                          medication.id
                        ] ?? medication.prioridad) as 1 | 2 | 3;
                        const config =
                          priorityConfig[currentPriority] ?? priorityConfig[1];

                        return (
                          <li
                            key={medication.id}
                            className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="font-semibold text-gray-900">
                                  {medication.medicamento.nombre}
                                </p>
                                <p className="text-sm text-gray-500">
                                  Cantidad: {medication.cantidad}
                                  {medication.medicamento.presentacion
                                    ? ` ${medication.medicamento.presentacion}`
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
                                      (tempPriorities[medication.id] ??
                                        medication.prioridad) === value;

                                    return (
                                      <button
                                        key={value}
                                        type="button"
                                        disabled={isUpdatingPriority}
                                        onClick={() =>
                                          setTempPriorities((current) => ({
                                            ...current,
                                            [medication.id]: value,
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
                                    onClick={() => savePriority(medication.id)}
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
                                  startPriorityEdit(
                                    medication.id,
                                    medication.prioridad,
                                  )
                                }
                                className="mt-3 inline-flex items-center gap-1 text-xs text-gray-500 transition-colors hover:text-teal-600"
                              >
                                <Edit className="h-3 w-3" />
                                Cambiar prioridad
                              </button>
                            )}

                            {medication.fechaModificacionPrioridad && (
                              <p className="mt-3 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-[11px] text-blue-700">
                                Prioridad modificada de{" "}
                                {medication.prioridadOriginal ?? "N/A"} a{" "}
                                {medication.prioridad}
                                {medication.prioridadModificadaPor
                                  ? ` por ${medication.prioridadModificadaPor.nombre}`
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
                  <div className="rounded-xl border bg-gray-50 p-4">
                    <h3 className="mb-2 font-semibold text-gray-800">
                      Receta medica
                    </h3>
                    <div className="flex min-h-[280px] items-center justify-center overflow-hidden rounded-xl border bg-gray-100">
                      {selectedRequest.recipePhotoUrl ? (
                        <div className="relative min-h-[340px] w-full">
                          <Image
                            src={selectedRequest.recipePhotoUrl}
                            alt="Receta medica"
                            fill
                            className="object-contain"
                          />
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">
                          Sin foto de receta adjunta
                        </span>
                      )}
                    </div>
                  </div>

                  {selectedRequest.farmacia && (
                    <div className="rounded-xl border bg-gray-50 p-4">
                      <h3 className="mb-2 font-semibold text-gray-800">
                        Farmacia seleccionada
                      </h3>
                      <p className="text-sm font-medium text-gray-900">
                        {selectedRequest.farmacia.nombre}
                      </p>
                      <p className="text-sm text-gray-600">
                        {selectedRequest.farmacia.direccion}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {selectedRequest && (
            <DialogFooter className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
              {isRejecting ? (
                <div className="w-full space-y-3">
                  <Label htmlFor="rejection-reason">Motivo de rechazo</Label>
                  <Textarea
                    id="rejection-reason"
                    placeholder="Explica por que se rechaza la solicitud"
                    value={rejectionReason}
                    onChange={(event) => setRejectionReason(event.target.value)}
                    className="min-h-[96px]"
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
              ) : (
                <>
                  {selectedRequest.estado === "PENDIENTE" && (
                    <Button
                      variant="destructive"
                      onClick={() => setIsRejecting(true)}
                      disabled={isLoading}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Rechazar
                    </Button>
                  )}

                  {canRestore(selectedRequest) && (
                    <Button
                      variant="outline"
                      onClick={handleRestore}
                      disabled={isLoading}
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Volver a pendiente
                    </Button>
                  )}

                  {canApprove(selectedRequest) && (
                    <Button
                      className="bg-teal-600 text-white hover:bg-teal-700"
                      onClick={() => setApproveTarget(selectedRequest)}
                      disabled={isLoading}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Aprobar
                    </Button>
                  )}
                </>
              )}
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!approveTarget}
        onOpenChange={(open) => {
          if (!open) {
            setApproveTarget(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Quieres aprobar esta solicitud?</AlertDialogTitle>
            <AlertDialogDescription>
              {approveTarget?.estado === "RECHAZADA"
                ? "La solicitud volvera a quedar aprobada y visible para donantes."
                : "La solicitud se publicara en el listado para donantes."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>No</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void handleApprove()}
              disabled={isLoading}
              className="bg-teal-600 text-white hover:bg-teal-700"
            >
              {isLoading ? "Aprobando..." : "Si, aprobar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
