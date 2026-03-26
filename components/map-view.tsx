"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { Locate } from "lucide-react";
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

export interface MapLocation {
  id: string;
  lat: number;
  lng: number;
  type: "donation" | "request" | "pharmacy";
  title: string;
  distance?: number;
}

const DEFAULT_CENTER = { lat: 10.99, lng: -63.9 };
const DEFAULT_ZOOM = 12;

const SAMPLE_LOCATIONS: MapLocation[] = [
  {
    id: "1",
    lat: 19.4326,
    lng: -99.1332,
    type: "donation",
    title: "Donacion Centro",
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
    title: "Donacion Sur",
  },
  {
    id: "4",
    lat: 19.4526,
    lng: -99.1532,
    type: "request",
    title: "Solicitud Poniente",
  },
];

interface PharmacyOption {
  id: string;
  nombre: string;
  direccion: string;
  latitude: number | null;
  longitude: number | null;
}

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
  showPharmacies?: boolean;
  showPharmacySelector?: boolean;
  showPharmacyLegend?: boolean;
  autoLocateOnMount?: boolean;
}

function MapViewInner({
  locations,
  onPositionChange,
  onUserLocationChange,
  showUserMarker = true,
  confirmLocationChange = false,
  initialUserLocation = null,
  isLocationLocked = false,
  showPharmacies = true,
  showPharmacySelector = true,
  showPharmacyLegend = true,
  autoLocateOnMount = true,
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
  const [selection, setSelection] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [dbPharmacies, setDbPharmacies] = useState<MapLocation[]>([]);
  const [allPharmacies, setAllPharmacies] = useState<PharmacyOption[]>([]);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [pendingLocation, setPendingLocation] = useState<[number, number] | null>(
    null,
  );
  const [selectedPharmacy, setSelectedPharmacy] = useState("");

  const mapRef = useRef<any>(null);
  const hasInitialized = useRef(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!showPharmacies && !showPharmacySelector) {
      setDbPharmacies([]);
      setAllPharmacies([]);
      return;
    }

    async function fetchPharmacies() {
      try {
        const response = await fetch("/api/pharmacies");
        if (!response.ok) {
          return;
        }

        const data = await response.json();
        setAllPharmacies(data);

        const mappedPharmacies: MapLocation[] = data
          .filter((pharmacy: PharmacyOption) =>
            pharmacy.latitude != null && pharmacy.longitude != null,
          )
          .map((pharmacy: PharmacyOption) => ({
            id: pharmacy.id,
            lat: pharmacy.latitude as number,
            lng: pharmacy.longitude as number,
            type: "pharmacy" as const,
            title: pharmacy.nombre,
          }));

        setDbPharmacies(mappedPharmacies);
      } catch (error) {
        console.error("Error loading pharmacies for map:", error);
      }
    }

    fetchPharmacies();
  }, [showPharmacies, showPharmacySelector]);

  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ) => {
    const earthRadiusKm = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadiusKm * c;
  };

  const applyLocationUpdate = useCallback(
    (pos: [number, number], address?: string) => {
      if (!isLocationLocked) {
        setUserLocation(pos);
      } else {
        setSelection({ lat: pos[0], lng: pos[1] });
      }

      onPositionChange?.({ lat: pos[0], lng: pos[1] });
      onUserLocationChange?.({
        lat: pos[0],
        lng: pos[1],
        address,
      });

      setPendingLocation(null);
      setIsConfirmDialogOpen(false);
    },
    [isLocationLocked, onPositionChange, onUserLocationChange],
  );

  const handleLocationUpdateAttempt = useCallback(
    (lat: number, lng: number, address?: string) => {
      const newPos: [number, number] = [lat, lng];

      if (confirmLocationChange && userLocation && !isLocationLocked) {
        setPendingLocation(newPos);
        setIsConfirmDialogOpen(true);
        return;
      }

      applyLocationUpdate(newPos, address);
    },
    [applyLocationUpdate, confirmLocationChange, isLocationLocked, userLocation],
  );

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

  const handleLocateUser = useCallback(() => {
    if (!navigator.geolocation) {
      return;
    }

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
            "Tu ubicacion actual",
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
      () => {},
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      },
    );
  }, [handleLocationUpdateAttempt, isLocationLocked]);

  useEffect(() => {
    if (!hasInitialized.current) {
      if (autoLocateOnMount) {
        handleLocateUser();
      }
      hasInitialized.current = true;
    }
  }, [autoLocateOnMount, handleLocateUser]);

  const sortedAllPharmacies = [...allPharmacies].sort((a, b) => {
    if (!userLocation) {
      return 0;
    }

    const aHasCoords = a.latitude != null && a.longitude != null;
    const bHasCoords = b.latitude != null && b.longitude != null;

    if (aHasCoords && !bHasCoords) return -1;
    if (!aHasCoords && bHasCoords) return 1;
    if (!aHasCoords && !bHasCoords) return 0;

    const distA = calculateDistance(
      userLocation[0],
      userLocation[1],
      a.latitude as number,
      a.longitude as number,
    );
    const distB = calculateDistance(
      userLocation[0],
      userLocation[1],
      b.latitude as number,
      b.longitude as number,
    );

    return distA - distB;
  });

  const sortedPharmacies = [...dbPharmacies].sort((a, b) => {
    if (!userLocation) {
      return 0;
    }

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
    if (!pharmacyId) {
      return;
    }

    const pharmacy = allPharmacies.find((item) => item.id === pharmacyId);
    if (!pharmacy) {
      return;
    }

    if (
      pharmacy.latitude != null &&
      pharmacy.longitude != null &&
      mapRef.current
    ) {
      try {
        mapRef.current.flyTo([pharmacy.latitude, pharmacy.longitude], 18, {
          duration: 1.5,
        });
        setSelection({ lat: pharmacy.latitude, lng: pharmacy.longitude });
        handleLocationUpdateAttempt(
          pharmacy.latitude,
          pharmacy.longitude,
          pharmacy.nombre,
        );
      } catch (error) {
        console.warn("Map not ready:", error);
      }
      return;
    }

    onUserLocationChange?.({
      lat: userLocation?.[0] ?? DEFAULT_CENTER.lat,
      lng: userLocation?.[1] ?? DEFAULT_CENTER.lng,
      address: pharmacy.nombre,
    });
  };

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
    html: '<div style="background-color: #7c3aed; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });

  const donationIcon = L.divIcon({
    className: "custom-marker",
    html: '<div style="background-color: #0d9488; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });

  const requestIcon = L.divIcon({
    className: "custom-marker",
    html: '<div style="background-color: #dc2626; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });

  const pharmacyIcon = L.divIcon({
    className: "custom-marker",
    html: '<div style="background-color: #0054a6; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white;"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/></svg></div>',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });

  const nearestPharmacyIcon = L.divIcon({
    className: "custom-marker",
    html: '<div style="background-color: #16a34a; width: 28px; height: 28px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; color: white;"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/></svg></div>',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });

  const selectionIcon = L.divIcon({
    className: "custom-marker",
    html: '<div style="background-color: #f59e0b; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); position: relative;"><div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 8px; height: 8px; background-color: white; border-radius: 50%;"></div></div>',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });

  function MapEventHandler() {
    const map = useMapEvents({
      click: (event: any) => {
        if (isLocationLocked || !onUserLocationChange) {
          return;
        }

        handleLocationUpdateAttempt(
          event.latlng.lat,
          event.latlng.lng,
          "Ubicacion seleccionada en mapa",
        );
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
    ...(locations ?? SAMPLE_LOCATIONS),
    ...(showPharmacies ? dbPharmacies : []),
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
              dragend: (event: any) => {
                if (isLocationLocked) {
                  return;
                }

                const marker = event.target;
                const position = marker.getLatLng();
                handleLocationUpdateAttempt(
                  position.lat,
                  position.lng,
                  "Ubicacion personalizada",
                );
              },
            }}
          >
            <Popup>
              <div className="font-medium">
                {isLocationLocked
                  ? "Tu ubicacion (fija)"
                  : "Tu ubicacion (arrastra para corregir)"}
              </div>
            </Popup>
          </Marker>
        )}

        {displayLocations.map((location) => {
          const isNearestPharmacy =
            location.type === "pharmacy" &&
            sortedPharmacies.length > 0 &&
            sortedPharmacies[0].id === location.id;

          return (
            <Marker
              key={location.id}
              position={[location.lat, location.lng]}
              icon={
                location.type === "donation"
                  ? donationIcon
                  : location.type === "request"
                    ? requestIcon
                    : isNearestPharmacy
                      ? nearestPharmacyIcon
                      : pharmacyIcon
              }
              eventHandlers={{
                click: () => {
                  if (location.type !== "pharmacy") {
                    return;
                  }

                  setSelection({ lat: location.lat, lng: location.lng });
                  handleLocationUpdateAttempt(
                    location.lat,
                    location.lng,
                    location.title,
                  );
                },
              }}
              zIndexOffset={isNearestPharmacy ? 1000 : 0}
            >
              <Popup>
                <div className="font-medium">
                  {location.title}
                  {isNearestPharmacy && (
                    <span className="mt-1 block text-xs font-bold text-green-600">
                      Mas cercana
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  {location.type === "donation"
                    ? "Donacion"
                    : location.type === "request"
                      ? "Solicitud"
                      : "Farmacia"}
                </div>
                {location.distance && (
                  <div className="mt-1 text-xs font-medium text-teal-600">
                    {location.distance.toFixed(1)} km
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
                Ubicacion seleccionada
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      <div className="absolute left-4 right-4 top-4 z-[1000] flex justify-end gap-2">
        {showPharmacySelector && (
          <div className="relative flex-1">
            <Combobox
              options={sortedAllPharmacies.map((pharmacy) => {
                let distanceLabel = "";

                if (
                  userLocation &&
                  pharmacy.latitude != null &&
                  pharmacy.longitude != null
                ) {
                  const distance = calculateDistance(
                    userLocation[0],
                    userLocation[1],
                    pharmacy.latitude,
                    pharmacy.longitude,
                  );
                  distanceLabel = `${distance.toFixed(1)} km de distancia`;
                }

                return {
                  value: pharmacy.id,
                  label: pharmacy.nombre,
                  description:
                    distanceLabel || pharmacy.direccion || "Farmacia",
                };
              })}
              value={selectedPharmacy}
              onValueChange={handlePharmacyChange}
              placeholder="Seleccionar farmacia cercana..."
              emptyMessage="No se encontraron farmacias."
              className="bg-white shadow-sm"
            />
          </div>
        )}

        <Button
          variant="outline"
          size="icon"
          className="bg-white shadow-sm"
          onClick={handleLocateUser}
        >
          <Locate className="h-4 w-4" />
        </Button>
      </div>

      <div className="absolute bottom-4 left-4 z-[1000] flex flex-col gap-2">
        {showUserMarker && userLocation && (
          <div className="flex items-center gap-2 rounded-md bg-white p-2 shadow-sm">
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: "#7c3aed" }}
            />
            <span className="text-xs">Tu ubicacion</span>
          </div>
        )}

        {showPharmacyLegend && showPharmacies && (
          <>
            <div className="flex items-center gap-2 rounded-md bg-white p-2 shadow-sm">
              <div className="h-3 w-3 rounded-full bg-[#16a34a]" />
              <span className="text-xs">Farmacia mas cercana</span>
            </div>
            <div className="flex items-center gap-2 rounded-md bg-white p-2 shadow-sm">
              <div className="h-3 w-3 rounded-sm bg-[#0054a6]" />
              <span className="text-xs">Otras farmacias</span>
            </div>
          </>
        )}
      </div>

      <AlertDialog
        open={isConfirmDialogOpen}
        onOpenChange={setIsConfirmDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cambiar ubicacion</AlertDialogTitle>
            <AlertDialogDescription>
              Estas seguro de que deseas modificar tu ubicacion registrada?
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

export const MapView = dynamic(() => Promise.resolve(MapViewInner), {
  ssr: false,
  loading: () => (
    <div className="flex h-[500px] w-full items-center justify-center rounded-md bg-gray-100 text-sm text-gray-500">
      <div className="flex flex-col items-center gap-2">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" />
        <span>Cargando mapa...</span>
      </div>
    </div>
  ),
});
