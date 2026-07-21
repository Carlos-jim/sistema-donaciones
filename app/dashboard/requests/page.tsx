"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MapPin,
  Clock,
  PlusCircle,
  Calendar,
  Pill,
  FileText,
  Eye,
  XCircle,
  CheckCircle,
  Building2,
  User,
  Pencil,
  Plus,
  Trash2,
  QrCode,
} from "lucide-react";
import { getQrImageUrl } from "@/lib/qr";
import { RecipeUpload } from "@/components/recipe-upload";

const smoothEase = [0.25, 0.46, 0.45, 0.94] as [number, number, number, number];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: smoothEase },
  },
};

type EstadoSolicitud =
  | "PENDIENTE"
  | "APROBADA"
  | "EN_PROCESO"
  | "RECIBIDA"
  | "LISTA_PARA_RETIRO"
  | "RECHAZADA"
  | "COMPLETADA"
  | "CANCELADA";

interface Solicitud {
  id: string;
  estado: EstadoSolicitud;
  motivo: string | null;
  direccion: { lat: number; long: number; calle: string } | null;
  tiempoEspera: string;
  requiresPrescription: boolean;
  recipePhotoUrl: string | null;
  createdAt: string;
  donanteAsignadoId: string | null;
  rejectionReason: string | null;
  farmaciaConfirmada: boolean | null;
  motivoRechazoFarmacia: string | null;
  codigoComprobante: string | null;
  codigoRetiroSolicitante: string | null;
  requesterQrPayload: string | null;
  pickupConfirmedAt: string | null;
  receptionConfirmedAt: string | null;
  usuarioComun: { nombre: string };
  farmaciaEntrega: {
    id: string;
    nombre: string;
    direccion: string;
    telefono: string | null;
  } | null;
  donanteAsignado: {
    id: string;
    nombre: string;
  } | null;
  medicamentos: Array<{
    medicamento: { nombre: string };
    cantidad: number;
    unidad?: string;
  }>;
}

const ESTADO_CONFIG: Record<
  EstadoSolicitud,
  { label: string; color: string; bar: string }
> = {
  PENDIENTE: {
    label: "Pendiente",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    bar: "bg-yellow-400",
  },
  APROBADA: {
    label: "Aprobada",
    color: "bg-teal-100 text-teal-800 border-teal-200",
    bar: "bg-teal-500",
  },
  EN_PROCESO: {
    label: "En Proceso",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    bar: "bg-blue-500",
  },
  RECIBIDA: {
    label: "Recibida",
    color: "bg-indigo-100 text-indigo-800 border-indigo-200",
    bar: "bg-indigo-500",
  },
  LISTA_PARA_RETIRO: {
    label: "Lista para Retiro",
    color: "bg-purple-100 text-purple-800 border-purple-200",
    bar: "bg-purple-500",
  },
  RECHAZADA: {
    label: "Rechazada",
    color: "bg-red-100 text-red-800 border-red-200",
    bar: "bg-red-500",
  },
  COMPLETADA: {
    label: "Completada",
    color: "bg-green-100 text-green-800 border-green-200",
    bar: "bg-green-500",
  },
  CANCELADA: {
    label: "Cancelada",
    color: "bg-gray-100 text-gray-600 border-gray-200",
    bar: "bg-gray-400",
  },
};

const URGENCY_CONFIG: Record<string, { label: string; color: string }> = {
  ALTO: {
    label: "Alta (1-2 días)",
    color: "bg-red-100 text-red-800 hover:bg-red-200 border-red-200",
  },
  MEDIO: {
    label: "Media (3-4 días)",
    color:
      "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200",
  },
  BAJO: {
    label: "Baja (1 semana)",
    color: "bg-green-100 text-green-800 hover:bg-green-200 border-green-200",
  },
};

function canCancel(s: Solicitud) {
  return (
    (s.estado === "PENDIENTE" || s.estado === "APROBADA") &&
    !s.donanteAsignadoId
  );
}

function canEdit(s: Solicitud) {
  return s.estado === "PENDIENTE" || s.estado === "RECHAZADA";
}

function canDelete(s: Solicitud) {
  return s.estado === "RECHAZADA";
}

function needsPharmacyConfirmation(s: Solicitud) {
  return (
    s.estado === "EN_PROCESO" &&
    s.farmaciaEntrega &&
    s.farmaciaConfirmada === null
  );
}

function pharmacyWasRejected(s: Solicitud) {
  return s.estado === "EN_PROCESO" && s.farmaciaConfirmada === false;
}

function canConfirmPickup(s: Solicitud) {
  return s.estado === "LISTA_PARA_RETIRO" && !s.pickupConfirmedAt;
}

function canConfirmReception(s: Solicitud) {
  return s.estado === "COMPLETADA" && !s.receptionConfirmedAt;
}

