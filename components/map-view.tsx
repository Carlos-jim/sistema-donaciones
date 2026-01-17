"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Search, Locate } from "lucide-react";

// Types for map data
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

// The actual map component (loaded dynamically to avoid SSR issues)
function MapViewInner({
  locations,
  onPositionChange,
  onUserLocationChange,
  showUserMarker = true,
}: MapViewProps) {
  const [center, setCenter] = useState<[number, number]>([
    DEFAULT_CENTER.lat,
    DEFAULT_CENTER.lng,
  ]);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(
    null,
  );
  const [isClient, setIsClient] = useState(false);
  const mapRef = useRef<any>(null);

  const displayLocations = locations || SAMPLE_LOCATIONS;

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleLocateUser = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation: [number, number] = [
            position.coords.latitude,
            position.coords.longitude,
          ];
          setCenter(newLocation);
          setUserLocation(newLocation);
          onUserLocationChange?.({
            lat: newLocation[0],
            lng: newLocation[1],
          });
          // Pan map to user location
          if (mapRef.current) {
            mapRef.current.setView(newLocation, DEFAULT_ZOOM);
          }
        },
        () => {
          // Silently fail - user can manually click locate button or drag map
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        },
      );
    }
  }, [onUserLocationChange]);

  // Get user location automatically when component mounts
  useEffect(() => {
    handleLocateUser();
  }, [handleLocateUser]);

  if (!isClient) {
    return (
      <div className="flex h-[500px] w-full items-center justify-center rounded-md bg-gray-100 text-sm text-gray-500">
        Cargando mapa...
      </div>
    );
  }

  // Dynamic imports for Leaflet (only on client)
  const L = require("leaflet");
  const {
    MapContainer,
    TileLayer,
    Marker,
    Popup,
    useMapEvents,
  } = require("react-leaflet");

  // Import Leaflet CSS
  require("leaflet/dist/leaflet.css");

  // Fix default marker icon issue with webpack
  delete (L.Icon.Default.prototype as Record<string, unknown>)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
    iconUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  });

  // Custom icons
  const userIcon = L.divIcon({
    className: "custom-marker",
    html: `<div style="background-color: #2563eb; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });

  const donationIcon = L.divIcon({
    className: "custom-marker",
    html: `<div style="background-color: #0d9488; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });

  const requestIcon = L.divIcon({
    className: "custom-marker",
    html: `<div style="background-color: #dc2626; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });

  // Component to handle map events
  function MapEventHandler() {
    const map = useMapEvents({
      moveend: () => {
        const center = map.getCenter();
        onPositionChange?.({ lat: center.lat, lng: center.lng });
      },
    });

    // Store map reference
    useEffect(() => {
      mapRef.current = map;
    }, [map]);

    return null;
  }

  return (
    <div className="relative h-[500px] w-full overflow-hidden rounded-md">
      <MapContainer
        center={center}
        zoom={DEFAULT_ZOOM}
        className="h-full w-full z-0"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapEventHandler />

        {/* User location marker */}
        {showUserMarker && userLocation && (
          <Marker position={userLocation} icon={userIcon}>
            <Popup>
              <div className="font-medium">Tu ubicación</div>
            </Popup>
          </Marker>
        )}

        {/* Location markers */}
        {displayLocations.map((loc) => (
          <Marker
            key={loc.id}
            position={[loc.lat, loc.lng]}
            icon={loc.type === "donation" ? donationIcon : requestIcon}
          >
            <Popup>
              <div className="font-medium">{loc.title}</div>
              <div className="text-xs text-gray-500">
                {loc.type === "donation" ? "Donación" : "Solicitud"}
              </div>
              {loc.distance && (
                <div className="text-xs text-teal-600 font-medium mt-1">
                  {loc.distance.toFixed(1)} km
                </div>
              )}
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Controls Overlay */}
      <div className="absolute left-4 right-4 top-4 flex gap-2 z-[1000]">
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
      <div className="absolute bottom-4 left-4 flex flex-col gap-2 z-[1000]">
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

// Export with dynamic import to avoid SSR issues with Leaflet
export const MapView = dynamic(() => Promise.resolve(MapViewInner), {
  ssr: false,
  loading: () => (
    <div className="flex h-[500px] w-full items-center justify-center rounded-md bg-gray-100 text-sm text-gray-500">
      <div className="flex flex-col items-center gap-2">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-600 border-t-transparent"></div>
        <span>Cargando mapa...</span>
      </div>
    </div>
  ),
});
