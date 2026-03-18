"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import {
  MapPin,
  Clock,
  PlusCircle,
  Pill,
  Gift,
  Eye,
  Camera,
  CheckCircle2,
  Building2,
  AlertTriangle,
  RefreshCw,
  LogOut,
  Package,
} from "lucide-react";

interface Pharmacy {
  id: string;
  nombre: string;
  direccion: string;
}

interface Donacion {
  id: string;
  codigo: string | null;
  descripcion: string | null;
  donationPhotoUrl: string | null;
  recipePhotoUrl?: string | null;
  type?: "DONATION_OFFER" | "ACCEPTED_REQUEST";
  estado: string;
  direccion: {
    lat: number;
    long: number;
    calle: string;
  } | null;
  createdAt: string;
  farmaciaConfirmada?: boolean | null;
  motivoRechazoFarmacia?: string | null;
  deliveryConfirmedAt?: string | null;
  farmaciaEntrega?: Pharmacy | null;
  medicamentos: Array<{
    id: string;
    cantidad: number;
    fechaExpiracion: string | null;
    medicamento: {
      nombre: string;
      presentacion: string | null;
    };
  }>;
};

type AcceptedDelivery = {
  id: string;
  estado: string;
  motivo: string | null;
  beneficiaryLabel?: string;
  assignedDate: string | null;
  fechaRecepcionFarmacia: string | null;
  fechaListaRetiro: string | null;
  fechaLimiteRetiro: string | null;
  fechaRetiro: string | null;
  codigoEntregaDonante: string | null;
  codigoRetiroSolicitante: string | null;
  donorQrPayload: string | null;
  requesterQrPayload: string | null;
  farmaciaEntrega: {
    id: string;
    nombre: string;
    direccion: string;
  } | null;
  medicamentos: Array<{
    id: string;
    cantidad: number;
    medicamento: {
      nombre: string;
      presentacion: string | null;
    };
  }>;
};

type DonationsPayload = {
  ownOffers: OwnOffer[];
  acceptedDeliveries: AcceptedDelivery[];
};

