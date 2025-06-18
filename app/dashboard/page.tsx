// Updated DashboardPage.tsx with responsive layout, Tabs section unchanged
"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Heart, MapPin, PlusCircle, Search, User, LogOut, Bell } from "lucide-react"
import { MedicationRequestCard } from "@/components/medication-request-card"
import { MedicationDonationCard } from "@/components/medication-donation-card"
import { MapView } from "@/components/map-view"

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("map")

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="container mx-auto px-4 flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="h-6 w-6 text-teal-600" />
            <span className="text-xl font-bold">MediShare</span>
          </div>
          <nav className="hidden md:flex gap-6">
            <Link href="/dashboard" className="text-sm font-medium text-teal-600">Dashboard</Link>
            <Link href="/dashboard/requests" className="text-sm font-medium">Mis Solicitudes</Link>
            <Link href="/dashboard/donations" className="text-sm font-medium">Mis Donaciones</Link>
            <Link href="/dashboard/profile" className="text-sm font-medium">Perfil</Link>
          </nav>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon"><Bell className="h-5 w-5" /></Button>
            <Button variant="ghost" size="icon"><User className="h-5 w-5" /></Button>
            <Button variant="ghost" size="icon"><LogOut className="h-5 w-5" /></Button>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <div className="flex flex-col sm:flex-row gap-2">
              <Link href="/dashboard/request-medication">
                <Button className="bg-teal-600 hover:bg-teal-700 w-full sm:w-auto">
                  <Search className="mr-2 h-4 w-4" />
                  Solicitar Medicamento
                </Button>
              </Link>
              <Link href="/dashboard/donate-medication">
                <Button variant="outline" className="w-full sm:w-auto">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Donar Medicamento
                </Button>
              </Link>
            </div>
          </div>

          <Tabs defaultValue="map" className="w-full" onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="map">
                <MapPin className="mr-2 h-4 w-4" />
                Mapa
              </TabsTrigger>
              <TabsTrigger value="requests">
                <Search className="mr-2 h-4 w-4" />
                Solicitudes
              </TabsTrigger>
              <TabsTrigger value="donations">
                <PlusCircle className="mr-2 h-4 w-4" />
                Donaciones
              </TabsTrigger>
            </TabsList>
            <TabsContent value="map" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Mapa de Solicitudes y Donaciones</CardTitle>
                  <CardDescription>
                    Visualiza las solicitudes y donaciones de medicamentos cercanas a tu ubicación.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <MapView />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="requests" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Solicitudes Activas</CardTitle>
                  <CardDescription>Solicitudes de medicamentos que necesitan ser atendidas.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <MedicationRequestCard
                      name="Paracetamol 500mg"
                      requester="María González"
                      location="Ciudad de México"
                      distance="2.5 km"
                      urgency="Alta"
                      date="Hace 2 horas"
                    />
                    <MedicationRequestCard
                      name="Insulina Lantus"
                      requester="Carlos Rodríguez"
                      location="Guadalajara"
                      distance="4.1 km"
                      urgency="Media"
                      date="Hace 5 horas"
                    />
                    <MedicationRequestCard
                      name="Amoxicilina 250mg"
                      requester="Ana Martínez"
                      location="Monterrey"
                      distance="1.8 km"
                      urgency="Baja"
                      date="Hace 1 día"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="donations" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Donaciones Disponibles</CardTitle>
                  <CardDescription>Medicamentos disponibles para donación.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <MedicationDonationCard
                      name="Loratadina 10mg"
                      donor="Juan Pérez"
                      location="Ciudad de México"
                      distance="3.2 km"
                      expiration="12/2025"
                      date="Hace 1 día"
                    />
                    <MedicationDonationCard
                      name="Omeprazol 20mg"
                      donor="Laura Sánchez"
                      location="Guadalajara"
                      distance="5.7 km"
                      expiration="08/2025"
                      date="Hace 3 días"
                    />
                    <MedicationDonationCard
                      name="Ibuprofeno 400mg"
                      donor="Roberto Díaz"
                      location="Monterrey"
                      distance="2.3 km"
                      expiration="10/2025"
                      date="Hace 4 días"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Estadísticas</CardTitle>
                <CardDescription>Resumen de actividad en la plataforma</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between"><span className="text-sm font-medium">Total de Solicitudes</span><span className="text-lg font-bold">124</span></div>
                  <div className="flex items-center justify-between"><span className="text-sm font-medium">Total de Donaciones</span><span className="text-lg font-bold">87</span></div>
                  <div className="flex items-center justify-between"><span className="text-sm font-medium">Solicitudes Atendidas</span><span className="text-lg font-bold">65</span></div>
                  <div className="flex items-center justify-between"><span className="text-sm font-medium">Tasa de Éxito</span><span className="text-lg font-bold">52%</span></div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Medicamentos Más Solicitados</CardTitle>
                <CardDescription>Últimos 30 días</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between"><span className="text-sm font-medium">Paracetamol</span><span className="text-sm font-bold">32 solicitudes</span></div>
                  <div className="flex items-center justify-between"><span className="text-sm font-medium">Insulina</span><span className="text-sm font-bold">28 solicitudes</span></div>
                  <div className="flex items-center justify-between"><span className="text-sm font-medium">Amoxicilina</span><span className="text-sm font-bold">21 solicitudes</span></div>
                  <div className="flex items-center justify-between"><span className="text-sm font-medium">Ibuprofeno</span><span className="text-sm font-bold">19 solicitudes</span></div>
                  <div className="flex items-center justify-between"><span className="text-sm font-medium">Loratadina</span><span className="text-sm font-bold">15 solicitudes</span></div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Actividad Reciente</CardTitle>
                <CardDescription>Últimas actualizaciones</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border-l-4 border-teal-600 pl-4"><p className="text-sm">Carlos donó Paracetamol a María</p><p className="text-xs text-gray-500">Hace 2 horas</p></div>
                  <div className="border-l-4 border-teal-600 pl-4"><p className="text-sm">Nueva solicitud: Insulina Lantus</p><p className="text-xs text-gray-500">Hace 5 horas</p></div>
                  <div className="border-l-4 border-teal-600 pl-4"><p className="text-sm">Laura ofreció donar Omeprazol</p><p className="text-xs text-gray-500">Hace 1 día</p></div>
                  <div className="border-l-4 border-teal-600 pl-4"><p className="text-sm">Roberto atendió solicitud de Ana</p><p className="text-xs text-gray-500">Hace 2 días</p></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <footer className="border-t py-6">
        <div className="container mx-auto px-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-gray-500">© 2025 MediShare. Todos los derechos reservados.</p>
          <div className="flex gap-4">
            <Link href="#" className="text-sm text-gray-500 hover:underline">Términos</Link>
            <Link href="#" className="text-sm text-gray-500 hover:underline">Privacidad</Link>
            <Link href="#" className="text-sm text-gray-500 hover:underline">Ayuda</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
