"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { MapPin, Search, Locate } from "lucide-react"

export function MapView() {
  const mapRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate map loading
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1500)

    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="relative w-full h-[500px] rounded-md overflow-hidden">
      {isLoading ? (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-600 border-r-transparent"></div>
            <p className="text-sm text-gray-500">Cargando mapa...</p>
          </div>
        </div>
      ) : (
        <>
          <div
            ref={mapRef}
            className="w-full h-full bg-gray-200"
            style={{
              backgroundImage: "url('/placeholder.svg?height=500&width=800')",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          ></div>
          <div className="absolute top-4 left-4 right-4 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Buscar ubicación..."
                className="w-full rounded-md border border-gray-200 bg-white pl-10 pr-4 py-2 text-sm"
              />
            </div>
            <Button variant="outline" size="icon" className="bg-white">
              <Locate className="h-4 w-4" />
            </Button>
          </div>
          <div className="absolute bottom-4 left-4 flex flex-col gap-2">
            <div className="flex items-center gap-2 bg-white p-2 rounded-md shadow-sm">
              <div className="h-3 w-3 rounded-full bg-teal-600"></div>
              <span className="text-xs">Donaciones</span>
            </div>
            <div className="flex items-center gap-2 bg-white p-2 rounded-md shadow-sm">
              <div className="h-3 w-3 rounded-full bg-red-600"></div>
              <span className="text-xs">Solicitudes</span>
            </div>
          </div>
          <div className="absolute bottom-4 right-4">
            <div className="flex flex-col gap-2">
              <Button size="icon" variant="outline" className="bg-white">
                <span className="text-lg">+</span>
              </Button>
              <Button size="icon" variant="outline" className="bg-white">
                <span className="text-lg">-</span>
              </Button>
            </div>
          </div>

          {/* Sample map pins */}
          <div className="absolute top-1/3 left-1/4">
            <MapPin className="h-6 w-6 text-teal-600" />
          </div>
          <div className="absolute top-1/2 left-1/2">
            <MapPin className="h-6 w-6 text-red-600" />
          </div>
          <div className="absolute bottom-1/3 right-1/4">
            <MapPin className="h-6 w-6 text-teal-600" />
          </div>
          <div className="absolute top-2/3 left-1/3">
            <MapPin className="h-6 w-6 text-red-600" />
          </div>
        </>
      )}
    </div>
  )
}

