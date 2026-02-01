"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  MapPin,
  Clock,
  PlusCircle,
  Calendar,
  Pill,
  Gift,
  Eye,
  Camera,
  CheckCircle2,
} from "lucide-react";

// Types corresponding to prisma schema + aggregated fields
interface Donacion {
  id: string;
  codigo: string | null;
  descripcion: string | null;
  donationPhotoUrl: string | null;
  recipePhotoUrl?: string | null;
  type?: "DONATION_OFFER" | "ACCEPTED_REQUEST";
  estado: "DISPONIBLE" | "RESERVADA" | "ENTREGADA" | "EXPIRADA" | "EN_PROCESO" | "PENDIENTE" | "APROBADA";
  direccion: {
    lat: number;
    long: number;
    calle: string;
  } | null;
  createdAt: string;
  medicamentos: Array<{
    fechaExpiracion: string | null;
    cantidad: number;
    medicamento: {
      nombre: string;
      presentacion: string | null;
    };
  }>;
}

export default function MyDonationsPage() {
  const [donaciones, setDonaciones] = useState<Donacion[]>([]);
  // ... (keep state)
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDonacion, setSelectedDonacion] = useState<Donacion | null>(
    null,
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    async function fetchDonaciones() {
      try {
        const response = await fetch("/api/donations/list");
        if (response.ok) {
          const data = await response.json();
          setDonaciones(data);
        }
      } catch (error) {
        console.error("Error fetching donaciones:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchDonaciones();
  }, []);

  const handleViewDetails = (donacion: Donacion) => {
    setSelectedDonacion(donacion);
    setIsDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DISPONIBLE":
        return "bg-green-100 text-green-800 border-green-200";
      case "RESERVADA":
      case "EN_PROCESO":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "ENTREGADA":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "EXPIRADA":
        return "bg-red-100 text-red-800 border-red-200";
      case "PENDIENTE":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "APROBADA":
        return "bg-teal-100 text-teal-800 border-teal-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusLabel = (status: string) => {
    if (status === "EN_PROCESO") return "En Proceso";
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ... (keep return until list mapping)
  return (
    <>
      <div
        className="space-y-8"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Mis Donaciones
            </h1>
            <p className="text-gray-500 mt-1">
              Historial de medicamentos ofrecidos y solicitudes aceptadas.
            </p>
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
              </Card>
            ))}
          </div>
        ) : donaciones.length === 0 ? (
          <div
            className="text-center py-16 px-4 bg-white rounded-2xl border border-dashed border-gray-300"
          >
            {/* ... keep empty state ... */}
            <div className="bg-teal-50 text-teal-400 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Gift className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">
              No tienes donaciones registradas
            </h3>
            <p className="text-gray-500 mt-2 mb-6 max-w-sm mx-auto">
              Empieza donando medicamentos o aceptando solicitudes de otros.
            </p>
            <Link href="/dashboard/donate-medication">
              <Button
                variant="outline"
                className="border-teal-600 text-teal-600 hover:bg-teal-50"
              >
                Hacer mi primera donación
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {donaciones.map((donacion) => (
              <div
                key={donacion.id}
                className="h-full"
              >
                <Card className="h-full border-0 shadow-lg shadow-gray-200/50 hover:shadow-xl hover:shadow-teal-900/5 transition-all duration-300 overflow-hidden flex flex-col">
                  <div
                    className={`h-2 w-full ${donacion.estado === "DISPONIBLE" || donacion.estado === "APROBADA"
                      ? "bg-green-500"
                      : donacion.estado === "RESERVADA" || donacion.estado === "EN_PROCESO"
                        ? "bg-amber-500"
                        : "bg-gray-300"
                      }`}
                  />
                  <CardHeader className="pb-3 bg-gradient-to-b from-gray-50/50 to-transparent">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex gap-2">
                        <Badge
                          className={`${getStatusColor(
                            donacion.estado,
                          )} transition-colors`}
                          variant="outline"
                        >
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
                      {donacion.medicamentos[0]?.medicamento.nombre ||
                        "Medicamento"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <span className="text-gray-500">Cantidad:</span>
                        <span className="font-medium text-gray-800">
                          {donacion.medicamentos[0]?.cantidad}{" "}
                          {donacion.medicamentos[0]?.medicamento.presentacion ||
                            "unidades"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <span className="text-gray-500">Vence:</span>
                        <span className="font-medium text-gray-800">
                          {formatDate(
                            donacion.medicamentos[0]?.fechaExpiracion,
                          )}
                        </span>
                      </div>
                    </div>
                    {donacion.descripcion && (
                      <p className="text-sm text-gray-500 line-clamp-2 italic pl-2 border-l-2 border-gray-200">
                        "{donacion.descripcion?.split("\n")[0]}"
                      </p>
                    )}
                  </CardContent>
                  <CardFooter className="bg-gray-50/50 pt-4 pb-4 border-t border-gray-100">
                    <div className="w-full flex justify-between items-center">
                      <div className="flex -space-x-2">
                        {donacion.donationPhotoUrl && (
                          <div className="w-8 h-8 rounded-full border-2 border-white bg-teal-100 flex items-center justify-center relative overflow-hidden">
                            <Image
                              src={donacion.donationPhotoUrl}
                              alt="Foto"
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}
                        {/* Show recipe icon if request */}
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
                  </CardFooter>
                </Card>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedDonacion && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center">
                    <Gift className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <DialogTitle className="text-xl">
                      Detalles de la {selectedDonacion.type === "ACCEPTED_REQUEST" ? "Solicitud Aceptada" : "Donación"}
                    </DialogTitle>
                    <DialogDescription>
                      Registrada el {formatDateTime(selectedDonacion.createdAt)}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              {/* Status and Code Block */}
              <div className="mt-6 flex flex-col gap-4">
                {selectedDonacion.codigo && (selectedDonacion.type === "ACCEPTED_REQUEST" || selectedDonacion.estado === "ENTREGADA") && (
                  <div className="bg-teal-50 border border-teal-100 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                    <span className="text-teal-600 text-sm font-medium mb-1">
                      CÓDIGO DE COMPROBANTE
                    </span>
                    <span className="text-3xl font-mono font-bold text-teal-800 tracking-wider">
                      {selectedDonacion.codigo}
                    </span>
                    <span className="text-teal-600/70 text-xs mt-2">
                      Presenta este código en la farmacia
                    </span>
                  </div>
                )}

                <div className="flex justify-center">
                  <Badge
                    className={`${getStatusColor(
                      selectedDonacion.estado,
                    )} text-sm px-4 py-1.5`}
                    variant="outline"
                  >
                    Estado: {getStatusLabel(selectedDonacion.estado)}
                  </Badge>
                </div>
              </div>

              <div className="space-y-6 mt-6">
                {/* Main Info */}
                <div>
                  <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Pill className="w-4 h-4 text-teal-600" />
                    Información del Medicamento
                  </h4>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <span className="text-xs text-gray-500 block mb-1">
                        Nombre
                      </span>
                      <span className="font-medium text-gray-900">
                        {selectedDonacion.medicamentos[0]?.medicamento.nombre}
                      </span>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <span className="text-xs text-gray-500 block mb-1">
                        Cantidad
                      </span>
                      <span className="font-medium text-gray-900">
                        {selectedDonacion.medicamentos[0]?.cantidad}{" "}
                        {
                          selectedDonacion.medicamentos[0]?.medicamento
                            .presentacion
                        }
                      </span>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <span className="text-xs text-gray-500 block mb-1">
                        Fecha de Vencimiento
                      </span>
                      <span className="font-medium text-gray-900">
                        {formatDate(
                          selectedDonacion.medicamentos[0]?.fechaExpiracion,
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {selectedDonacion.descripcion && (
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2">
                      {selectedDonacion.type === "ACCEPTED_REQUEST" ? "Motivo de Solicitud" : "Descripción"}
                    </h4>
                    <div className="text-gray-600 bg-gray-50 p-4 rounded-xl border-l-4 border-teal-500 whitespace-pre-wrap text-sm">
                      {selectedDonacion.descripcion}
                    </div>
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
                      <p className="font-medium text-gray-900 mb-1">
                        {selectedDonacion.direccion.calle}
                      </p>
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
                        <Image
                          src={selectedDonacion.donationPhotoUrl}
                          alt="Foto del medicamento"
                          fill
                          className="object-contain"
                        />
                      </div>
                    </div>
                  )}

                  {/* RECIPE PHOTO */}
                  {selectedDonacion.recipePhotoUrl && (
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-purple-600" />
                        Foto del Récipe
                      </h4>
                      <div className="relative rounded-2xl overflow-hidden border-2 border-purple-200 shadow-lg bg-purple-50 aspect-video">
                        <Image
                          src={selectedDonacion.recipePhotoUrl}
                          alt="Foto del recipe"
                          fill
                          className="object-contain"
                        />
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
