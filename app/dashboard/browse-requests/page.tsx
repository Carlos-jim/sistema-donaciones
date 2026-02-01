"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { MapPin, Clock, Search, Filter, Heart } from "lucide-react"
import Image from "next/image"
import { acceptRequest } from "./actions"

type ApprovedRequest = {
  id: string
  createdAt: Date
  motivo: string | null
  direccion: any
  tiempoEspera: "BAJO" | "MEDIO" | "ALTO"
  usuarioComun: {
    id: string
    nombre: string
    email: string
  }
  medicamentos: {
    id: string
    cantidad: number
    prioridad: number
    medicamento: {
      id: string
      nombre: string
      presentacion: string | null
    }
  }[]
}

export default function BrowseRequestsPage() {
  const [requests, setRequests] = useState<ApprovedRequest[]>([])
  const [filteredRequests, setFilteredRequests] = useState<ApprovedRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedRequest, setSelectedRequest] = useState<ApprovedRequest | null>(null)
  const [isAccepting, setIsAccepting] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [urgencyFilter, setUrgencyFilter] = useState<string>("all")
  const { toast } = useToast()

  useEffect(() => {
    fetchApprovedRequests()
  }, [])

  useEffect(() => {
    filterRequests()
  }, [requests, searchTerm, urgencyFilter])

  const fetchApprovedRequests = async () => {
    try {
      const response = await fetch("/api/requests/approved")
      if (!response.ok) throw new Error("Failed to fetch requests")
      const data = await response.json()
      setRequests(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar las solicitudes",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const filterRequests = () => {
    let filtered = requests

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter((request) =>
        request.medicamentos.some((m) =>
          m.medicamento.nombre.toLowerCase().includes(searchTerm.toLowerCase())
        ) ||
        request.usuarioComun.nombre.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by urgency
    if (urgencyFilter !== "all") {
      filtered = filtered.filter((request) => request.tiempoEspera === urgencyFilter)
    }

    setFilteredRequests(filtered)
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "ALTO":
        return "bg-red-100 text-red-800 border-red-200"
      case "MEDIO":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "BAJO":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 3:
        return "bg-red-100 text-red-800"
      case 2:
        return "bg-yellow-100 text-yellow-800"
      case 1:
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const handleAcceptRequest = async () => {
    if (!selectedRequest) return

    setIsAccepting(true)
    try {
      // Get current user ID from auth cookie
      const response = await fetch("/api/auth/me")
      if (!response.ok) throw new Error("Not authenticated")
      const userData = await response.json()
      
      await acceptRequest(selectedRequest.id, userData.id)
      
      toast({
        title: "¡Solicitud Aceptada!",
        description: "La solicitud ha sido asignada a ti. Pronto recibirás los detalles de contacto.",
      })
      
      setSelectedRequest(null)
      fetchApprovedRequests() // Refresh the list
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo aceptar la solicitud",
        variant: "destructive",
      })
    } finally {
      setIsAccepting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando solicitudes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Solicitudes de Medicamentos</h1>
        <p className="text-gray-600">Ayuda a quienes necesitan medicamentos donando lo que tienes disponible</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar por medicamento o beneficiario..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="w-full md:w-48">
            <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Urgencia" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las urgencias</SelectItem>
                <SelectItem value="ALTO">Alta</SelectItem>
                <SelectItem value="MEDIO">Media</SelectItem>
                <SelectItem value="BAJO">Baja</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="mb-4 text-sm text-gray-600">
        {filteredRequests.length === 0 ? (
          <p>No se encontraron solicitudes que coincidan con los filtros</p>
        ) : (
          <p>Se encontraron {filteredRequests.length} solicitudes disponibles</p>
        )}
      </div>

      {/* Request Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRequests.map((request) => (
          <Card key={request.id} className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg font-semibold text-gray-900 line-clamp-2">
                  {request.medicamentos.map((m) => m.medicamento.nombre).join(", ")}
                </CardTitle>
                <Badge className={`${getUrgencyColor(request.tiempoEspera)} border`}>
                  {request.tiempoEspera}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pb-3">
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-700">Beneficiario:</p>
                  <p className="text-sm text-gray-600">{request.usuarioComun.nombre}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Medicamentos solicitados:</p>
                  <div className="space-y-1">
                    {request.medicamentos.map((med) => (
                      <div key={med.id} className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">
                          {med.cantidad} × {med.medicamento.nombre}
                          {med.medicamento.presentacion && ` (${med.medicamento.presentacion})`}
                        </span>
                        <Badge className={`${getPriorityColor(med.prioridad)} text-xs`}>
                          Prioridad {med.prioridad}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center text-sm text-gray-500">
                  <Clock className="h-4 w-4 mr-1" />
                  {new Date(request.createdAt).toLocaleDateString()}
                </div>

                {request.direccion && (
                  <div className="flex items-start text-sm text-gray-500">
                    <MapPin className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" />
                    <span className="line-clamp-2">
                      {typeof request.direccion === 'string' 
                        ? request.direccion 
                        : JSON.stringify(request.direccion)
                      }
                    </span>
                  </div>
                )}

                {request.motivo && (
                  <div className="text-sm">
                    <p className="font-medium text-gray-700">Motivo:</p>
                    <p className="text-gray-600 line-clamp-2">{request.motivo}</p>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={() => setSelectedRequest(request)}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white"
                size="sm"
              >
                <Heart className="w-4 h-4 mr-2" />
                Quiero Donar
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={(open) => !open && setSelectedRequest(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalles de la Solicitud</DialogTitle>
            <DialogDescription>
              Revisa los detalles antes de comprometerte a donar
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-6 mt-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-3">Información del Beneficiario</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Nombre:</span>
                    <p className="text-gray-700">{selectedRequest.usuarioComun.nombre}</p>
                  </div>
                  <div>
                    <span className="font-medium">Email:</span>
                    <p className="text-gray-700">{selectedRequest.usuarioComun.email}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Medicamentos Solicitados</h3>
                <div className="space-y-2">
                  {selectedRequest.medicamentos.map((med) => (
                    <div key={med.id} className="flex items-center justify-between p-3 bg-white border rounded-lg">
                      <div>
                        <p className="font-medium">{med.medicamento.nombre}</p>
                        <p className="text-sm text-gray-600">
                          Cantidad: {med.cantidad}
                          {med.medicamento.presentacion && ` • ${med.medicamento.presentacion}`}
                        </p>
                      </div>
                      <Badge className={getPriorityColor(med.prioridad)}>
                        Prioridad {med.prioridad}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              {selectedRequest.motivo && (
                <div>
                  <h3 className="font-semibold mb-2">Motivo de la Solicitud</h3>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{selectedRequest.motivo}</p>
                </div>
              )}

              {selectedRequest.direccion && (
                <div>
                  <h3 className="font-semibold mb-2">Dirección de Entrega</h3>
                  <div className="flex items-start text-gray-700 bg-gray-50 p-3 rounded-lg">
                    <MapPin className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                    <span>
                      {typeof selectedRequest.direccion === 'string' 
                        ? selectedRequest.direccion 
                        : JSON.stringify(selectedRequest.direccion)
                      }
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setSelectedRequest(null)}>
              Cancelar
            </Button>
            <Button
              onClick={handleAcceptRequest}
              disabled={isAccepting}
              className="bg-teal-600 hover:bg-teal-700"
            >
              {isAccepting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Procesando...
                </>
              ) : (
                <>
                  <Heart className="w-4 h-4 mr-2" />
                  Aceptar Solicitud
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}