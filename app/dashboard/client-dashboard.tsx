"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MapPin, PlusCircle, Search, ArrowUpDown } from "lucide-react";
import { MedicationRequestCard } from "@/components/medication-request-card";
import { MedicationDonationCard } from "@/components/medication-donation-card";
import { MapView, type MapLocation } from "@/components/map-view";
import { calculateDistance, formatDistance } from "@/lib/distance";

// Easing curve for smooth animations
const smoothEase = [0.25, 0.46, 0.45, 0.94] as [number, number, number, number];

// Clean, futuristic animation variants
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: smoothEase,
    },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 40, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: smoothEase,
    },
  },
};

const slideInVariants: Variants = {
  hidden: { opacity: 0, x: -30 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.05,
      duration: 0.4,
      ease: smoothEase,
    },
  }),
};

const tabContentVariants: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.4, ease: smoothEase },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: { duration: 0.2 },
  },
};

interface Solicitud {
  id: string;
  motivo: string | null;
  latitude: number | null;
  longitude: number | null;
  tiempoEspera: string;
  createdAt: string;
  usuarioComun: {
    nombre: string;
  };
  medicamentos: Array<{
    medicamento: {
      nombre: string;
    };
    cantidad: number;
  }>;
}

interface Donacion {
  id: string;
  estado: string;
  latitude: number | null;
  longitude: number | null;
  createdAt: string;
  usuarioComun: {
    nombre: string;
  };
  medicamentos: Array<{
    fechaExpiracion: string;
    cantidad: number;
    medicamento: {
      nombre: string;
      presentacion: string | null;
    };
  }>;
}

interface DashboardClientProps {
  initialUserLocation: { lat: number; lng: number } | null;
}

