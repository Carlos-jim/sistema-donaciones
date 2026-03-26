"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import type { LeafletMouseEvent } from "leaflet";

const DEFAULT_CENTER: [number, number] = [10.99, -63.9];
const DEFAULT_ZOOM = 13;

export interface LocationPickerValue {
  lat: number;
  lng: number;
}

interface LocationPickerMapProps {
  value?: LocationPickerValue | null;
  onChange: (val: LocationPickerValue) => void;
  height?: string;
}

function LocationPickerInner({ value, onChange, height = "280px" }: LocationPickerMapProps) {
  const [L, setL] = useState<any>(null);
  const [MapContainer, setMapContainer] = useState<any>(null);
  const [TileLayer, setTileLayer] = useState<any>(null);
  const [Marker, setMarker] = useState<any>(null);
  const [useMapEvents, setUseMapEvents] = useState<any>(null);
  const [markerPos, setMarkerPos] = useState<[number, number] | null>(
    value ? [value.lat, value.lng] : null
  );

  useEffect(() => {
    Promise.all([
      import("leaflet"),
      import("react-leaflet"),
    ]).then(([leaflet, rl]) => {
      const lModule = leaflet.default ?? leaflet;
      // Fix default icon paths
      delete (lModule.Icon.Default.prototype as any)._getIconUrl;
      lModule.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });
      setL(lModule);
      setMapContainer(() => rl.MapContainer);
      setTileLayer(() => rl.TileLayer);
      setMarker(() => rl.Marker);
      setUseMapEvents(() => rl.useMapEvents);
    });
  }, []);

  useEffect(() => {
    if (value) setMarkerPos([value.lat, value.lng]);
  }, [value]);

  if (!L || !MapContainer) {
    return (
      <div
        className="flex items-center justify-center bg-gray-100 rounded-xl text-sm text-gray-400"
        style={{ height }}
      >
        Cargando mapa...
      </div>
    );
  }

  function ClickHandler() {
    useMapEvents({
      click(e: LeafletMouseEvent) {
        const { lat, lng } = e.latlng;
        setMarkerPos([lat, lng]);
        onChange({ lat, lng });
      },
    });
    return null;
  }

  const center: [number, number] = markerPos ?? DEFAULT_CENTER;

  return (
    <MapContainer
      center={center}
      zoom={DEFAULT_ZOOM}
      style={{ height, width: "100%", borderRadius: "0.75rem" }}
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickHandler />
      {markerPos && (
        <Marker
          position={markerPos}
          draggable
          eventHandlers={{
            dragend(e: any) {
              const { lat, lng } = e.target.getLatLng();
              setMarkerPos([lat, lng]);
              onChange({ lat, lng });
            },
          }}
        />
      )}
    </MapContainer>
  );
}

export const LocationPickerMap = dynamic(
  () => Promise.resolve(LocationPickerInner),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center bg-gray-100 rounded-xl text-sm text-gray-400 h-[280px]">
        Cargando mapa...
      </div>
    ),
  }
);
