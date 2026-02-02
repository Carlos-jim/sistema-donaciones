"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { Search, Locate } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Types for map data
export interface MapLocation {
  id: string;
  lat: number;
  lng: number;
  type: "donation" | "request" | "pharmacy";
  title: string;
  distance?: number;
}

const DEFAULT_CENTER = { lat: 10.99, lng: -63.9 }; // Nueva Esparta
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
  onUserLocationChange?: (latlng: {
    lat: number;
    lng: number;
    address?: string;
  }) => void;
  showUserMarker?: boolean;
  confirmLocationChange?: boolean;
  initialUserLocation?: { lat: number; lng: number } | null;
  isLocationLocked?: boolean;
}

// The actual map component (loaded dynamically to avoid SSR issues)
function MapViewInner({
  locations,
  onPositionChange,
  onUserLocationChange,
  showUserMarker = true,
  confirmLocationChange = false,
  initialUserLocation = null,
  isLocationLocked = false,
}: MapViewProps) {
  const [center, setCenter] = useState<[number, number]>([
    initialUserLocation ? initialUserLocation.lat : DEFAULT_CENTER.lat,
    initialUserLocation ? initialUserLocation.lng : DEFAULT_CENTER.lng,
  ]);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(
    initialUserLocation
      ? [initialUserLocation.lat, initialUserLocation.lng]
      : null,
  );
  const [isClient, setIsClient] = useState(false);
  const mapRef = useRef<any>(null);
  const [selection, setSelection] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const [dbPharmacies, setDbPharmacies] = useState<MapLocation[]>([]);

  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [pendingLocation, setPendingLocation] = useState<
    [number, number] | null
  >(null);
  const [selectedPharmacy, setSelectedPharmacy] = useState<string>("");

  useEffect(() => {
    setIsClient(true);
    fetchPharmacies();
  }, []);

  const fetchPharmacies = async () => {
    try {
      const response = await fetch("/api/pharmacies");
      if (response.ok) {
        const data = await response.json();
        const mappedPharmacies: MapLocation[] = data
          .filter((p: any) => p.latitude && p.longitude)
          .map((p: any) => ({
            id: p.id,
            lat: p.latitude,
            lng: p.longitude,
            type: "pharmacy",
            title: p.nombre,
          }));
        setDbPharmacies(mappedPharmacies);
      }
    } catch (error) {
      console.error("Error loading pharmacies for map:", error);
    }
  };

  const handleLocationUpdateAttempt = (
    lat: number,
    lng: number,
    address?: string,
  ) => {
    const newPos: [number, number] = [lat, lng];

    if (confirmLocationChange && userLocation && !isLocationLocked) {
      setPendingLocation(newPos);
      setIsConfirmDialogOpen(true);
    } else {
      applyLocationUpdate(newPos, address);
    }
  };

  const applyLocationUpdate = (pos: [number, number], address?: string) => {
    // Only move the user marker if location is NOT locked
    if (!isLocationLocked) {
      setUserLocation(pos);
    } else {
      // If locked, we just update the selection visualization
      setSelection({ lat: pos[0], lng: pos[1] });
    }

    // Always notify parent of the selected location (for the form)
    onUserLocationChange?.({
      lat: pos[0],
      lng: pos[1],
      address: address, // Pass the address/title
    });
    setPendingLocation(null);
    setIsConfirmDialogOpen(false);
  };

  const handleConfirmUpdate = () => {
    if (pendingLocation) {
      applyLocationUpdate(pendingLocation);
    }
  };

  const handleCancelUpdate = () => {
    setPendingLocation(null);
    setIsConfirmDialogOpen(false);
    if (userLocation) {
      setUserLocation([...userLocation]);
    }
  };

  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ) => {
    const R = 6371;
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

  const sortedPharmacies = [...dbPharmacies].sort((a, b) => {
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

  const handlePharmacyChange = (pharmacyId: string) => {
    setSelectedPharmacy(pharmacyId);
    if (!pharmacyId) return;

    const pharmacy = dbPharmacies.find((p) => p.id === pharmacyId);
    if (pharmacy && mapRef.current) {
      try {
        mapRef.current.flyTo([pharmacy.lat, pharmacy.lng], 18, {
          duration: 1.5,
        });
        setSelection({ lat: pharmacy.lat, lng: pharmacy.lng });

        // Update the effective location to be the pharmacy
        // We allow this even if locked, as it's a specific selection action
        handleLocationUpdateAttempt(pharmacy.lat, pharmacy.lng, pharmacy.title);
      } catch (error) {
        console.warn("Map not ready:", error);
      }
    }
  };

  const handleLocateUser = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation: [number, number] = [
            position.coords.latitude,
            position.coords.longitude,
          ];
          setCenter(newLocation);
          if (!isLocationLocked) {
            handleLocationUpdateAttempt(
              newLocation[0],
              newLocation[1],
              "Tu ubicación actual",
            );
          }

          if (mapRef.current) {
            try {
              mapRef.current.setView(newLocation, DEFAULT_ZOOM);
            } catch (error) {
              console.warn("Map not ready for setView:", error);
            }
          }
        },
        () => { },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        },
      );
    }
  }, [
    onUserLocationChange,
    confirmLocationChange,
    userLocation,
    isLocationLocked,
  ]);

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

  const L = require("leaflet");
  const {
    MapContainer,
    TileLayer,
    Marker,
    Popup,
    useMapEvents,
    ZoomControl,
  } = require("react-leaflet");

  require("leaflet/dist/leaflet.css");

  delete (L.Icon.Default.prototype as Record<string, unknown>)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
    iconUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  });

  const userIcon = L.divIcon({
    className: "custom-marker",
    html: `<div style="background-color: #7c3aed; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>`,
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

  const nearestPharmacyIcon = L.divIcon({
    className: "custom-marker",
    html: `<div style="background-color: #16a34a; width: 28px; height: 28px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; color: white; z-index: 1000;"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/></svg></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });

  const selectionIcon = L.divIcon({
    className: "custom-marker",
    html: `<div style="background-color: #f59e0b; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); position: relative;"><div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 8px; height: 8px; background-color: white; border-radius: 50%;"></div></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });

  function MapEventHandler() {
    const map = useMapEvents({
      click: (e: any) => {
        if (isLocationLocked) return;
        if (onUserLocationChange) {
          const { lat, lng } = e.latlng;
          handleLocationUpdateAttempt(
            lat,
            lng,
            "Ubicación seleccionada en mapa",
          );
        }
      },
    });

    useEffect(() => {
      const zoomControl = L.control.zoom({ position: "bottomright" });
      zoomControl.addTo(map);
      mapRef.current = map;
      return () => {
        zoomControl.remove();
      };
    }, [map]);

    return null;
  }

  const displayLocations = [
    ...(locations || SAMPLE_LOCATIONS),
    ...dbPharmacies,
  ];

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

        {showUserMarker && userLocation && (
          <Marker
            position={userLocation}
            icon={userIcon}
            draggable={!isLocationLocked}
            eventHandlers={{
              dragend: (e: any) => {
                if (isLocationLocked) return;
                const marker = e.target;
                const position = marker.getLatLng();
                handleLocationUpdateAttempt(
                  position.lat,
                  position.lng,
                  "Ubicación personalizada",
                );
              },
            }}
          >
            <Popup>
              <div className="font-medium">
                {isLocationLocked
                  ? "Tu ubicación (Fija)"
                  : "Tu ubicación (Arrástrame para corregir)"}
              </div>
            </Popup>
          </Marker>
        )}

        {displayLocations.map((loc) => {
          let isNearestPharmacy = false;
          if (loc.type === "pharmacy" && sortedPharmacies.length > 0) {
            isNearestPharmacy = sortedPharmacies[0].id === loc.id;
          }

          return (
            <Marker
              key={loc.id}
              position={[loc.lat, loc.lng]}
              icon={
                loc.type === "donation"
                  ? donationIcon
                  : loc.type === "request"
                    ? requestIcon
                    : isNearestPharmacy
                      ? nearestPharmacyIcon
                      : pharmacyIcon
              }
              eventHandlers={{
                click: () => {
                  if (loc.type === "pharmacy") {
                    setSelection({ lat: loc.lat, lng: loc.lng });
                    // Explicitly update location when clicking a pharmacy
                    // This works even if isLocationLocked is true, as per handleLocationUpdateAttempt logic
                    handleLocationUpdateAttempt(loc.lat, loc.lng, loc.title);
                  }
                },
              }}
              zIndexOffset={isNearestPharmacy ? 1000 : 0}
            >
              <Popup>
                <div className="font-medium">
                  {loc.title}
                  {isNearestPharmacy && (
                    <span className="block text-xs font-bold text-green-600 mt-1">
                      ¡Más cercana!
                    </span>
                  )}
                </div>
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
          );
        })}

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

      <div className="absolute left-4 right-4 top-4 flex gap-2 z-[1000]">
        <div className="relative flex-1">
          <Combobox
            options={sortedPharmacies.map((pharmacy) => {
              let distanceLabel = "";
              if (userLocation) {
                const dist = calculateDistance(
                  userLocation[0],
                  userLocation[1],
                  pharmacy.lat,
                  pharmacy.lng,
                );
                distanceLabel = `${dist.toFixed(1)} km de distancia`;
              }
              return {
                value: pharmacy.id,
                label: pharmacy.title,
                description: distanceLabel || "Farmacia",
              };
            })}
            value={selectedPharmacy}
            onValueChange={handlePharmacyChange}
            placeholder="📍 Seleccionar Farmacia cercana..."
            emptyMessage="No se encontraron farmacias."
            className="bg-white shadow-sm"
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

      <div className="absolute bottom-4 left-4 flex flex-col gap-2 z-[1000]">
        {showUserMarker && userLocation && (
          <div className="flex items-center gap-2 rounded-md bg-white p-2 shadow-sm">
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: "#7c3aed" }}
            ></div>
            <span className="text-xs">Tu ubicación</span>
          </div>
        )}
        <div className="flex items-center gap-2 rounded-md bg-white p-2 shadow-sm">
          <div className="h-3 w-3 rounded-full bg-[#16a34a]"></div>
          <span className="text-xs">Farmacia más cercana</span>
        </div>
        <div className="flex items-center gap-2 rounded-md bg-white p-2 shadow-sm">
          <div className="h-3 w-3 rounded-sm bg-[#0054a6]"></div>
          <span className="text-xs">Otras Farmacias</span>
        </div>
      </div>

      <AlertDialog
        open={isConfirmDialogOpen}
        onOpenChange={setIsConfirmDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cambiar ubicación?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas modificar tu ubicación registrada?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelUpdate}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmUpdate}
              className="bg-teal-600 hover:bg-teal-700"
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
