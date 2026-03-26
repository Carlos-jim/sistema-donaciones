"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  Gift,
  MapPin,
  Package,
  Pill,
  PlusCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";

type OfferMedication = {
  id: string;
  cantidad: number;
  fechaExpiracion: string | null;
  medicamento: {
    nombre: string;
    presentacion: string | null;
  };
};

type OwnOffer = {
  id: string;
  codigo: string | null;
  descripcion: string | null;
  donationPhotoUrl: string | null;
  estado: string;
  createdAt: string;
  farmacia: {
    id: string;
    nombre: string;
    direccion: string;
  } | null;
  medicamentos: OfferMedication[];
};

type AcceptedDelivery = {
  id: string;
  createdAt: string;
  estado: string;
  motivo: string | null;
  assignedDate: string | null;
  codigoComprobante: string | null;
  codigoEntregaDonante: string | null;
  farmaciaConfirmada: boolean | null;
  motivoRechazoFarmacia: string | null;
  deliveryConfirmedAt: string | null;
  farmaciaEntrega: {
    id: string;
    nombre: string;
    direccion: string;
  } | null;
  medicamentos: OfferMedication[];
  donorQrPayload: string | null;
};

type DonationsResponse = {
  ownOffers: OwnOffer[];
  acceptedDeliveries: AcceptedDelivery[];
};

type DonationItem =
  | {
      kind: "offer";
      id: string;
      createdAt: string;
      status: string;
      code: string | null;
      description: string | null;
      pharmacyLabel: string | null;
      canConfirmDelivery: false;
      photoUrl: string | null;
      rejectionReason: null;
      deliveryConfirmedAt: null;
      medications: OfferMedication[];
    }
  | {
      kind: "delivery";
      id: string;
      createdAt: string;
      status: string;
      code: string | null;
      description: string | null;
      pharmacyLabel: string | null;
      canConfirmDelivery: boolean;
      photoUrl: null;
      rejectionReason: string | null;
      deliveryConfirmedAt: string | null;
      medications: OfferMedication[];
      donorCode: string | null;
    };

