"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getQrImageUrl } from "@/lib/qr";
import { Gift, PlusCircle, Truck } from "lucide-react";

type OwnOffer = {
  id: string;
  codigo: string | null;
  descripcion: string | null;
  estado: string;
  origen: "USUARIO" | "ENTE_SALUD" | "ABANDONO_RETIRO";
  createdAt: string;
  medicamentos: Array<{
    id: string;
    cantidad: number;
    fechaExpiracion: string | null;
    medicamento: {
      nombre: string;
      presentacion: string | null;
    };
  }>;
};

type AcceptedDelivery = {
  id: string;
  estado: string;
  motivo: string | null;
  beneficiaryLabel?: string;
  assignedDate: string | null;
  fechaRecepcionFarmacia: string | null;
  fechaListaRetiro: string | null;
  fechaLimiteRetiro: string | null;
  fechaRetiro: string | null;
  codigoEntregaDonante: string | null;
  codigoRetiroSolicitante: string | null;
  donorQrPayload: string | null;
  requesterQrPayload: string | null;
  farmaciaEntrega: {
    id: string;
    nombre: string;
    direccion: string;
  } | null;
  medicamentos: Array<{
    id: string;
    cantidad: number;
    medicamento: {
      nombre: string;
      presentacion: string | null;
    };
  }>;
};

type DonationsPayload = {
  ownOffers: OwnOffer[];
  acceptedDeliveries: AcceptedDelivery[];
};

function statusBadgeClass(status: string) {
  switch (status) {
    case "COMPLETADA":
    case "RECIBIDA":
      return "bg-green-100 text-green-800 border-green-200";
    case "LISTA_PARA_RETIRO":
    case "EN_PROCESO":
    case "APROBADA":
      return "bg-amber-100 text-amber-800 border-amber-200";
    case "RECHAZADA":
    case "ABANDONADA":
    case "EXPIRADA":
      return "bg-red-100 text-red-800 border-red-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
}

function formatDate(date: string | null) {
  if (!date) return "N/A";
  return new Date(date).toLocaleString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function MyDonationsPage() {
  const [data, setData] = useState<DonationsPayload>({
    ownOffers: [],
    acceptedDeliveries: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch("/api/donations/list");
        if (!response.ok) throw new Error("No se pudieron cargar donaciones");
        const payload = (await response.json()) as DonationsPayload;
        setData(payload);
      } catch (error) {
        console.error("Error fetching donation data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, []);

  const sortedDeliveries = useMemo(
    () =>
      [...data.acceptedDeliveries].sort((a, b) => {
        const aTime = new Date(a.assignedDate || 0).getTime();
        const bTime = new Date(b.assignedDate || 0).getTime();
        return bTime - aTime;
      }),
    [data.acceptedDeliveries],
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Mis Donaciones
          </h1>
          <p className="text-gray-500 mt-1">
            Separa tus ofertas propias de tus entregas comprometidas.
          </p>
        </div>
        <Link href="/dashboard/donate-medication">
          <Button className="bg-teal-600 hover:bg-teal-700">
            <PlusCircle className="mr-2 h-4 w-4" />
            Nueva Donación
          </Button>
        </Link>
      </div>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Gift className="h-5 w-5 text-teal-700" />
          <h2 className="text-xl font-semibold text-gray-900">Ofertas propias</h2>
        </div>

        {isLoading ? (
          <p className="text-sm text-gray-500">Cargando ofertas...</p>
        ) : data.ownOffers.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              No tienes ofertas propias registradas.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {data.ownOffers.map((offer) => (
              <Card key={offer.id} className="border-gray-200">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg">
                      {offer.medicamentos[0]?.medicamento.nombre ||
                        "Medicamento"}
                    </CardTitle>
                    <Badge className={statusBadgeClass(offer.estado)} variant="outline">
                      {offer.estado.replace(/_/g, " ")}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-gray-600">
                  <p>
                    <strong>Código:</strong> {offer.codigo || "Sin código"}
                  </p>
                  <p>
                    <strong>Creada:</strong> {formatDate(offer.createdAt)}
                  </p>
                  <p>
                    <strong>Cantidad:</strong>{" "}
                    {offer.medicamentos[0]?.cantidad || 0}
                  </p>
                  {offer.descripcion && (
                    <p className="line-clamp-2">
                      <strong>Descripción:</strong> {offer.descripcion}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Truck className="h-5 w-5 text-blue-700" />
          <h2 className="text-xl font-semibold text-gray-900">
            Entregas comprometidas
          </h2>
        </div>

        {isLoading ? (
          <p className="text-sm text-gray-500">Cargando entregas...</p>
        ) : sortedDeliveries.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              Aún no has aceptado solicitudes para donar.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {sortedDeliveries.map((delivery) => (
              <Card key={delivery.id} className="border-gray-200">
                <CardHeader className="pb-2">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-lg">
                        {delivery.medicamentos[0]?.medicamento.nombre ||
                          "Medicamento"}
                      </CardTitle>
                      <p className="text-sm text-gray-500 mt-1">
                        Beneficiario:{" "}
                        {delivery.beneficiaryLabel || "Beneficiario anónimo"}
                      </p>
                      <p className="text-sm text-gray-500">
                        Farmacia: {delivery.farmaciaEntrega?.nombre || "N/A"}
                      </p>
                    </div>
                    <Badge className={statusBadgeClass(delivery.estado)} variant="outline">
                      {delivery.estado.replace(/_/g, " ")}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2 text-sm">
                    <p className="font-medium text-gray-900">Código del donante</p>
                    <p className="font-mono text-teal-700">
                      {delivery.codigoEntregaDonante || "N/A"}
                    </p>
                    {delivery.donorQrPayload && (
                      <img
                        src={getQrImageUrl(delivery.donorQrPayload, 160)}
                        alt="QR de entrega del donante"
                        className="h-40 w-40 rounded-md border bg-white p-2"
                      />
                    )}
                  </div>

                  <div className="space-y-2 text-sm">
                    <p className="font-medium text-gray-900">Código del solicitante</p>
                    <p className="font-mono text-blue-700">
                      {delivery.codigoRetiroSolicitante || "N/A"}
                    </p>
                    {delivery.requesterQrPayload && (
                      <img
                        src={getQrImageUrl(delivery.requesterQrPayload, 160)}
                        alt="QR de retiro del solicitante"
                        className="h-40 w-40 rounded-md border bg-white p-2"
                      />
                    )}
                  </div>

                  <div className="space-y-2 text-sm text-gray-700">
                    <p className="font-medium text-gray-900">Timeline</p>
                    <p>Asignada: {formatDate(delivery.assignedDate)}</p>
                    <p>Recibida en farmacia: {formatDate(delivery.fechaRecepcionFarmacia)}</p>
                    <p>Lista para retiro: {formatDate(delivery.fechaListaRetiro)}</p>
                    <p>Límite retiro: {formatDate(delivery.fechaLimiteRetiro)}</p>
                    <p>Retirada: {formatDate(delivery.fechaRetiro)}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