function statusBadgeClass(status: string) {
  switch (status) {
    case "COMPLETADA":
    case "RECIBIDA":
      return "bg-green-100 text-green-800 border-green-200";
    case "LISTA_PARA_RETIRO":
    case "EN_PROCESO":
    case "APROBADA":
      return "bg-amber-100 text-amber-800 border-amber-200";
    case "RECHAZADA":
    case "ABANDONADA":
    case "EXPIRADA":
      return "bg-red-100 text-red-800 border-red-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
}

function formatDate(date: string | null) {
  if (!date) return "N/A";
  return new Date(date).toLocaleString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function MyDonationsPage() {
  const [donaciones, setDonaciones] = useState<Donacion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDonacion, setSelectedDonacion] = useState<Donacion | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Change pharmacy state
  const [changePharmacyTarget, setChangePharmacyTarget] = useState<Donacion | null>(null);
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [selectedPharmacyId, setSelectedPharmacyId] = useState("");
  const [isChangingPharmacy, setIsChangingPharmacy] = useState(false);

  // Confirm delivery state
  const [isConfirmingDelivery, setIsConfirmingDelivery] = useState(false);

  // Release state
  const [releaseTarget, setReleaseTarget] = useState<Donacion | null>(null);
  const [isReleasing, setIsReleasing] = useState(false);

  const { toast } = useToast();

  async function fetchDonaciones() {
    try {
      const response = await fetch("/api/donations/list");
      if (response.ok) setDonaciones(await response.json());
    } catch (error) {
      console.error("Error fetching donaciones:", error);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { fetchDonaciones(); }, []);

  const handleViewDetails = (donacion: Donacion) => {
    setSelectedDonacion(donacion);
    setIsDialogOpen(true);
  };

  // --- Change Pharmacy ---
  const openChangePharmacy = async (donacion: Donacion) => {
    setChangePharmacyTarget(donacion);
    setSelectedPharmacyId("");
    setIsDialogOpen(false);
    if (pharmacies.length === 0) {
      try {
        const res = await fetch("/api/pharmacies");
        if (res.ok) setPharmacies(await res.json());
      } catch {
        toast({ title: "Error", description: "No se pudieron cargar las farmacias.", variant: "destructive" });
      }
    }
  };

  const handleChangePharmacy = async () => {
    if (!changePharmacyTarget || !selectedPharmacyId) return;
    setIsChangingPharmacy(true);
    try {
      const res = await fetch(`/api/requests/${changePharmacyTarget.id}/change-pharmacy`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pharmacyId: selectedPharmacyId }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "Error", description: data.error, variant: "destructive" });
        return;
      }
      toast({ title: "Farmacia actualizada", description: "El beneficiario será notificado de la nueva farmacia." });
      setChangePharmacyTarget(null);
      fetchDonaciones();
    } catch {
      toast({ title: "Error", description: "Error de conexión.", variant: "destructive" });
    } finally {
      setIsChangingPharmacy(false);
    }
  };

  // --- Release ---
  const handleRelease = async () => {
    if (!releaseTarget) return;
    setIsReleasing(true);
    try {
      const res = await fetch(`/api/requests/${releaseTarget.id}/release`, { method: "PATCH" });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "Error", description: data.error, variant: "destructive" });
        return;
      }
      toast({ title: "Solicitud liberada", description: "La solicitud vuelve a estar disponible para otros donantes." });
      setReleaseTarget(null);
      setIsDialogOpen(false);
      fetchDonaciones();
    } catch {
      toast({ title: "Error", description: "Error de conexión.", variant: "destructive" });
    } finally {
      setIsReleasing(false);
    }
  };

  // --- Confirm Delivery ---
  const handleConfirmDelivery = async (donacion: Donacion) => {
    setIsConfirmingDelivery(true);
    try {
      const res = await fetch(`/api/requests/${donacion.id}/confirm-delivery`, { method: "PATCH" });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "Error", description: data.error, variant: "destructive" });
        return;
      }
      toast({ title: "Entrega confirmada", description: "La farmacia será notificada para validar el medicamento." });
      fetchDonaciones();
    } catch {
      toast({ title: "Error", description: "Error de conexión.", variant: "destructive" });
    } finally {
      setIsConfirmingDelivery(false);
    }
  };

  const canConfirmDelivery = (d: Donacion) =>
    d.type === "ACCEPTED_REQUEST" &&
    d.estado === "EN_PROCESO" &&
    d.farmaciaConfirmada === true &&
    !d.deliveryConfirmedAt;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DISPONIBLE": return "bg-green-100 text-green-800 border-green-200";
      case "RESERVADA":
      case "EN_PROCESO": return "bg-amber-100 text-amber-800 border-amber-200";
      case "ENTREGADA": return "bg-blue-100 text-blue-800 border-blue-200";
      case "EXPIRADA": return "bg-red-100 text-red-800 border-red-200";
      case "PENDIENTE": return "bg-gray-100 text-gray-800 border-gray-200";
      case "APROBADA": return "bg-teal-100 text-teal-800 border-teal-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusLabel = (status: string) => {
    if (status === "EN_PROCESO") return "En Proceso";
    if (status === "LISTA_PARA_RETIRO") return "Lista para Retiro";
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
    });
  };

  const isPharmacyRejected = (d: Donacion) =>
    d.type === "ACCEPTED_REQUEST" && d.farmaciaConfirmada === false;

  return (
    <>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Mis Donaciones</h1>
            <p className="text-gray-500 mt-1">Historial de medicamentos ofrecidos y solicitudes aceptadas.</p>
          </div>
          <Link href="/dashboard/donate-medication">
            <Button className="bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 shadow-lg shadow-teal-600/20 transition-all duration-300">
              <PlusCircle className="mr-2 h-4 w-4" />
              Nueva Donación
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="h-full border-0 shadow-lg shadow-gray-200/50 flex flex-col overflow-hidden">
                <div className="h-2 w-full bg-gray-200 animate-pulse" />
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start mb-2">
                    <Skeleton className="h-5 w-24 rounded-full" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-gray-600">
                  <p>
                    <strong>Código:</strong> {offer.codigo || "Sin código"}
                  </p>
                  <p>
                    <strong>Creada:</strong> {formatDate(offer.createdAt)}
                  </p>
                  <p>
                    <strong>Cantidad:</strong>{" "}
                    {offer.medicamentos[0]?.cantidad || 0}
                  </p>
                  {offer.descripcion && (
                    <p className="line-clamp-2">
                      <strong>Descripción:</strong> {offer.descripcion}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : donaciones.length === 0 ? (
          <div className="text-center py-16 px-4 bg-white rounded-2xl border border-dashed border-gray-300">
            <div className="bg-teal-50 text-teal-400 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Gift className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">No tienes donaciones registradas</h3>
            <p className="text-gray-500 mt-2 mb-6 max-w-sm mx-auto">
              Empieza donando medicamentos o aceptando solicitudes de otros.
            </p>
            <Link href="/dashboard/donate-medication">
              <Button variant="outline" className="border-teal-600 text-teal-600 hover:bg-teal-50">
                Hacer mi primera donación
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {donaciones.map((donacion) => (
              <div key={donacion.id} className="h-full">
                <Card className="h-full border-0 shadow-lg shadow-gray-200/50 hover:shadow-xl hover:shadow-teal-900/5 transition-all duration-300 overflow-hidden flex flex-col">
                  <div className={`h-2 w-full ${
                    isPharmacyRejected(donacion) ? "bg-orange-500"
                    : donacion.estado === "DISPONIBLE" || donacion.estado === "APROBADA" ? "bg-green-500"
                    : donacion.estado === "RESERVADA" || donacion.estado === "EN_PROCESO" ? "bg-amber-500"
                    : "bg-gray-300"
                  }`} />
                  <CardHeader className="pb-3 bg-gradient-to-b from-gray-50/50 to-transparent">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex gap-2 flex-wrap">
                        <Badge className={`${getStatusColor(donacion.estado)} transition-colors`} variant="outline">
                          {getStatusLabel(donacion.estado)}
                        </Badge>
                        {donacion.type === "ACCEPTED_REQUEST" && (
                          <Badge variant="secondary" className="bg-purple-100 text-purple-700 border-purple-200">
                            Solicitud
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-1 rounded-full flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(donacion.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <CardTitle className="text-xl text-teal-950 line-clamp-1">
                      {donacion.medicamentos[0]?.medicamento.nombre || "Medicamento"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <span className="text-gray-500">Cantidad:</span>
                        <span className="font-medium text-gray-800">
                          {donacion.medicamentos[0]?.cantidad}{" "}
                          {donacion.medicamentos[0]?.medicamento.presentacion || "unidades"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <span className="text-gray-500">Vence:</span>
                        <span className="font-medium text-gray-800">
                          {formatDate(donacion.medicamentos[0]?.fechaExpiracion)}
                        </span>
                      </div>
                    </div>

                    {/* Pharmacy rejection alert on card */}
                    {isPharmacyRejected(donacion) && (
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-sm font-medium text-orange-800">
                          <AlertTriangle className="h-4 w-4" />
                          Farmacia rechazada
                        </div>
                        {donacion.motivoRechazoFarmacia && (
                          <p className="text-xs text-orange-700 mt-1">{donacion.motivoRechazoFarmacia}</p>
                        )}
                      </div>
                    )}

                    {/* Confirm delivery button on card */}
                    {canConfirmDelivery(donacion) && (
                      <Button
                        size="sm"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={(e) => { e.stopPropagation(); handleConfirmDelivery(donacion); }}
                        disabled={isConfirmingDelivery}
                      >
                        <Package className="w-4 h-4 mr-1" />
                        {isConfirmingDelivery ? "Confirmando..." : "Confirmar entrega en farmacia"}
                      </Button>
                    )}

                    {/* Delivery confirmed indicator on card */}
                    {donacion.type === "ACCEPTED_REQUEST" && donacion.deliveryConfirmedAt && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-sm font-medium text-blue-800">
                          <CheckCircle2 className="h-4 w-4" />
                          Entrega confirmada
                        </div>
                        <p className="text-xs text-blue-600 mt-1">
                          Esperando validación de la farmacia
                        </p>
                      </div>
                    )}

                    {donacion.descripcion && (
                      <p className="text-sm text-gray-500 line-clamp-2 italic pl-2 border-l-2 border-gray-200">
                        &quot;{donacion.descripcion?.split("\n")[0]}&quot;
                      </p>
                    )}
                  </CardContent>
                  <CardFooter className="bg-gray-50/50 pt-4 pb-4 border-t border-gray-100">
                    <div className="w-full flex justify-between items-center">
                      <div className="flex -space-x-2">
                        {donacion.donationPhotoUrl && (
                          <div className="w-8 h-8 rounded-full border-2 border-white bg-teal-100 flex items-center justify-center relative overflow-hidden">
                            <Image src={donacion.donationPhotoUrl} alt="Foto" fill className="object-cover" />
                          </div>
                        )}
                        {donacion.recipePhotoUrl && (
                          <div className="w-8 h-8 rounded-full border-2 border-white bg-purple-100 flex items-center justify-center relative overflow-hidden z-10 text-purple-600">
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                        )}
                        {donacion.direccion && (
                          <div className="w-8 h-8 rounded-full border-2 border-white bg-blue-100 flex items-center justify-center z-10 text-blue-600">
                            <MapPin className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-600 hover:text-teal-700 hover:bg-teal-50"
                        onClick={() => handleViewDetails(donacion)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Ver Detalles
                      </Button>
                    </div>
                    <Badge className={statusBadgeClass(delivery.estado)} variant="outline">
                      {delivery.estado.replace(/_/g, " ")}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2 text-sm">
                    <p className="font-medium text-gray-900">Código del donante</p>
                    <p className="font-mono text-teal-700">
                      {delivery.codigoEntregaDonante || "N/A"}
                    </p>
                    {delivery.donorQrPayload && (
                      <img
                        src={getQrImageUrl(delivery.donorQrPayload, 160)}
                        alt="QR de entrega del donante"
                        className="h-40 w-40 rounded-md border bg-white p-2"
                      />
                    )}
                  </div>
                </div>
              </DialogHeader>

              {/* Status and Code Block */}
              <div className="mt-6 flex flex-col gap-4">
                {selectedDonacion.codigo && (selectedDonacion.type === "ACCEPTED_REQUEST" || selectedDonacion.estado === "ENTREGADA") && (
                  <div className="bg-teal-50 border border-teal-100 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                    <span className="text-teal-600 text-sm font-medium mb-1">CÓDIGO DE COMPROBANTE</span>
                    <span className="text-3xl font-mono font-bold text-teal-800 tracking-wider">
                      {selectedDonacion.codigo}
                    </span>
                    <span className="text-teal-600/70 text-xs mt-2">Presenta este código en la farmacia</span>
                  </div>
                )}

                <div className="flex justify-center">
                  <Badge className={`${getStatusColor(selectedDonacion.estado)} text-sm px-4 py-1.5`} variant="outline">
                    Estado: {getStatusLabel(selectedDonacion.estado)}
                  </Badge>
                </div>
              </div>

              <div className="space-y-6 mt-6">
                {/* Pharmacy rejection alert + actions (for ACCEPTED_REQUEST) */}
                {selectedDonacion.type === "ACCEPTED_REQUEST" && selectedDonacion.estado === "EN_PROCESO" && (
                  <div className={`border rounded-xl p-4 ${
                    selectedDonacion.farmaciaConfirmada === true
                      ? "bg-green-50 border-green-200"
                      : selectedDonacion.farmaciaConfirmada === false
                        ? "bg-orange-50 border-orange-200"
                        : "bg-blue-50 border-blue-200"
                  }`}>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      Farmacia de Entrega
                      {selectedDonacion.farmaciaConfirmada === true && (
                        <Badge className="bg-green-100 text-green-800 border-green-200 ml-auto" variant="outline">
                          Confirmada por beneficiario
                        </Badge>
                      )}
                      {selectedDonacion.farmaciaConfirmada === null && selectedDonacion.farmaciaEntrega && (
                        <Badge className="bg-blue-100 text-blue-800 border-blue-200 ml-auto" variant="outline">
                          Pendiente de confirmación
                        </Badge>
                      )}
                    </h4>

                    {selectedDonacion.farmaciaEntrega && (
                      <div className="text-sm mb-2">
                        <p className="font-medium">{selectedDonacion.farmaciaEntrega.nombre}</p>
                        <p className="text-gray-600">{selectedDonacion.farmaciaEntrega.direccion}</p>
                      </div>
                    )}

                    {/* Confirm delivery in dialog */}
                    {selectedDonacion.farmaciaConfirmada === true && !selectedDonacion.deliveryConfirmedAt && (
                      <Button
                        className="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={() => handleConfirmDelivery(selectedDonacion)}
                        disabled={isConfirmingDelivery}
                      >
                        <Package className="w-4 h-4 mr-2" />
                        {isConfirmingDelivery ? "Confirmando..." : "Confirmar entrega en farmacia"}
                      </Button>
                    )}

                    {selectedDonacion.deliveryConfirmedAt && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
                        <div className="flex items-center gap-2 text-sm font-medium text-blue-800">
                          <CheckCircle2 className="h-4 w-4" />
                          Entrega confirmada el {new Date(selectedDonacion.deliveryConfirmedAt).toLocaleDateString("es-ES", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}
                        </div>
                        <p className="text-xs text-blue-600 mt-1">La farmacia validará el medicamento pronto.</p>
                      </div>
                    )}

                    {selectedDonacion.farmaciaConfirmada === false && (
                      <>
                        <div className="flex items-start gap-2 bg-orange-100 rounded-lg p-3 mt-2 mb-3">
                          <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-orange-800">
                              El beneficiario no está de acuerdo con esta farmacia
                            </p>
                            {selectedDonacion.motivoRechazoFarmacia && (
                              <p className="text-sm text-orange-700 mt-1">
                                Motivo: {selectedDonacion.motivoRechazoFarmacia}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="bg-teal-600 hover:bg-teal-700 text-white"
                            onClick={() => openChangePharmacy(selectedDonacion)}
                          >
                            <RefreshCw className="w-4 h-4 mr-1" />
                            Cambiar Farmacia
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-300 text-red-600 hover:bg-red-50"
                            onClick={() => {
                              setReleaseTarget(selectedDonacion);
                              setIsDialogOpen(false);
                            }}
                          >
                            <LogOut className="w-4 h-4 mr-1" />
                            Liberar Solicitud
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Main Info */}
                <div>
                  <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Pill className="w-4 h-4 text-teal-600" />
                    Información del Medicamento
                  </h4>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <span className="text-xs text-gray-500 block mb-1">Nombre</span>
                      <span className="font-medium text-gray-900">
                        {selectedDonacion.medicamentos[0]?.medicamento.nombre}
                      </span>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <span className="text-xs text-gray-500 block mb-1">Cantidad</span>
                      <span className="font-medium text-gray-900">
                        {selectedDonacion.medicamentos[0]?.cantidad}{" "}
                        {selectedDonacion.medicamentos[0]?.medicamento.presentacion}
                      </span>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <span className="text-xs text-gray-500 block mb-1">Fecha de Vencimiento</span>
                      <span className="font-medium text-gray-900">
                        {formatDate(selectedDonacion.medicamentos[0]?.fechaExpiracion)}
                      </span>
                    </div>
                  </div>
                </div>

                  <div className="space-y-2 text-sm text-gray-700">
                    <p className="font-medium text-gray-900">Timeline</p>
                    <p>Asignada: {formatDate(delivery.assignedDate)}</p>
                    <p>Recibida en farmacia: {formatDate(delivery.fechaRecepcionFarmacia)}</p>
                    <p>Lista para retiro: {formatDate(delivery.fechaListaRetiro)}</p>
                    <p>Límite retiro: {formatDate(delivery.fechaLimiteRetiro)}</p>
                    <p>Retirada: {formatDate(delivery.fechaRetiro)}</p>
                  </div>
                )}

                {/* Location */}
                {selectedDonacion.direccion && (
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-teal-600" />
                      Ubicación de Recogida/Entrega
                    </h4>
                    <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-xl">
                      <p className="font-medium text-gray-900 mb-1">{selectedDonacion.direccion.calle}</p>
                      <span className="text-gray-500 text-xs">
                        Lat: {selectedDonacion.direccion.lat.toFixed(4)}, Lng:{" "}
                        {selectedDonacion.direccion.long.toFixed(4)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Photos */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedDonacion.donationPhotoUrl && (
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <Camera className="w-4 h-4 text-teal-600" />
                        Foto del Medicamento
                      </h4>
                      <div className="relative rounded-2xl overflow-hidden border-2 border-gray-200 shadow-lg bg-gray-100 aspect-video">
                        <Image src={selectedDonacion.donationPhotoUrl} alt="Foto del medicamento" fill className="object-contain" />
                      </div>
                    </div>
                  )}
                  {selectedDonacion.recipePhotoUrl && (
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-purple-600" />
                        Foto del Récipe
                      </h4>
                      <div className="relative rounded-2xl overflow-hidden border-2 border-purple-200 shadow-lg bg-purple-50 aspect-video">
                        <Image src={selectedDonacion.recipePhotoUrl} alt="Foto del recipe" fill className="object-contain" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Change Pharmacy Dialog */}
      <Dialog open={!!changePharmacyTarget} onOpenChange={(open) => { if (!open) setChangePharmacyTarget(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cambiar Farmacia de Entrega</DialogTitle>
            <DialogDescription>
              Selecciona una nueva farmacia para la entrega. El beneficiario será notificado para confirmar.
            </DialogDescription>
          </DialogHeader>
          {changePharmacyTarget?.motivoRechazoFarmacia && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm">
              <p className="font-medium text-orange-800">Motivo del rechazo:</p>
              <p className="text-orange-700">{changePharmacyTarget.motivoRechazoFarmacia}</p>
            </div>
          )}
          <Select value={selectedPharmacyId} onValueChange={setSelectedPharmacyId}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona una farmacia" />
            </SelectTrigger>
            <SelectContent>
              {pharmacies.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.nombre} — {p.direccion}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setChangePharmacyTarget(null)} disabled={isChangingPharmacy}>
              Cancelar
            </Button>
            <Button
              className="bg-teal-600 hover:bg-teal-700"
              onClick={handleChangePharmacy}
              disabled={isChangingPharmacy || !selectedPharmacyId}
            >
              {isChangingPharmacy ? "Actualizando..." : "Confirmar nueva farmacia"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Release Confirmation Dialog */}
      <Dialog open={!!releaseTarget} onOpenChange={(open) => { if (!open) setReleaseTarget(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>¿Liberar esta solicitud?</DialogTitle>
            <DialogDescription>
              Si no puedes completar la entrega, la solicitud volverá a estar disponible para que otros donantes puedan ayudar.
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setReleaseTarget(null)} disabled={isReleasing}>
              Volver
            </Button>
            <Button variant="destructive" onClick={handleRelease} disabled={isReleasing}>
              {isReleasing ? "Liberando..." : "Sí, liberar solicitud"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