function formatDate(date: string | null) {
  if (!date) return "N/A";
  return new Date(date).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function statusBadgeClass(status: string) {
  switch (status) {
    case "DISPONIBLE":
    case "COMPLETADA":
    case "RECIBIDA":
      return "bg-green-100 text-green-800 border-green-200";
    case "APROBADA":
    case "EN_PROCESO":
    case "LISTA_PARA_RETIRO":
      return "bg-amber-100 text-amber-800 border-amber-200";
    case "RECHAZADA":
    case "EXPIRADA":
    case "ABANDONADA":
      return "bg-red-100 text-red-800 border-red-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
}

export default function MyDonationsPage() {
  const { toast } = useToast();

  const [data, setData] = useState<DonationsResponse>({
    ownOffers: [],
    acceptedDeliveries: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isConfirmingDelivery, setIsConfirmingDelivery] = useState(false);
  const [selectedItem, setSelectedItem] = useState<DonationItem | null>(null);

  const fetchDonations = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/donations/list");
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "No se pudieron cargar las donaciones");
      }

      setData(payload);
    } catch (error) {
      console.error("Error fetching donations:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar tus donaciones.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDonations();
  }, []);

  const items: DonationItem[] = [
    ...data.ownOffers.map((offer) => ({
      kind: "offer" as const,
      id: offer.id,
      createdAt: offer.createdAt,
      status: offer.estado,
      code: offer.codigo,
      description: offer.descripcion,
      pharmacyLabel: offer.farmacia
        ? `${offer.farmacia.nombre} - ${offer.farmacia.direccion}`
        : null,
      canConfirmDelivery: false as const,
      photoUrl: offer.donationPhotoUrl,
      rejectionReason: null,
      deliveryConfirmedAt: null,
      medications: offer.medicamentos,
    })),
    ...data.acceptedDeliveries.map((delivery) => ({
      kind: "delivery" as const,
      id: delivery.id,
      createdAt: delivery.assignedDate || delivery.createdAt,
      status: delivery.estado,
      code: delivery.codigoEntregaDonante || delivery.codigoComprobante,
      description: delivery.motivo,
      pharmacyLabel: delivery.farmaciaEntrega
        ? `${delivery.farmaciaEntrega.nombre} - ${delivery.farmaciaEntrega.direccion}`
        : null,
      canConfirmDelivery:
        delivery.estado === "EN_PROCESO" &&
        delivery.farmaciaConfirmada === true &&
        !delivery.deliveryConfirmedAt,
      photoUrl: null,
      rejectionReason: delivery.motivoRechazoFarmacia,
      deliveryConfirmedAt: delivery.deliveryConfirmedAt,
      medications: delivery.medicamentos,
      donorCode: delivery.codigoEntregaDonante,
    })),
  ].sort(
    (left, right) =>
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  );

  const confirmDelivery = async (item: DonationItem) => {
    if (item.kind !== "delivery") return;

    setIsConfirmingDelivery(true);
    try {
      const response = await fetch(`/api/requests/${item.id}/confirm-delivery`, {
        method: "PATCH",
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "No se pudo confirmar la entrega");
      }

      toast({
        title: "Entrega confirmada",
        description: "La farmacia fue notificada correctamente.",
      });
      await fetchDonations();
      setSelectedItem((current) =>
        current && current.kind === "delivery" && current.id === item.id
          ? {
              ...current,
              canConfirmDelivery: false,
              deliveryConfirmedAt: new Date().toISOString(),
            }
          : current,
      );
    } catch (error) {
      console.error("Error confirming delivery:", error);
      toast({
        title: "Error",
        description: "No se pudo confirmar la entrega.",
        variant: "destructive",
      });
    } finally {
      setIsConfirmingDelivery(false);
    }
  };

  return (
    <>
      <div className="space-y-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Mis Donaciones
            </h1>
            <p className="mt-1 text-gray-500">
              Consulta tus ofertas y entregas comprometidas.
            </p>
          </div>
          <Link href="/dashboard/donate-medication">
            <Button className="bg-teal-600 text-white hover:bg-teal-700">
              <PlusCircle className="mr-2 h-4 w-4" />
              Nueva donacion
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <Card key={item} className="border-0 shadow-lg shadow-gray-200/50">
                <CardHeader className="space-y-3">
                  <Skeleton className="h-5 w-24 rounded-full" />
                  <Skeleton className="h-6 w-40" />
                </CardHeader>
                <CardContent className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-4 py-16 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-teal-50 text-teal-400">
              <Gift className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">
              Aun no tienes donaciones registradas
            </h3>
            <p className="mx-auto mt-2 max-w-sm text-gray-500">
              Cuando hagas una donacion o aceptes una solicitud, aparecera aqui.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <Card
                key={`${item.kind}-${item.id}`}
                className="flex h-full flex-col overflow-hidden border-0 shadow-lg shadow-gray-200/50"
              >
                <CardHeader className="pb-3">
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className={statusBadgeClass(item.status)}>
                        {item.status.replace(/_/g, " ")}
                      </Badge>
                      <Badge variant="secondary">
                        {item.kind === "offer" ? "Oferta" : "Entrega"}
                      </Badge>
                    </div>
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <Clock className="h-3 w-3" />
                      {formatDate(item.createdAt)}
                    </span>
                  </div>
                  <CardTitle className="line-clamp-1 text-xl text-teal-950">
                    {item.medications[0]?.medicamento.nombre || "Medicamento"}
                  </CardTitle>
                </CardHeader>

                <CardContent className="flex-1 space-y-3">
                  <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 text-sm text-gray-700">
                    <p>
                      <span className="font-medium text-gray-900">Codigo:</span>{" "}
                      {item.code || "Sin codigo"}
                    </p>
                    <p className="mt-1">
                      <span className="font-medium text-gray-900">Cantidad:</span>{" "}
                      {item.medications[0]?.cantidad || 0}
                    </p>
                  </div>

                  {item.pharmacyLabel && (
                    <div className="flex items-start gap-2 rounded-lg border border-gray-100 bg-gray-50 p-3 text-sm text-gray-700">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />
                      <span>{item.pharmacyLabel}</span>
                    </div>
                  )}

                  {item.rejectionReason && (
                    <div className="rounded-lg border border-orange-200 bg-orange-50 p-3 text-sm text-orange-800">
                      {item.rejectionReason}
                    </div>
                  )}

                  {item.deliveryConfirmedAt && (
                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
                      Entrega confirmada en farmacia.
                    </div>
                  )}

                  {item.description && (
                    <p className="line-clamp-3 border-l-2 border-gray-200 pl-3 text-sm italic text-gray-500">
                      {item.description}
                    </p>
                  )}
                </CardContent>

                <CardFooter className="flex flex-col gap-2 border-t border-gray-100 bg-gray-50/60">
                  {item.canConfirmDelivery && (
                    <Button
                      className="w-full bg-blue-600 text-white hover:bg-blue-700"
                      onClick={() => confirmDelivery(item)}
                      disabled={isConfirmingDelivery}
                    >
                      <Package className="mr-2 h-4 w-4" />
                      {isConfirmingDelivery
                        ? "Confirmando..."
                        : "Confirmar entrega en farmacia"}
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setSelectedItem(item)}
                  >
                    Ver detalles
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog
        open={!!selectedItem}
        onOpenChange={(open) => {
          if (!open) setSelectedItem(null);
        }}
      >
        <DialogContent className="max-w-2xl">
          {selectedItem && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {selectedItem.kind === "offer"
                    ? "Detalle de donacion"
                    : "Detalle de entrega"}
                </DialogTitle>
                <DialogDescription>
                  {selectedItem.code || "Sin codigo asignado"}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-5">
                <div className="flex justify-center">
                  <Badge
                    variant="outline"
                    className={`${statusBadgeClass(selectedItem.status)} px-4 py-1.5 text-sm`}
                  >
                    {selectedItem.status.replace(/_/g, " ")}
                  </Badge>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border bg-gray-50 p-4">
                    <p className="text-xs uppercase tracking-wide text-gray-500">
                      Tipo
                    </p>
                    <p className="mt-1 font-medium text-gray-900">
                      {selectedItem.kind === "offer"
                        ? "Oferta de donacion"
                        : "Solicitud aceptada"}
                    </p>
                  </div>

                  <div className="rounded-xl border bg-gray-50 p-4">
                    <p className="text-xs uppercase tracking-wide text-gray-500">
                      Fecha
                    </p>
                    <p className="mt-1 font-medium text-gray-900">
                      {formatDate(selectedItem.createdAt)}
                    </p>
                  </div>
                </div>

                {"donorCode" in selectedItem && (
                  <div className="rounded-xl border bg-gray-50 p-4">
                    <p className="text-xs uppercase tracking-wide text-gray-500">
                      Codigo de entrega
                    </p>
                    <p className="mt-1 font-mono text-sm text-gray-900">
                      {selectedItem.donorCode || "N/A"}
                    </p>
                  </div>
                )}

                {selectedItem.pharmacyLabel && (
                  <div className="rounded-xl border bg-gray-50 p-4">
                    <p className="text-xs uppercase tracking-wide text-gray-500">
                      Farmacia
                    </p>
                    <p className="mt-1 font-medium text-gray-900">
                      {selectedItem.pharmacyLabel}
                    </p>
                  </div>
                )}

                <div>
                  <h3 className="mb-3 flex items-center gap-2 font-semibold text-gray-800">
                    <Pill className="h-4 w-4 text-teal-600" />
                    Medicamentos
                  </h3>
                  <div className="space-y-3">
                    {selectedItem.medications.map((medication) => (
                      <div
                        key={medication.id}
                        className="rounded-xl border border-gray-100 bg-gray-50 p-4"
                      >
                        <p className="font-medium text-gray-900">
                          {medication.medicamento.nombre}
                        </p>
                        <p className="text-sm text-gray-600">
                          Cantidad: {medication.cantidad}
                          {medication.medicamento.presentacion
                            ? ` ${medication.medicamento.presentacion}`
                            : ""}
                        </p>
                        <p className="text-sm text-gray-500">
                          Vencimiento: {formatDate(medication.fechaExpiracion)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedItem.photoUrl && (
                  <div className="overflow-hidden rounded-2xl border bg-gray-50">
                    <img
                      src={selectedItem.photoUrl}
                      alt="Foto de la donacion"
                      className="h-full w-full object-contain"
                    />
                  </div>
                )}

                {selectedItem.canConfirmDelivery && (
                  <Button
                    className="w-full bg-blue-600 text-white hover:bg-blue-700"
                    onClick={() => confirmDelivery(selectedItem)}
                    disabled={isConfirmingDelivery}
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    {isConfirmingDelivery
                      ? "Confirmando..."
                      : "Confirmar entrega en farmacia"}
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
