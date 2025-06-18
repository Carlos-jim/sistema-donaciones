"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Heart, ArrowLeft, Calendar } from "lucide-react"

export default function DonateMedicationPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [shareLocation, setShareLocation] = useState(true)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    // Simulate donation submission
    setTimeout(() => {
      setIsLoading(false)
      router.push("/dashboard")
    }, 1500)
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="h-6 w-6 text-teal-600" />
            <span className="text-xl font-bold">MediShare</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver al Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1 container py-6">
        <div className="mx-auto max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Donar Medicamento</CardTitle>
              <CardDescription>Completa el formulario para ofrecer un medicamento en donación.</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="medication">Nombre del Medicamento</Label>
                  <Input id="medication" placeholder="Ej. Paracetamol 500mg" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantity">Cantidad</Label>
                  <div className="flex items-center gap-2">
                    <Input id="quantity" type="number" min="1" placeholder="Ej. 10" required />
                    <Select defaultValue="tablets">
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Unidad" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tablets">Tabletas</SelectItem>
                        <SelectItem value="capsules">Cápsulas</SelectItem>
                        <SelectItem value="ml">ml</SelectItem>
                        <SelectItem value="units">Unidades</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expiration">Fecha de Vencimiento</Label>
                  <div className="flex items-center gap-2">
                    <Input id="expiration" type="date" required />
                    <Button variant="outline" size="icon">
                      <Calendar className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="condition">Estado del Medicamento</Label>
                  <Select defaultValue="sealed">
                    <SelectTrigger id="condition">
                      <SelectValue placeholder="Selecciona el estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sealed">Sellado (sin abrir)</SelectItem>
                      <SelectItem value="opened">Abierto (en buen estado)</SelectItem>
                      <SelectItem value="partial">Parcialmente usado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="prescription">¿Requiere Receta Médica?</Label>
                  <Select defaultValue="no">
                    <SelectTrigger id="prescription">
                      <SelectValue placeholder="Selecciona una opción" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Sí, requiere receta</SelectItem>
                      <SelectItem value="no">No requiere receta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe el medicamento, su uso y cualquier otra información relevante"
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="location">Compartir mi Ubicación</Label>
                    <Switch id="location" checked={shareLocation} onCheckedChange={setShareLocation} />
                  </div>
                  <p className="text-sm text-gray-500">Esto ayudará a los solicitantes a encontrarte más fácilmente.</p>
                </div>

                {shareLocation && (
                  <div className="space-y-2">
                    <Label htmlFor="address">Dirección</Label>
                    <Input id="address" placeholder="Ej. Calle Principal #123, Colonia Centro" />
                    <p className="text-sm text-gray-500">
                      Tu dirección exacta no será visible públicamente, solo la zona general.
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="contact">Método de Contacto Preferido</Label>
                  <Select defaultValue="app">
                    <SelectTrigger id="contact">
                      <SelectValue placeholder="Selecciona una opción" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="app">Mensajes en la aplicación</SelectItem>
                      <SelectItem value="email">Correo electrónico</SelectItem>
                      <SelectItem value="phone">Teléfono</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="availability">Disponibilidad para Entrega</Label>
                  <Select defaultValue="flexible">
                    <SelectTrigger id="availability">
                      <SelectValue placeholder="Selecciona tu disponibilidad" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="flexible">Horario flexible</SelectItem>
                      <SelectItem value="morning">Mañanas (8am - 12pm)</SelectItem>
                      <SelectItem value="afternoon">Tardes (12pm - 6pm)</SelectItem>
                      <SelectItem value="evening">Noches (6pm - 10pm)</SelectItem>
                      <SelectItem value="weekend">Solo fines de semana</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" type="button" onClick={() => router.push("/dashboard")}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-teal-600 hover:bg-teal-700" disabled={isLoading}>
                  {isLoading ? "Registrando donación..." : "Registrar Donación"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </main>
      <footer className="border-t py-6">
        <div className="container flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-gray-500">© 2025 MediShare. Todos los derechos reservados.</p>
          <div className="flex gap-4">
            <Link href="#" className="text-sm text-gray-500 hover:underline">
              Términos
            </Link>
            <Link href="#" className="text-sm text-gray-500 hover:underline">
              Privacidad
            </Link>
            <Link href="#" className="text-sm text-gray-500 hover:underline">
              Ayuda
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