export default function MyRequestsPage() {
  const [requests, setRequests] = useState<Solicitud[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSolicitud, setSelectedSolicitud] = useState<Solicitud | null>(
    null,
  );
  const [cancelTarget, setCancelTarget] = useState<Solicitud | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Solicitud | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  // Pharmacy rejection
  const [rejectPharmacyTarget, setRejectPharmacyTarget] =
    useState<Solicitud | null>(null);
  const [rejectPharmacyMotivo, setRejectPharmacyMotivo] = useState("");
  const [isConfirmingPharmacy, setIsConfirmingPharmacy] = useState(false);
  // Pickup / reception
  const [isConfirmingPickup, setIsConfirmingPickup] = useState(false);
  const [isConfirmingReception, setIsConfirmingReception] = useState(false);
  // Edit
  const [editTarget, setEditTarget] = useState<Solicitud | null>(null);
  const [editMotivo, setEditMotivo] = useState("");
  const [editUrgency, setEditUrgency] = useState<string>("");
  const [editRequiresPrescription, setEditRequiresPrescription] =
    useState(false);
  const [editRecipePhotoUrl, setEditRecipePhotoUrl] = useState<string | null>(
    null,
  );
  const [editMeds, setEditMeds] = useState<
    { nombre: string; cantidad: number }[]
  >([]);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const { toast } = useToast();

  async function fetchSolicitudes() {
    try {
      const res = await fetch("/api/requests");
      if (res.ok) setRequests(await res.json());
    } catch (error) {
      console.error("Error fetching solicitudes:", error);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchSolicitudes();
  }, []);

  const handleCancel = async () => {
    if (!cancelTarget) return;
    setIsCancelling(true);
    try {
      const res = await fetch(`/api/requests/${cancelTarget.id}/cancel`, {
        method: "PATCH",
      });
      const data = await res.json();
      if (!res.ok) {
        toast({
          title: "No se pudo cancelar",
          description: data.error,
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Solicitud cancelada",
        description: "Tu solicitud fue cancelada exitosamente.",
      });
      setCancelTarget(null);
      fetchSolicitudes();
    } catch {
      toast({
        title: "Error",
        description: "Error de conexión.",
        variant: "destructive",
      });
    } finally {
      setIsCancelling(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/requests/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        toast({
          title: "No se pudo eliminar",
          description: data.error,
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Solicitud eliminada",
        description: "La solicitud rechazada fue eliminada definitivamente.",
      });
      setDeleteTarget(null);
      setSelectedSolicitud(null);
      fetchSolicitudes();
    } catch {
      toast({
        title: "Error",
        description: "Error de conexión.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleConfirmPharmacy = async (solicitud: Solicitud) => {
    setIsConfirmingPharmacy(true);
    try {
      const res = await fetch(
        `/api/requests/${solicitud.id}/confirm-pharmacy`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ confirmed: true }),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Farmacia confirmada",
        description: "Has confirmado la farmacia de entrega.",
      });
      setSelectedSolicitud(null);
      fetchSolicitudes();
    } catch {
      toast({
        title: "Error",
        description: "Error de conexión.",
        variant: "destructive",
      });
    } finally {
      setIsConfirmingPharmacy(false);
    }
  };

  const handleRejectPharmacy = async () => {
    if (!rejectPharmacyTarget) return;
    if (!rejectPharmacyMotivo.trim()) {
      toast({
        title: "Requerido",
        description: "Indica por qué no estás de acuerdo con la farmacia.",
        variant: "destructive",
      });
      return;
    }
    setIsConfirmingPharmacy(true);
    try {
      const res = await fetch(
        `/api/requests/${rejectPharmacyTarget.id}/confirm-pharmacy`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            confirmed: false,
            motivo: rejectPharmacyMotivo,
          }),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Farmacia rechazada",
        description: "El donante será notificado para proponer otra farmacia.",
      });
      setRejectPharmacyTarget(null);
      setRejectPharmacyMotivo("");
      setSelectedSolicitud(null);
      fetchSolicitudes();
    } catch {
      toast({
        title: "Error",
        description: "Error de conexión.",
        variant: "destructive",
      });
    } finally {
      setIsConfirmingPharmacy(false);
    }
  };

  const handleConfirmPickup = async (solicitud: Solicitud) => {
    setIsConfirmingPickup(true);
    try {
      const res = await fetch(`/api/requests/${solicitud.id}/confirm-pickup`, {
        method: "PATCH",
      });
      const data = await res.json();
      if (!res.ok) {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Confirmado",
        description: "La farmacia ha sido notificada de que irás a retirar.",
      });
      setSelectedSolicitud(null);
      fetchSolicitudes();
    } catch {
      toast({
        title: "Error",
        description: "Error de conexión.",
        variant: "destructive",
      });
    } finally {
      setIsConfirmingPickup(false);
    }
  };

  const handleConfirmReception = async (solicitud: Solicitud) => {
    setIsConfirmingReception(true);
    try {
      const res = await fetch(
        `/api/requests/${solicitud.id}/confirm-reception`,
        { method: "PATCH" },
      );
      const data = await res.json();
      if (!res.ok) {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Recepción confirmada",
                        description: "¡Gracias! Has confirmado que recibiste tu insumo médico.",
      });
      setSelectedSolicitud(null);
      fetchSolicitudes();
    } catch {
      toast({
        title: "Error",
        description: "Error de conexión.",
        variant: "destructive",
      });
    } finally {
      setIsConfirmingReception(false);
    }
  };

  const openEdit = (s: Solicitud) => {
    setEditTarget(s);
    setEditMotivo(s.motivo || "");
    setEditUrgency(s.tiempoEspera);
    setEditRequiresPrescription(s.requiresPrescription);
    setEditRecipePhotoUrl(s.recipePhotoUrl);
    setEditMeds(
      s.medicamentos.map((m) => ({
        nombre: m.medicamento.nombre,
        cantidad: m.cantidad,
      })),
    );
    setSelectedSolicitud(null);
  };

  const handleSaveEdit = async () => {
    if (!editTarget) return;
    if (editRequiresPrescription && !editRecipePhotoUrl) {
      toast({
        title: "Récipe requerido",
        description: "Adjunta el récipe médico antes de reenviar la solicitud.",
        variant: "destructive",
      });
      return;
    }
    setIsSavingEdit(true);
    try {
      const res = await fetch(`/api/requests/${editTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          motivo: editMotivo,
          tiempoEspera: editUrgency,
          requiresPrescription: editRequiresPrescription,
          recipePhotoUrl: editRequiresPrescription
            ? editRecipePhotoUrl
            : null,
          medicamentos: editMeds,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive",
        });
        return;
      }
      toast({
        title:
          editTarget.estado === "RECHAZADA"
            ? "Solicitud reenviada"
            : "Solicitud actualizada",
        description:
          editTarget.estado === "RECHAZADA"
            ? "Volvió a estado pendiente para que el ente de salud la revise."
            : undefined,
      });
      setEditTarget(null);
      fetchSolicitudes();
    } catch {
      toast({ title: "Error de conexión", variant: "destructive" });
    } finally {
      setIsSavingEdit(false);
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  const formatDateTime = (d: string) =>
    new Date(d).toLocaleDateString("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const getPharmacyStatusLabel = (s: Solicitud) => {
    if (!s.farmaciaEntrega) return null;
    if (s.farmaciaConfirmada === true)
      return {
        label: "Farmacia confirmada",
        color: "bg-green-100 text-green-800 border-green-200",
      };
    if (s.farmaciaConfirmada === false)
      return {
        label: "Esperando nueva farmacia",
        color: "bg-orange-100 text-orange-800 border-orange-200",
      };
    return {
      label: "Confirma la farmacia",
      color: "bg-blue-100 text-blue-800 border-blue-200",
    };
  };

  return (
    <>
      <motion.div
        className="space-y-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Mis Solicitudes
            </h1>
            <p className="text-gray-500 mt-1">
              Gestiona y da seguimiento a tus solicitudes de insumos médicos.
            </p>
          </div>
          <Link href="/dashboard/request-medication">
            <Button className="bg-teal-600 hover:bg-teal-700 shadow-lg shadow-teal-600/20 transition-all duration-300">
              <PlusCircle className="mr-2 h-4 w-4" />
              Nueva Solicitud
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card
                key={i}
                className="h-full border-0 shadow-lg shadow-gray-200/50 flex flex-col overflow-hidden"
              >
                <div className="h-2 w-full bg-gray-200 animate-pulse" />
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start mb-2">
                    <Skeleton className="h-5 w-24 rounded-full" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                  <Skeleton className="h-7 w-3/4 rounded-md" />
                </CardHeader>
                <CardContent className="flex-1 space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
                <CardFooter className="bg-gray-50/50 pt-4 pb-4 border-t border-gray-100">
                  <Skeleton className="h-8 w-full rounded-md" />
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : requests.length === 0 ? (
          <motion.div
            variants={itemVariants}
            className="text-center py-16 px-4 bg-white rounded-2xl border border-dashed border-gray-300"
          >
            <div className="bg-teal-50 text-teal-400 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Pill className="h-8 w-8" />
            </div>
              <h3 className="text-lg font-medium text-gray-900">
                No tienes solicitudes activas
              </h3>
              <p className="text-gray-500 mt-2 mb-6 max-w-sm mx-auto">
                Crea una solicitud para recibir ayuda de la comunidad con los
                insumos médicos que necesitas.
              </p>
            <Link href="/dashboard/request-medication">
              <Button
                variant="outline"
                className="border-teal-600 text-teal-600 hover:bg-teal-50"
              >
                Crear mi primera solicitud
              </Button>
            </Link>
          </motion.div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {requests.map((solicitud) => {
              const estadoConfig =
                ESTADO_CONFIG[solicitud.estado] ?? ESTADO_CONFIG.PENDIENTE;
              const urgencyConfig = URGENCY_CONFIG[solicitud.tiempoEspera];
              const pharmacyStatus =
                solicitud.estado === "EN_PROCESO"
                  ? getPharmacyStatusLabel(solicitud)
                  : null;
              return (
                <motion.div
                  key={solicitud.id}
                  variants={itemVariants}
                  whileHover={{ y: -5 }}
                  className="h-full"
                >
                  <Card className="h-full border-0 shadow-lg shadow-gray-200/50 hover:shadow-xl hover:shadow-teal-900/5 transition-all duration-300 overflow-hidden flex flex-col">
                    <div className={`h-2 w-full ${estadoConfig.bar}`} />
                    <CardHeader className="pb-3 bg-gradient-to-b from-gray-50/50 to-transparent">
                      <div className="flex justify-between items-start mb-2">
                        <Badge
                          className={`${urgencyConfig?.color} transition-colors`}
                          variant="outline"
                        >
                          <Clock className="w-3 h-3 mr-1" />
                          {urgencyConfig?.label ?? solicitud.tiempoEspera}
                        </Badge>
                        <Badge className={estadoConfig.color} variant="outline">
                          {estadoConfig.label}
                        </Badge>
                      </div>
                      <CardTitle className="text-xl text-teal-950 line-clamp-1">
                        {solicitud.medicamentos[0]?.medicamento.nombre ||
                          "Insumo médico"}
                        {solicitud.medicamentos.length > 1 && (
                          <span className="text-gray-400 font-normal text-sm ml-2">
                            + {solicitud.medicamentos.length - 1} más
                          </span>
                        )}
                      </CardTitle>
                    </CardHeader>

                    <CardContent className="flex-1 space-y-4">
                      <div className="space-y-2">
                        {solicitud.medicamentos.slice(0, 2).map((med, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded-lg"
                          >
                            <span className="font-medium text-gray-700">
                              {med.medicamento.nombre}
                            </span>
                            <span className="text-gray-500">
                              {med.cantidad} {med.unidad || "unidades"}
                            </span>
                          </div>
                        ))}
                        {solicitud.medicamentos.length > 2 && (
                          <div className="text-xs text-center text-gray-500 pt-1">
                            ... y {solicitud.medicamentos.length - 2}{" "}
                            insumos médicos más
                          </div>
                        )}
                      </div>

                      {/* Pharmacy info on card */}
                      {solicitud.farmaciaEntrega &&
                        solicitud.estado === "EN_PROCESO" && (
                          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 space-y-1">
                            <div className="flex items-center text-sm font-medium text-blue-800">
                              <Building2 className="h-4 w-4 mr-1" />
                              {solicitud.farmaciaEntrega.nombre}
                            </div>
                            {pharmacyStatus && (
                              <Badge
                                className={`${pharmacyStatus.color} text-xs`}
                                variant="outline"
                              >
                                {pharmacyStatus.label}
                              </Badge>
                            )}
                          </div>
                        )}

                      <div className="pt-2 space-y-2">
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="h-4 w-4 mr-2 text-teal-600/70" />
                          {formatDate(solicitud.createdAt)}
                        </div>
                        {solicitud.direccion && (
                          <div className="flex items-center text-sm text-gray-500">
                            <MapPin className="h-4 w-4 mr-2 text-teal-600/70" />
                            {solicitud.direccion.calle}
                          </div>
                        )}
                        {solicitud.estado === "RECHAZADA" &&
                          solicitud.rejectionReason && (
                            <p className="text-sm text-red-600 mt-2 bg-red-50 border border-red-100 rounded-lg p-2">
                              <span className="font-medium">
                                Motivo de rechazo:
                              </span>{" "}
                              {solicitud.rejectionReason}
                            </p>
                          )}
                      </div>
                    </CardContent>

                    <CardFooter className="bg-gray-50/50 pt-4 pb-4 border-t border-gray-100">
                      <div className="w-full flex justify-between items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-gray-600 hover:text-teal-700 hover:bg-teal-50"
                          onClick={() => setSelectedSolicitud(solicitud)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Ver Detalles
                        </Button>
                        <div className="flex flex-wrap items-center justify-end gap-1">
                          {canEdit(solicitud) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-teal-600 hover:text-teal-800 hover:bg-teal-50"
                              onClick={() => openEdit(solicitud)}
                            >
                              <Pencil className="h-4 w-4 mr-1" />
                              {solicitud.estado === "RECHAZADA"
                                ? "Corregir"
                                : "Editar"}
                            </Button>
                          )}
                          {canDelete(solicitud) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => setDeleteTarget(solicitud)}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Eliminar
                            </Button>
                          )}
                          {canCancel(solicitud) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => setCancelTarget(solicitud)}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Cancelar
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardFooter>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Details Dialog */}
      <Dialog
        open={!!selectedSolicitud}
        onOpenChange={(open) => !open && setSelectedSolicitud(null)}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedSolicitud && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center">
                    <Pill className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <DialogTitle className="text-xl">
                      Detalles de la Solicitud
                    </DialogTitle>
                    <DialogDescription>
                      Creada el {formatDateTime(selectedSolicitud.createdAt)}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                {/* Badges */}
                <div className="flex items-center gap-3 flex-wrap">
                  <Badge
                    className={`${URGENCY_CONFIG[selectedSolicitud.tiempoEspera]?.color} text-sm px-3 py-1`}
                    variant="outline"
                  >
                    <Clock className="w-3 h-3 mr-1" />
                    {URGENCY_CONFIG[selectedSolicitud.tiempoEspera]?.label ??
                      selectedSolicitud.tiempoEspera}
                  </Badge>
                  <Badge
                    className={`${ESTADO_CONFIG[selectedSolicitud.estado].color} text-sm px-3 py-1`}
                    variant="outline"
                  >
                    {ESTADO_CONFIG[selectedSolicitud.estado].label}
                  </Badge>
                  {selectedSolicitud.requiresPrescription && (
                    <Badge
                      variant="outline"
                      className="bg-blue-50 text-blue-700 border-blue-200"
                    >
                      <FileText className="w-3 h-3 mr-1" />
                      Requiere Receta
                    </Badge>
                  )}
                </div>

                {/* Donor + Pharmacy info (when EN_PROCESO) */}
                {selectedSolicitud.estado === "EN_PROCESO" && (
                  <div className="space-y-3">
                    {selectedSolicitud.donanteAsignado && (
                      <div className="bg-teal-50 border border-teal-100 rounded-xl p-4">
                        <h4 className="font-semibold text-teal-800 mb-1 flex items-center gap-2">
                          <User className="w-4 h-4" />
                          Donante Asignado
                        </h4>
                        <p className="text-sm text-teal-700">
                          {selectedSolicitud.donanteAsignado.nombre}
                        </p>
                      </div>
                    )}

                    {selectedSolicitud.farmaciaEntrega && (
                      <div
                        className={`border rounded-xl p-4 ${
                          selectedSolicitud.farmaciaConfirmada === true
                            ? "bg-green-50 border-green-200"
                            : selectedSolicitud.farmaciaConfirmada === false
                              ? "bg-orange-50 border-orange-200"
                              : "bg-blue-50 border-blue-200"
                        }`}
                      >
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <Building2 className="w-4 h-4" />
                          Farmacia de Entrega
                          {selectedSolicitud.farmaciaConfirmada === true && (
                            <Badge
                              className="bg-green-100 text-green-800 border-green-200 ml-auto"
                              variant="outline"
                            >
                              <CheckCircle className="w-3 h-3 mr-1" />{" "}
                              Confirmada
                            </Badge>
                          )}
                          {selectedSolicitud.farmaciaConfirmada === false && (
                            <Badge
                              className="bg-orange-100 text-orange-800 border-orange-200 ml-auto"
                              variant="outline"
                            >
                              Rechazada - esperando cambio
                            </Badge>
                          )}
                        </h4>
                        <p className="text-sm font-medium">
                          {selectedSolicitud.farmaciaEntrega.nombre}
                        </p>
                        <p className="text-sm text-gray-600">
                          {selectedSolicitud.farmaciaEntrega.direccion}
                        </p>
                        {selectedSolicitud.farmaciaEntrega.telefono && (
                          <p className="text-sm text-gray-500">
                            Tel: {selectedSolicitud.farmaciaEntrega.telefono}
                          </p>
                        )}
                        {selectedSolicitud.codigoRetiroSolicitante &&
                          selectedSolicitud.farmaciaConfirmada === true && (
                            <p className="text-sm font-mono mt-2 bg-white border rounded px-2 py-1">
                              Codigo de retiro:{" "}
                              <strong>
                                {selectedSolicitud.codigoRetiroSolicitante}
                              </strong>
                            </p>
                          )}

                        {/* Pharmacy confirmation buttons */}
                        {needsPharmacyConfirmation(selectedSolicitud) && (
                          <div className="mt-4 flex gap-2">
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white"
                              onClick={() =>
                                handleConfirmPharmacy(selectedSolicitud)
                              }
                              disabled={isConfirmingPharmacy}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              {isConfirmingPharmacy
                                ? "Confirmando..."
                                : "Estoy de acuerdo"}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-300 text-red-600 hover:bg-red-50"
                              onClick={() => {
                                setRejectPharmacyTarget(selectedSolicitud);
                                setSelectedSolicitud(null);
                              }}
                              disabled={isConfirmingPharmacy}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              No estoy de acuerdo
                            </Button>
                          </div>
                        )}

                        {selectedSolicitud.farmaciaConfirmada === false &&
                          selectedSolicitud.motivoRechazoFarmacia && (
                            <p className="text-sm text-orange-700 mt-2 bg-orange-100 rounded p-2">
                              Tu motivo:{" "}
                              {selectedSolicitud.motivoRechazoFarmacia}
                            </p>
                          )}
                      </div>
                    )}
                  </div>
                )}

                {/* Pickup confirmation (LISTA_PARA_RETIRO) */}
                {selectedSolicitud.estado === "LISTA_PARA_RETIRO" &&
                  selectedSolicitud.farmaciaEntrega && (
                    <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                        <h4 className="font-semibold text-purple-800 mb-2 flex items-center gap-2">
                          <Building2 className="w-4 h-4" />
                          Tu insumo médico está listo para retiro
                        </h4>
                      <p className="text-sm text-purple-700 mb-1">
                        Farmacia:{" "}
                        <strong>
                          {selectedSolicitud.farmaciaEntrega.nombre}
                        </strong>
                      </p>
                      <p className="text-sm text-purple-600">
                        {selectedSolicitud.farmaciaEntrega.direccion}
                      </p>
                      {selectedSolicitud.codigoRetiroSolicitante && (
                        <div className="mt-3 rounded-xl border-2 border-purple-300 bg-white p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <QrCode className="h-4 w-4 text-purple-700" />
                            <p className="text-xs uppercase tracking-wide text-purple-700 font-semibold">
                              QR del Beneficiario (Retiro)
                            </p>
                          </div>
                          <p className="font-mono text-sm text-gray-900">
                            {selectedSolicitud.codigoRetiroSolicitante}
                          </p>
                          {selectedSolicitud.requesterQrPayload && (
                            <img
                              src={getQrImageUrl(
                                selectedSolicitud.codigoRetiroSolicitante,
                                180,
                              )}
                              alt="QR del beneficiario"
                              className="mx-auto mt-3 h-[180px] w-[180px] rounded-lg border bg-white p-2"
                            />
                          )}
                          <p className="mt-2 text-xs text-purple-700">
                            Al escanear el QR verás este código. La farmacia
                            puede ingresarlo en Recepción para revisar el retiro.
                          </p>
                        </div>
                      )}
                      {canConfirmPickup(selectedSolicitud) ? (
                        <Button
                          size="sm"
                          className="mt-3 bg-purple-600 hover:bg-purple-700 text-white"
                          onClick={() => handleConfirmPickup(selectedSolicitud)}
                          disabled={isConfirmingPickup}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          {isConfirmingPickup
                            ? "Confirmando..."
                            : "Confirmo que iré a retirar"}
                        </Button>
                      ) : selectedSolicitud.pickupConfirmedAt ? (
                        <Badge
                          className="mt-3 bg-green-100 text-green-800 border-green-200"
                          variant="outline"
                        >
                          <CheckCircle className="w-3 h-3 mr-1" /> Ya
                          confirmaste que irás
                        </Badge>
                      ) : null}
                    </div>
                  )}

                {/* Reception confirmation (COMPLETADA) */}
                {selectedSolicitud.estado === "COMPLETADA" && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <h4 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      {selectedSolicitud.receptionConfirmedAt
                        ? "Donación recibida exitosamente"
                        : "La farmacia ha confirmado la entrega"}
                    </h4>
                    {canConfirmReception(selectedSolicitud) ? (
                      <>
                        <p className="text-sm text-green-700 mb-3">
                          Por favor confirma que recibiste tu insumo médico.
                        </p>
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white"
                          onClick={() =>
                            handleConfirmReception(selectedSolicitud)
                          }
                          disabled={isConfirmingReception}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          {isConfirmingReception
                            ? "Confirmando..."
                            : "Confirmo que recibí mi insumo médico"}
                        </Button>
                      </>
                    ) : selectedSolicitud.receptionConfirmedAt ? (
                      <p className="text-sm text-green-700">
                        Confirmaste la recepción. ¡Gracias!
                      </p>
                    ) : null}
                  </div>
                )}

                {/* Medications */}
                <div>
                    <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <Pill className="w-4 h-4 text-teal-600" />
                      Insumos Médicos Solicitados
                    </h4>
                  <div className="space-y-2">
                    {selectedSolicitud.medicamentos.map((med, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                      >
                        <span className="font-medium text-gray-800">
                          {med.medicamento.nombre}
                        </span>
                        <span className="text-gray-600 bg-white px-3 py-1 rounded-lg border">
                          {med.cantidad} {med.unidad || "unidades"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedSolicitud.motivo && (
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2">
                      Motivo / Descripción
                    </h4>
                    <p className="text-gray-600 bg-gray-50 p-4 rounded-xl border-l-4 border-teal-500">
                      {selectedSolicitud.motivo}
                    </p>
                  </div>
                )}

                {selectedSolicitud.estado === "RECHAZADA" &&
                  selectedSolicitud.rejectionReason && (
                    <div>
                      <h4 className="font-semibold text-red-700 mb-2">
                        Motivo de Rechazo
                      </h4>
                      <p className="text-red-600 bg-red-50 p-4 rounded-xl border-l-4 border-red-400">
                        {selectedSolicitud.rejectionReason}
                      </p>
                    </div>
                  )}

                {selectedSolicitud.direccion && (
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-teal-600" />
                      Ubicación
                    </h4>
                    <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-xl">
                      <p className="font-medium text-gray-900 mb-1">
                        {selectedSolicitud.direccion.calle}
                      </p>
                      <span className="text-gray-500 text-xs">
                        Lat: {selectedSolicitud.direccion.lat.toFixed(4)}, Lng:{" "}
                        {selectedSolicitud.direccion.long.toFixed(4)}
                      </span>
                    </div>
                  </div>
                )}

                {selectedSolicitud.recipePhotoUrl && (
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-teal-600" />
                      Foto del Récipe Médico
                    </h4>
                    <div className="relative rounded-2xl overflow-hidden border-2 border-gray-200 shadow-lg">
                      <Image
                        src={selectedSolicitud.recipePhotoUrl}
                        alt="Récipe médico"
                        width={600}
                        height={400}
                        className="w-full h-auto object-contain bg-gray-100"
                      />
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-3 border-t border-gray-100 pt-4 text-sm text-gray-500 sm:flex-row sm:items-center sm:justify-between">
                  <span>
                    Solicitado por:{" "}
                    <strong className="text-gray-700">
                      {selectedSolicitud.usuarioComun.nombre}
                    </strong>
                  </span>
                  <div className="flex flex-wrap justify-end gap-2">
                    {canEdit(selectedSolicitud) && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-teal-300 text-teal-700 hover:bg-teal-50"
                        onClick={() => openEdit(selectedSolicitud)}
                      >
                        <Pencil className="w-4 h-4 mr-1" />
                        {selectedSolicitud.estado === "RECHAZADA"
                          ? "Corregir y reenviar"
                          : "Editar solicitud"}
                      </Button>
                    )}
                    {canDelete(selectedSolicitud) && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-red-300 text-red-600 hover:bg-red-50"
                        onClick={() => {
                          setSelectedSolicitud(null);
                          setDeleteTarget(selectedSolicitud);
                        }}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Eliminar
                      </Button>
                    )}
                    {canCancel(selectedSolicitud) && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-red-300 text-red-600 hover:bg-red-50"
                        onClick={() => {
                          setSelectedSolicitud(null);
                          setCancelTarget(selectedSolicitud);
                        }}
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Cancelar Solicitud
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <Dialog
        open={!!cancelTarget}
        onOpenChange={(open) => !open && setCancelTarget(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>¿Cancelar solicitud?</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. Tu solicitud quedará cancelada y
              dejará de estar visible para los donantes.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              onClick={() => setCancelTarget(null)}
              disabled={isCancelling}
            >
              Volver
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={isCancelling}
            >
              {isCancelling ? "Cancelando..." : "Sí, cancelar solicitud"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Rejected Request Dialog */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>¿Eliminar solicitud rechazada?</DialogTitle>
            <DialogDescription>
              La solicitud y sus insumos se eliminarán definitivamente. Esta
              acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              onClick={() => setDeleteTarget(null)}
              disabled={isDeleting}
            >
              Volver
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Eliminando..." : "Sí, eliminar definitivamente"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Pharmacy Dialog */}
      <Dialog
        open={!!rejectPharmacyTarget}
        onOpenChange={(open) => {
          if (!open) {
            setRejectPharmacyTarget(null);
            setRejectPharmacyMotivo("");
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>¿No estás de acuerdo con la farmacia?</DialogTitle>
            <DialogDescription>
              Indica por qué no te conviene la farmacia{" "}
              <strong>{rejectPharmacyTarget?.farmaciaEntrega?.nombre}</strong>.
              El donante recibirá tu motivo y podrá proponer otra farmacia.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Ej: Me queda muy lejos, no tengo transporte a esa zona..."
            value={rejectPharmacyMotivo}
            onChange={(e) => setRejectPharmacyMotivo(e.target.value)}
            className="min-h-[80px]"
          />
          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                setRejectPharmacyTarget(null);
                setRejectPharmacyMotivo("");
              }}
              disabled={isConfirmingPharmacy}
            >
              Volver
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectPharmacy}
              disabled={isConfirmingPharmacy}
            >
              {isConfirmingPharmacy ? "Enviando..." : "Rechazar farmacia"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Solicitud Dialog */}
      <Dialog
        open={!!editTarget}
        onOpenChange={(open) => !open && setEditTarget(null)}
      >
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="w-5 h-5 text-teal-600" />
              Editar Solicitud
            </DialogTitle>
            <DialogDescription>
              {editTarget?.estado === "RECHAZADA"
                ? "Corrige la información y vuelve a enviarla al ente de salud."
                : "Actualiza la información mientras la solicitud está pendiente."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 mt-2">
            {editTarget?.estado === "RECHAZADA" &&
              editTarget.rejectionReason && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  <span className="font-semibold">Motivo del rechazo:</span>{" "}
                  {editTarget.rejectionReason}
                </div>
              )}

            {/* Urgency */}
            <div className="space-y-1.5">
              <Label>Urgencia</Label>
              <Select value={editUrgency} onValueChange={setEditUrgency}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona urgencia" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALTO">Alta (1-2 días)</SelectItem>
                  <SelectItem value="MEDIO">Media (3-4 días)</SelectItem>
                  <SelectItem value="BAJO">Baja (1 semana)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Motivo */}
            <div className="space-y-1.5">
              <Label>Motivo / Descripción</Label>
              <Textarea
                value={editMotivo}
                onChange={(e) => setEditMotivo(e.target.value)}
                placeholder="Describe brevemente por qué necesitas estos insumos médicos..."
                className="min-h-[80px]"
              />
            </div>

            {/* Prescription */}
            <div className="space-y-3 rounded-lg border border-gray-200 p-3">
              <div className="space-y-1.5">
                <Label>¿Requiere récipe médico?</Label>
                <Select
                  value={editRequiresPrescription ? "SI" : "NO"}
                  onValueChange={(value) =>
                    setEditRequiresPrescription(value === "SI")
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SI">Sí, requiere récipe</SelectItem>
                    <SelectItem value="NO">No requiere récipe</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {editRequiresPrescription && (
                <RecipeUpload
                  key={editTarget?.id}
                  currentImageUrl={editRecipePhotoUrl || undefined}
                  onUploadComplete={(url) =>
                    setEditRecipePhotoUrl(url || null)
                  }
                  label="Récipe médico"
                />
              )}
            </div>

            {/* Medications */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Insumos médicos</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs border-teal-300 text-teal-700 hover:bg-teal-50"
                  onClick={() =>
                    setEditMeds((prev) => [
                      ...prev,
                      { nombre: "", cantidad: 1 },
                    ])
                  }
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Agregar
                </Button>
              </div>
              <div className="space-y-2">
                {editMeds.map((med, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <Input
                      value={med.nombre}
                      onChange={(e) =>
                        setEditMeds((prev) =>
                          prev.map((m, i) =>
                            i === idx ? { ...m, nombre: e.target.value } : m,
                          ),
                        )
                      }
                      placeholder="Nombre del insumo médico"
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      min={1}
                      value={med.cantidad}
                      onChange={(e) =>
                        setEditMeds((prev) =>
                          prev.map((m, i) =>
                            i === idx
                              ? {
                                  ...m,
                                  cantidad: parseInt(e.target.value) || 1,
                                }
                              : m,
                          ),
                        )
                      }
                      className="w-20"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-red-400 hover:text-red-600 hover:bg-red-50 shrink-0"
                      onClick={() =>
                        setEditMeds((prev) => prev.filter((_, i) => i !== idx))
                      }
                      disabled={editMeds.length === 1}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 mt-4">
            <Button
              variant="ghost"
              onClick={() => setEditTarget(null)}
              disabled={isSavingEdit}
            >
              Cancelar
            </Button>
            <Button
              className="bg-teal-600 hover:bg-teal-700"
              onClick={handleSaveEdit}
              disabled={
                isSavingEdit ||
                editMeds.every((m) => !m.nombre.trim()) ||
                (editRequiresPrescription && !editRecipePhotoUrl)
              }
            >
              {isSavingEdit
                ? "Guardando..."
                : editTarget?.estado === "RECHAZADA"
                  ? "Corregir y reenviar"
                  : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