export default function DashboardClient({
  initialUserLocation,
}: DashboardClientProps) {
  const [activeTab, setActiveTab] = useState("map");
  const [sortBy, setSortBy] = useState<"nearest" | "recent">("nearest");
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(initialUserLocation);
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [donaciones, setDonaciones] = useState<Donacion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch requests from API
  useEffect(() => {
    async function fetchData() {
      try {
        const [requestsRes, donationsRes] = await Promise.all([
          fetch("/api/requests"),
          fetch("/api/donations"),
        ]);

        if (requestsRes.ok) {
          const data = await requestsRes.json();
          setSolicitudes(data);
        }
        if (donationsRes.ok) {
          const data = await donationsRes.json();
          setDonaciones(data);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  // Calculate distances and sort requests
  const sortedRequests = useMemo(() => {
    const requestsWithDistance = solicitudes.map((sol) => {
      let distance: number | null = null;
      if (userLocation && sol.latitude && sol.longitude) {
        distance = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          sol.latitude,
          sol.longitude,
        );
      }

      const urgencyMap: Record<string, string> = {
        ALTO: "Alta",
        MEDIO: "Media",
        BAJO: "Baja",
      };

      return {
        id: sol.id,
        name: sol.medicamentos[0]?.medicamento?.nombre || "Medicamento",
        requester: sol.usuarioComun?.nombre || "Usuario",
        location: "Ubicación",
        distance: distance !== null ? formatDistance(distance) : "N/A",
        distanceValue: distance,
        urgency: urgencyMap[sol.tiempoEspera] || "Media",
        date: new Date(sol.createdAt).toLocaleDateString("es-ES", {
          day: "numeric",
          month: "short",
        }),
        lat: sol.latitude,
        lng: sol.longitude,
      };
    });

    // Sort by distance or date
    if (sortBy === "nearest") {
      return requestsWithDistance.sort((a, b) => {
        if (a.distanceValue === null) return 1;
        if (b.distanceValue === null) return -1;
        return a.distanceValue - b.distanceValue;
      });
    } else {
      return requestsWithDistance.sort((a, b) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
    }
  }, [solicitudes, userLocation, sortBy]);

  // Calculate distances and sort donations
  const sortedDonations = useMemo(() => {
    const donationsWithDistance = donaciones.map((don) => {
      let distance: number | null = null;
      if (userLocation && don.latitude && don.longitude) {
        distance = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          don.latitude,
          don.longitude,
        );
      }

      return {
        id: don.id,
        name: don.medicamentos[0]?.medicamento?.nombre || "Medicamento",
        donor: don.usuarioComun?.nombre || "Donante",
        location: "Ubicación",
        distance: distance !== null ? formatDistance(distance) : "N/A",
        distanceValue: distance,
        expiration: new Date(
          don.medicamentos[0]?.fechaExpiracion,
        ).toLocaleDateString("es-ES", {
          month: "2-digit",
          year: "numeric",
        }),
        date: new Date(don.createdAt).toLocaleDateString("es-ES", {
          day: "numeric",
          month: "short",
        }),
        lat: don.latitude,
        lng: don.longitude,
      };
    });

    if (sortBy === "nearest") {
      return donationsWithDistance.sort((a, b) => {
        if (a.distanceValue === null) return 1;
        if (b.distanceValue === null) return -1;
        return a.distanceValue - b.distanceValue;
      });
    } else {
      return donationsWithDistance.sort((a, b) => {
        // Assume date property exists or can be derived for sorting if needed
        // For now sorting by creation implicit in array or reusing date field logic
        return 0; // consistent sort
      });
    }
  }, [donaciones, userLocation, sortBy]);

  // Convert requests to map locations
  const mapLocations: MapLocation[] = useMemo(() => {
    const requests = sortedRequests
      .filter((req) => req.lat && req.lng)
      .map((req) => ({
        id: req.id,
        lat: req.lat!,
        lng: req.lng!,
        type: "request" as const,
        title: `${req.name} - ${req.requester}`,
        distance: req.distanceValue ?? undefined,
      }));

    const donations = sortedDonations
      .filter((don) => don.lat && don.lng)
      .map((don) => ({
        id: don.id,
        lat: don.lat!,
        lng: don.lng!,
        type: "donation" as const,
        title: `${don.name} - ${don.donor}`,
        distance: don.distanceValue ?? undefined,
      }));

    return [...requests, ...donations];
  }, [sortedRequests, sortedDonations]);

  // Handle user location update from map
  const handleUserLocationChange = (pos: { lat: number; lng: number }) => {
    // Only allow updates if not locked
    if (!initialUserLocation) {
      setUserLocation(pos);
    }
  };

  return (
    <motion.div
      className="flex flex-col gap-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      suppressHydrationWarning
    >
      <motion.div
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        variants={itemVariants}
      >
        <h1 className="text-4xl font-bold tracking-tight">Dashboard</h1>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/dashboard/request-medication">
            <Button className="bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 w-full sm:w-auto shadow-lg shadow-teal-600/20 transition-all duration-300">
              <Search className="mr-2 h-4 w-4" />
              Solicitar Medicamento
            </Button>
          </Link>
          <Link href="/dashboard/donate-medication">
            <Button
              variant="outline"
              className="w-full sm:w-auto border-2 hover:border-teal-600 hover:text-teal-600 transition-all duration-300"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Donar Medicamento
            </Button>
          </Link>
        </div>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Tabs
          defaultValue="map"
          className="w-full"
          onValueChange={setActiveTab}
        >
          <TabsList className="grid w-full grid-cols-3 bg-gray-100/80 p-1 rounded-xl">
            <TabsTrigger
              value="map"
              className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-300"
            >
              <MapPin className="mr-2 h-4 w-4" />
              Mapa
            </TabsTrigger>
            <TabsTrigger
              value="requests"
              className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-300"
            >
              <Search className="mr-2 h-4 w-4" />
              Solicitudes
            </TabsTrigger>
            <TabsTrigger
              value="donations"
              className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-300"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Donaciones
            </TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">
            <TabsContent value="map" className="mt-6" key="map">
              <motion.div
                variants={tabContentVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <Card className="border-0 shadow-xl shadow-gray-200/50 overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-gray-50 to-white">
                    <CardTitle>Mapa de Solicitudes y Donaciones</CardTitle>
                    <CardDescription>
                      Visualiza las solicitudes y donaciones de medicamentos
                      cercanas a tu ubicación.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <MapView
                      locations={mapLocations}
                      initialUserLocation={initialUserLocation}
                      isLocationLocked={!!initialUserLocation}
                      onUserLocationChange={handleUserLocationChange}
                    />
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            <TabsContent value="requests" className="mt-6" key="requests">
              <motion.div
                variants={tabContentVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <Card className="border-0 shadow-xl shadow-gray-200/50">
                  <CardHeader className="bg-gradient-to-r from-gray-50 to-white">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <CardTitle>Solicitudes Activas</CardTitle>
                        <CardDescription>
                          Solicitudes de medicamentos que necesitan ser
                          atendidas.
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <ArrowUpDown className="h-4 w-4 text-gray-500" />
                        <Select
                          value={sortBy}
                          onValueChange={(value: "nearest" | "recent") =>
                            setSortBy(value)
                          }
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Ordenar por" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="nearest">
                              Más cercanos
                            </SelectItem>
                            <SelectItem value="recent">
                              Más recientes
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="text-center py-8 text-gray-500">
                        Cargando solicitudes...
                      </div>
                    ) : sortedRequests.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        No hay solicitudes activas
                      </div>
                    ) : (
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {sortedRequests.map((request, index) => (
                          <motion.div
                            key={request.id}
                            custom={index}
                            variants={slideInVariants}
                            initial="hidden"
                            animate="visible"
                            className="transition-transform duration-300 hover:-translate-y-1"
                          >
                            <MedicationRequestCard {...request} />
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            <TabsContent value="donations" className="mt-6" key="donations">
              <motion.div
                variants={tabContentVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <Card className="border-0 shadow-xl shadow-gray-200/50">
                  <CardHeader className="bg-gradient-to-r from-gray-50 to-white">
                    <CardTitle>Donaciones Disponibles</CardTitle>
                    <CardDescription>
                      Medicamentos disponibles para donación.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="text-center py-8 text-gray-500">
                        Cargando donaciones...
                      </div>
                    ) : sortedDonations.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        No hay donaciones disponibles
                      </div>
                    ) : (
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {sortedDonations.map((donation, index) => (
                          <motion.div
                            key={donation.id}
                            custom={index}
                            variants={slideInVariants}
                            initial="hidden"
                            animate="visible"
                            className="transition-transform duration-300 hover:-translate-y-1"
                          >
                            <MedicationDonationCard {...donation} />
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>
          </AnimatePresence>
        </Tabs>
      </motion.div>

      <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {[
          {
            title: "Estadísticas",
            description: "Resumen de actividad en la plataforma",
            content: [
              { label: "Total de Solicitudes", value: "124" },
              { label: "Total de Donaciones", value: "87" },
              { label: "Solicitudes Atendidas", value: "65" },
              { label: "Tasa de Éxito", value: "52%" },
            ],
          },
          {
            title: "Medicamentos Más Solicitados",
            description: "Últimos 30 días",
            content: [
              { label: "Paracetamol", value: "32 solicitudes" },
              { label: "Insulina", value: "28 solicitudes" },
              { label: "Amoxicilina", value: "21 solicitudes" },
              { label: "Ibuprofeno", value: "19 solicitudes" },
              { label: "Loratadina", value: "15 solicitudes" },
            ],
          },
        ].map((card, cardIndex) => (
          <motion.div
            key={cardIndex}
            variants={cardVariants}
            className="transition-transform duration-300 hover:-translate-y-1"
          >
            <Card className="border-0 shadow-xl shadow-gray-200/50 h-full">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-white">
                <CardTitle>{card.title}</CardTitle>
                <CardDescription>{card.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {card.content.map((item, index) => (
                    <motion.div
                      key={index}
                      className="flex items-center justify-between py-1 border-b border-gray-100 last:border-0"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + index * 0.05, duration: 0.3 }}
                    >
                      <span className="text-sm text-gray-600">
                        {item.label}
                      </span>
                      <span className="text-sm font-semibold text-gray-900">
                        {item.value}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}

        <motion.div
          variants={cardVariants}
          className="transition-transform duration-300 hover:-translate-y-1"
        >
          <Card className="border-0 shadow-xl shadow-gray-200/50 h-full">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-white">
              <CardTitle>Actividad Reciente</CardTitle>
              <CardDescription>Últimas actualizaciones</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    text: "Carlos donó Paracetamol a María",
                    time: "Hace 2 horas",
                  },
                  {
                    text: "Nueva solicitud: Insulina Lantus",
                    time: "Hace 5 horas",
                  },
                  {
                    text: "Laura ofreció donar Omeprazol",
                    time: "Hace 1 día",
                  },
                  {
                    text: "Roberto atendió solicitud de Ana",
                    time: "Hace 2 días",
                  },
                ].map((activity, index) => (
                  <motion.div
                    key={index}
                    className="relative pl-4 before:absolute before:left-0 before:top-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-teal-500 before:to-teal-300 before:rounded-full"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + index * 0.08, duration: 0.3 }}
                  >
                    <p className="text-sm text-gray-700">{activity.text}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {activity.time}
                    </p>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
