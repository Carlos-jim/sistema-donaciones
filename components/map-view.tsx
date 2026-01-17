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
  type: "donation" | "request" | "pharmacy";
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

const PHARMACY_LOCATIONS: MapLocation[] = [
  // Pampatar / Playa El Ángel / Sambil
  {
    id: "f1",
    lat: 10.996578,
    lng: -63.8133486,
    type: "pharmacy",
    title: "Farmatodo Sambil Margarita (Maneiro)",
  },
  {
    id: "f2",
    lat: 10.9878333,
    lng: -63.8177528,
    type: "pharmacy",
    title: "Farmatodo Playa El Ángel (Av. Aldonza Manrique)",
  },
  {
    id: "f3",
    lat: 10.9777303,
    lng: -63.8195757,
    type: "pharmacy",
    title: "Farmatodo C.C. La Vela",
  },
  {
    id: "f4",
    lat: 10.9947051,
    lng: -63.8052786,
    type: "pharmacy",
    title: "Farmatodo Jorge Coll", // Ubicado en la Urb. Jorge Coll, cerca de Pampatar
  },

  // La Asunción
  {
    id: "f5",
    lat: 11.0402671,
    lng: -63.8571535,
    type: "pharmacy",
    title: "Farmatodo La Asunción (Sector Cocheima)",
  },
  // --- FARMAPLUS / FARMAHORRO ---
  {
    id: "fp1",
    lat: 10.9927,
    lng: -63.825,
    type: "pharmacy",
    title: "Farmahorro (Farmaplus) Caribe - Pampatar",
  },

  // --- FARMACIAS SIGO (Dentro de Supermercados Sigo) ---
  {
    id: "fs1",
    lat: 10.9988,
    lng: -63.8141,
    type: "pharmacy",
    title: "Farmacia Sigo - Sambil Margarita",
  },
  {
    id: "fs2",
    lat: 10.9908,
    lng: -63.8237,
    type: "pharmacy",
    title: "Farmacia Sigo - Parque Costazul",
  },
  {
    id: "fs3",
    lat: 10.9523,
    lng: -63.8684,
    type: "pharmacy",
    title: "Farmacia Sigo - La Proveeduría (Porlamar)",
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
  // selection state for immediate visual feedback
  const [selection, setSelection] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  // Calculate distance helper
  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ) => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Sort pharmacies by distance
  const sortedPharmacies = [...PHARMACY_LOCATIONS].sort((a, b) => {
    if (!userLocation) return 0;
    const distA = calculateDistance(
      userLocation[0],
      userLocation[1],
      a.lat,
      a.lng,
    );
    const distB = calculateDistance(
      userLocation[0],
      userLocation[1],
      b.lat,
      b.lng,
    );
    return distA - distB;
  });

  const handlePharmacyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const pharmacyId = e.target.value;
    if (!pharmacyId) return;

    const pharmacy = PHARMACY_LOCATIONS.find((p) => p.id === pharmacyId);
    if (pharmacy && mapRef.current) {
      try {
        mapRef.current.setView([pharmacy.lat, pharmacy.lng], 15);
        setSelection({ lat: pharmacy.lat, lng: pharmacy.lng });
      } catch (error) {
        console.warn("Map not ready:", error);
      }
    }
  };

  // Combine dynamic locations with static pharmacy locations
  const displayLocations = [
    ...(locations || SAMPLE_LOCATIONS),
    ...PHARMACY_LOCATIONS,
  ];

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
          // Pan map to user location
          if (mapRef.current) {
            try {
              mapRef.current.setView(newLocation, DEFAULT_ZOOM);
            } catch (error) {
              console.warn("Map not ready for setView:", error);
            }
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
  const hasInitalized = useRef(false);
  useEffect(() => {
    if (!hasInitalized.current) {
      handleLocateUser();
      hasInitalized.current = true;
    }
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
    ZoomControl,
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

  const pharmacyIcon = L.divIcon({
    className: "custom-marker",
    html: `<div style="background-color: #0054a6; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white;"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/></svg></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });

  const selectionIcon = L.divIcon({
    className: "custom-marker",
    html: `<div style="background-color: #f59e0b; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); position: relative;"><div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 8px; height: 8px; background-color: white; border-radius: 50%;"></div></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });

  // Component to handle map events
  function MapEventHandler() {
    const map = useMapEvents({
      click: (e: any) => {
        const { lat, lng } = e.latlng;
        setSelection({ lat, lng });
        onPositionChange?.({ lat, lng });
      },
      moveend: () => {
        // If we want the center to also be a selection method (optional)
        // For now, let's prioritize explicit clicks for "marking", or fallback to center if no markup.
        // Actually, let's keep moveend updating the parent, but maybe not drawing a marker unless clicked?
        // Better UX: Dragging the map updates the "center" usually.
        // If the user wants to mark, they click.
        const center = map.getCenter();
        onPositionChange?.({ lat: center.lat, lng: center.lng });
      },
    });

    // Store map reference and add zoom control
    useEffect(() => {
      mapRef.current = map;

      // Add zoom control manually
      const zoomControl = L.control.zoom({ position: "bottomright" });
      zoomControl.addTo(map);

      return () => {
        zoomControl.remove();
      };
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
        scrollWheelZoom={true}
        dragging={true}
        doubleClickZoom={true}
        touchZoom={true}
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
            icon={
              loc.type === "donation"
                ? donationIcon
                : loc.type === "request"
                  ? requestIcon
                  : pharmacyIcon
            }
          >
            <Popup>
              <div className="font-medium">{loc.title}</div>
              <div className="text-xs text-gray-500">
                {loc.type === "donation"
                  ? "Donación"
                  : loc.type === "request"
                    ? "Solicitud"
                    : "Farmacia"}
              </div>
              {loc.distance && (
                <div className="text-xs text-teal-600 font-medium mt-1">
                  {loc.distance.toFixed(1)} km
                </div>
              )}
            </Popup>
          </Marker>
        ))}
        {/* Selection marker */}
        {selection && (
          <Marker position={selection} icon={selectionIcon}>
            <Popup>
              <div className="font-medium text-amber-700">
                Ubicación seleccionada
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {/* Controls Overlay */}
      <div className="absolute left-4 right-4 top-4 flex gap-2 z-[1000]">
        <div className="relative flex-1">
          <select
            className="w-full rounded-md border border-gray-200 bg-white py-2 pl-3 pr-10 text-sm shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            onChange={handlePharmacyChange}
            defaultValue=""
          >
            <option value="" disabled>
              📍 Seleccionar Farmacia cercana...
            </option>
            {sortedPharmacies.map((pharmacy) => {
              let distanceLabel = "";
              if (userLocation) {
                const dist = calculateDistance(
                  userLocation[0],
                  userLocation[1],
                  pharmacy.lat,
                  pharmacy.lng,
                );
                distanceLabel = `(${dist.toFixed(1)} km)`;
              }
              return (
                <option key={pharmacy.id} value={pharmacy.id}>
                  {pharmacy.title} {distanceLabel}
                </option>
              );
            })}
          </select>
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
        <div className="flex items-center gap-2 rounded-md bg-white p-2 shadow-sm">
          <div className="h-3 w-3 rounded-sm bg-[#0054a6]"></div>
          <span className="text-xs">Farmacias</span>
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
