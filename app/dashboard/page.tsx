"use client";

import { useState } from "react";
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
import { MapPin, PlusCircle, Search } from "lucide-react";
import { MedicationRequestCard } from "@/components/medication-request-card";
import { MedicationDonationCard } from "@/components/medication-donation-card";
import { MapView } from "@/components/map-view";

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

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("map");

  return (
    <motion.div
      className="flex flex-col gap-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
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
                    <MapView />
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
                    <CardTitle>Solicitudes Activas</CardTitle>
                    <CardDescription>
                      Solicitudes de medicamentos que necesitan ser atendidas.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {[
                        {
                          name: "Paracetamol 500mg",
                          requester: "María González",
                          location: "Ciudad de México",
                          distance: "2.5 km",
                          urgency: "Alta",
                          date: "Hace 2 horas",
                        },
                        {
                          name: "Insulina Lantus",
                          requester: "Carlos Rodríguez",
                          location: "Guadalajara",
                          distance: "4.1 km",
                          urgency: "Media",
                          date: "Hace 5 horas",
                        },
                        {
                          name: "Amoxicilina 250mg",
                          requester: "Ana Martínez",
                          location: "Monterrey",
                          distance: "1.8 km",
                          urgency: "Baja",
                          date: "Hace 1 día",
                        },
                      ].map((request, index) => (
                        <motion.div
                          key={index}
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
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {[
                        {
                          name: "Loratadina 10mg",
                          donor: "Juan Pérez",
                          location: "Ciudad de México",
                          distance: "3.2 km",
                          expiration: "12/2025",
                          date: "Hace 1 día",
                        },
                        {
                          name: "Omeprazol 20mg",
                          donor: "Laura Sánchez",
                          location: "Guadalajara",
                          distance: "5.7 km",
                          expiration: "08/2025",
                          date: "Hace 3 días",
                        },
                        {
                          name: "Ibuprofeno 400mg",
                          donor: "Roberto Díaz",
                          location: "Monterrey",
                          distance: "2.3 km",
                          expiration: "10/2025",
                          date: "Hace 4 días",
                        },
                      ].map((donation, index) => (
                        <motion.div
                          key={index}
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
