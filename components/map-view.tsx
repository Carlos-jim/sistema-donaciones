"use client";

import { useState, useCallback, useEffect } from "react";
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
} from "@vis.gl/react-google-maps";
import { Button } from "@/components/ui/button";
import { Search, Locate } from "lucide-react";

// Types for map data to ensure type safety (Liskov Substitution/Interface Segregation)
export interface MapLocation {
  id: string;
  lat: number;
  lng: number;
  type: "donation" | "request";
  title: string;
  distance?: number;
}

const DEFAULT_CENTER = { lat: 19.4326, lng: -99.1332 }; // Mexico City
const DEFAULT_ZOOM = 12;

// Sample data - used when no locations are provided
const SAMPLE_LOCATIONS: MapLocation[] = [
  {
    id: "1",
    lat: 19.4326,
    lng: -99.1332,
    type: "donation",
    title: "Donación Centro",
  },
  {
    id: "2",
    lat: 19.4426,
    lng: -99.1432,
    type: "request",
    title: "Solicitud Norte",
  },
  {
    id: "3",
    lat: 19.4226,
    lng: -99.1232,
    type: "donation",
    title: "Donación Sur",
  },
  {
    id: "4",
    lat: 19.4526,
    lng: -99.1532,
    type: "request",
    title: "Solicitud Poniente",
  },
];

interface MapViewProps {
  locations?: MapLocation[];
  onPositionChange?: (pos: { lat: number; lng: number }) => void;
  onUserLocationChange?: (pos: { lat: number; lng: number }) => void;
  showUserMarker?: boolean;
}

export function MapView({
  locations,
  onPositionChange,
  onUserLocationChange,
  showUserMarker = true,
}: MapViewProps) {
  const [center, setCenter] = useState(DEFAULT_CENTER);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const displayLocations = locations || SAMPLE_LOCATIONS;

  // Handlers separated from render logic (Single Responsibility)
  const handleLocateUser = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setCenter(newLocation);
          setUserLocation(newLocation);
          onUserLocationChange?.(newLocation);
        },
        () => {
          console.error("Error getting location");
        }
      );
    }
  }, [onUserLocationChange]);

  // Get user location automatically when component mounts
  useEffect(() => {
    handleLocateUser();
  }, [handleLocateUser]);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return (
      <div className="flex h-[500px] w-full items-center justify-center rounded-md bg-gray-100 text-sm text-gray-500">
        Google Maps API Key missing. Please configuration your environment.
      </div>
    );
  }

  return (
    <div className="relative h-[500px] w-full overflow-hidden rounded-md">
      <APIProvider apiKey={apiKey}>
        <Map
          defaultCenter={DEFAULT_CENTER}
          center={center}
          defaultZoom={DEFAULT_ZOOM}
          gestureHandling={"greedy"}
          disableDefaultUI={true}
          mapId={"DEMO_MAP_ID"} // Required for AdvancedMarker
          className="h-full w-full"
          onCameraChanged={(ev: {
            detail: { center: { lat: number; lng: number } };
          }) => {
            setCenter(ev.detail.center);
            onPositionChange?.(ev.detail.center);
          }}
        >
          {/* User location marker */}
          {showUserMarker && userLocation && (
            <AdvancedMarker position={userLocation} title="Tu ubicación">
              <Pin
                background={"#2563eb"} // blue-600
                borderColor={"#ffffff"}
                glyphColor={"#ffffff"}
              />
            </AdvancedMarker>
          )}

          {/* Location markers */}
          {displayLocations.map((loc) => (
            <AdvancedMarker
              key={loc.id}
              position={{ lat: loc.lat, lng: loc.lng }}
              title={loc.title}
            >
              <Pin
                background={loc.type === "donation" ? "#0d9488" : "#dc2626"} // teal-600 : red-600
                borderColor={"#ffffff"}
                glyphColor={"#ffffff"}
              />
            </AdvancedMarker>
          ))}
        </Map>
      </APIProvider>

      {/* Controls Overlay */}
      <div className="absolute left-4 right-4 top-4 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar ubicación..."
            className="w-full rounded-md border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm shadow-sm"
          />
        </div>
        <Button
          variant="outline"
          size="icon"
          className="bg-white shadow-sm"
          onClick={handleLocateUser}
        >
          <Locate className="h-4 w-4" />
        </Button>
      </div>

      {/* Legend Overlay */}
      <div className="absolute bottom-4 left-4 flex flex-col gap-2">
        {showUserMarker && userLocation && (
          <div className="flex items-center gap-2 rounded-md bg-white p-2 shadow-sm">
            <div className="h-3 w-3 rounded-full bg-blue-600"></div>
            <span className="text-xs">Tu ubicación</span>
          </div>
        )}
        <div className="flex items-center gap-2 rounded-md bg-white p-2 shadow-sm">
          <div className="h-3 w-3 rounded-full bg-teal-600"></div>
          <span className="text-xs">Donaciones</span>
        </div>
        <div className="flex items-center gap-2 rounded-md bg-white p-2 shadow-sm">
          <div className="h-3 w-3 rounded-full bg-red-600"></div>
          <span className="text-xs">Solicitudes</span>
        </div>
      </div>
    </div>
  );
}
