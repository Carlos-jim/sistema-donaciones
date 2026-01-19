"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
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
  FileText,
  Eye,
  X,
} from "lucide-react";

// Easing for animations
const smoothEase = [0.25, 0.46, 0.45, 0.94] as [number, number, number, number];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: smoothEase,
    },
  },
};

// Types
interface Solicitud {
  id: string;
  motivo: string | null;
  direccion: {
    lat: number;
    long: number;
    calle: string;
  } | null;
  tiempoEspera: string;
  requiresPrescription: boolean;
  recipePhotoUrl: string | null;
  createdAt: string;
  usuarioComun: {
    nombre: string;
  };
  medicamentos: Array<{
    medicamento: {
      nombre: string;
    };
    cantidad: number;
    unidad?: string;
  }>;
}

export default function MyRequestsPage() {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSolicitud, setSelectedSolicitud] = useState<Solicitud | null>(
    null,
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    async function fetchSolicitudes() {
      try {
        const response = await fetch("/api/requests");
        if (response.ok) {
          const data = await response.json();
          setSolicitudes(data);
        }
      } catch (error) {
        console.error("Error fetching solicitudes:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchSolicitudes();
  }, []);

  const handleViewDetails = (solicitud: Solicitud) => {
    setSelectedSolicitud(solicitud);
    setIsDialogOpen(true);
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency.toLowerCase()) {
      case "alto":
      case "alta":
        return "bg-red-100 text-red-800 hover:bg-red-200 border-red-200";
      case "medio":
      case "media":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200";
      case "bajo":
      case "baja":
        return "bg-green-100 text-green-800 hover:bg-green-200 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200 border-gray-200";
    }
  };

  const getUrgencyLabel = (urgency: string) => {
    switch (urgency) {
      case "ALTO":
        return "Alta (1-2 días)";
      case "MEDIO":
        return "Media (3-4 días)";
      case "BAJO":
        return "Baja (1 semana)";
      default:
        return urgency;
    }
  };

  const formatDate = (dateString: string) => {
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
              Gestiona y da seguimiento a tus solicitudes de medicamentos.
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
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-4 w-12" />
                    </div>
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-4 w-10" />
                    </div>
                  </div>
                  <div className="pt-2 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-40" />
                    <div className="border-l-2 border-gray-200 pl-3 mt-3">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3 mt-2" />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="bg-gray-50/50 pt-4 pb-4 border-t border-gray-100">
                  <div className="w-full flex justify-between items-center">
                    <Skeleton className="h-6 w-16 rounded-md" />
                    <Skeleton className="h-8 w-24 rounded-md" />
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : solicitudes.length === 0 ? (
          <motion.div
            variants={itemVariants}
            className="text-center py-16 px-4 bg-white rounded-2xl border border-dashed border-gray-300"
          >
            <div className="bg-gray-50 text-gray-400 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Pill className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">
              No tienes solicitudes activas
            </h3>
            <p className="text-gray-500 mt-2 mb-6 max-w-sm mx-auto">
              Crea una solicitud para recibir ayuda de la comunidad con los
              medicamentos que necesitas.
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
            {solicitudes.map((solicitud) => (
              <motion.div
                key={solicitud.id}
                variants={itemVariants}
                whileHover={{ y: -5 }}
                className="h-full"
              >
                <Card className="h-full border-0 shadow-lg shadow-gray-200/50 hover:shadow-xl hover:shadow-teal-900/5 transition-all duration-300 overflow-hidden flex flex-col">
                  <div
                    className={`h-2 w-full ${
                      solicitud.tiempoEspera === "ALTO"
                        ? "bg-red-500"
                        : solicitud.tiempoEspera === "MEDIO"
                          ? "bg-yellow-500"
                          : "bg-green-500"
                    }`}
                  />
                  <CardHeader className="pb-3 bg-gradient-to-b from-gray-50/50 to-transparent">
                    <div className="flex justify-between items-start mb-2">
                      <Badge
                        className={`${getUrgencyColor(
                          solicitud.tiempoEspera,
                        )} transition-colors`}
                        variant="outline"
                      >
                        Prioridad {solicitud.tiempoEspera}
                      </Badge>
                      <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                        {solicitud.medicamentos.length} items
                      </span>
                    </div>
                    <CardTitle className="text-xl text-teal-950 line-clamp-1">
                      {solicitud.medicamentos[0]?.medicamento.nombre ||
                        "Medicamento"}
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
                          ... y {solicitud.medicamentos.length - 2} medicamentos
                          más
                        </div>
                      )}
                    </div>

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
                      {solicitud.motivo && (
                        <p className="text-sm text-gray-600 mt-3 line-clamp-2 italic border-l-2 border-gray-200 pl-3">
                          &quot;{solicitud.motivo}&quot;
                        </p>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="bg-gray-50/50 pt-4 pb-4 border-t border-gray-100">
                    <div className="w-full flex justify-between items-center">
                      <span className="text-xs font-semibold text-teal-700 bg-teal-50 px-2 py-1 rounded-md">
                        Activa
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-600 hover:text-teal-700 hover:bg-teal-50"
                        onClick={() => handleViewDetails(solicitud)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Ver Detalles
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
                {/* Priority Badge */}
                <div className="flex items-center gap-3">
                  <Badge
                    className={`${getUrgencyColor(selectedSolicitud.tiempoEspera)} text-sm px-3 py-1`}
                    variant="outline"
                  >
                    <Clock className="w-3 h-3 mr-1" />
                    Prioridad: {getUrgencyLabel(selectedSolicitud.tiempoEspera)}
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

                {/* Medications List */}
                <div>
                  <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Pill className="w-4 h-4 text-teal-600" />
                    Medicamentos Solicitados
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

                {/* Description */}
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

                {/* Location */}
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

                {/* Recipe Photo */}
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

                {/* User Info */}
                <div className="pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>
                      Solicitado por:{" "}
                      <strong className="text-gray-700">
                        {selectedSolicitud.usuarioComun.nombre}
                      </strong>
                    </span>
                    <span className="text-xs bg-teal-50 text-teal-700 px-2 py-1 rounded-full font-medium">
                      Estado: Activa
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
