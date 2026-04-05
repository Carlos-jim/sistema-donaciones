"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  CheckCircle,
  Clock,
  Copy,
  Heart,
  MapPin,
  User,
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { getQrImageUrl } from "@/lib/qr";

interface Pharmacy {
  id: string;
  nombre: string;
  direccion: string;
  telefono?: string;
  horario?: string;
  latitude?: number;
  longitude?: number;
}

interface AcceptResult {
  donorCode: string;
  donorQrPayload: string;
  farmacia: {
    id?: string;
    nombre: string;
    direccion: string;
  };
}

interface MedicationRequestCardProps {
  id: string;
  name: string;
  distance: string;
  urgency: string;
  date: string;
  motivo?: string;
  onAccepted?: () => void;
}

export function MedicationRequestCard({
  id,
  name,
  distance,
  urgency,
  date,
  motivo,
  onAccepted,
}: MedicationRequestCardProps) {
  const beneficiaryLabel = "Beneficiario anonimo";
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [acceptResult, setAcceptResult] = useState<AcceptResult | null>(null);
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [selectedPharmacy, setSelectedPharmacy] = useState("");
  const [isLoadingPharmacies, setIsLoadingPharmacies] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (isDialogOpen && pharmacies.length === 0) {
      void fetchPharmacies();
    }
  }, [isDialogOpen, pharmacies.length]);

  const fetchPharmacies = async () => {
    setIsLoadingPharmacies(true);
    try {
      const response = await fetch("/api/pharmacies");
      if (response.ok) {
        const data = await response.json();
        setPharmacies(data);
      }
    } catch (error) {
      console.error("Error fetching pharmacies:", error);
    } finally {
      setIsLoadingPharmacies(false);
    }
  };

  const getUrgencyColor = (value: string) => {
    switch (value.toLowerCase()) {
      case "alta":
        return "bg-red-100 text-red-800 border-red-200";
      case "media":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "baja":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copiado",
        description: "Codigo copiado al portapapeles",
      });
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const handleAcceptRequest = async () => {
    if (!selectedPharmacy) {
      toast({
        title: "Selecciona una farmacia",
        description: "Debes seleccionar la farmacia donde entregaras el medicamento",
        variant: "destructive",
      });
      return;
    }

    setIsAccepting(true);

    try {
      const userResponse = await fetch("/api/auth/me");
      if (!userResponse.ok) {
        if (userResponse.status === 401 || userResponse.status === 404) {
          throw new Error(
            "Sesion expirada. Recarga la pagina e inicia sesion nuevamente.",
          );
        }

        throw new Error("Debes iniciar sesion para aceptar solicitudes");
      }

      const userData = await userResponse.json();

      const response = await fetch("/api/requests/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: id,
          donorUserId: userData.id,
          pharmacyId: selectedPharmacy,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "No se pudo aceptar la solicitud");
      }

      const result = await response.json();
      setAcceptResult(result.data);

      toast({
        title: "Solicitud aceptada",
        description: `Codigo de entrega: ${result.data.donorCode}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Error al aceptar la solicitud",
        variant: "destructive",
      });
    } finally {
      setIsAccepting(false);
    }
  };

  const handleClose = () => {
    setIsDialogOpen(false);

    if (acceptResult) {
      setAcceptResult(null);
      setSelectedPharmacy("");
      onAccepted?.();
      router.refresh();
    }
  };

  const handleDialogOpenChange = (open: boolean) => {
    if (open) {
      setIsDialogOpen(true);
      return;
    }

    handleClose();
  };

  return (
    <>
      <Card className="overflow-hidden border border-gray-100 transition-shadow duration-300 hover:shadow-lg">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-white pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="line-clamp-1 text-lg font-semibold text-gray-900">
              {name}
            </CardTitle>
            <Badge className={`${getUrgencyColor(urgency)} shrink-0 border`}>
              {urgency}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="pb-3 pt-3">
          <div className="space-y-2 text-sm">
            <div className="flex items-center text-gray-600">
              <User className="mr-2 h-4 w-4 text-teal-600" />
              <span className="font-medium">{beneficiaryLabel}</span>
            </div>

            {distance !== "N/A" && (
              <div className="flex items-center text-gray-500">
                <MapPin className="mr-2 h-4 w-4" />
                <span>{distance}</span>
              </div>
            )}

            <div className="flex items-center text-gray-500">
              <Clock className="mr-2 h-4 w-4" />
              <span>{date}</span>
            </div>
          </div>
        </CardContent>

        <CardFooter className="pt-0">
          <Button
            onClick={() => setIsDialogOpen(true)}
            className="w-full bg-gradient-to-r from-teal-600 to-teal-500 text-white shadow-md shadow-teal-600/20 hover:from-teal-700 hover:to-teal-600"
          >
            <Heart className="mr-2 h-4 w-4" />
            Quiero Donar
          </Button>
        </CardFooter>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {acceptResult ? "Donacion confirmada" : "Confirmar donacion"}
            </DialogTitle>
            <DialogDescription>
              {acceptResult
                ? "Guarda tu codigo de entrega para presentarlo en la farmacia"
                : "Selecciona la farmacia donde entregaras el medicamento"}
            </DialogDescription>
          </DialogHeader>

          {acceptResult ? (
            <div className="space-y-4 py-4">
              <div className="text-center">
                <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </div>

              <div className="rounded-xl border-2 border-teal-200 bg-gradient-to-r from-teal-50 to-teal-100 p-4">
                <p className="mb-1 text-sm font-medium text-teal-700">
                  Codigo donante (entrega)
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold tracking-wider text-teal-800">
                    {acceptResult.donorCode}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(acceptResult.donorCode)}
                    className="text-teal-700 hover:text-teal-900"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <img
                  src={getQrImageUrl(acceptResult.donorQrPayload, 180)}
                  alt="QR del donante"
                  className="mx-auto mt-3 h-[180px] w-[180px] rounded-lg border bg-white p-2"
                />
              </div>

              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <div className="flex items-start gap-3">
                  <Building2 className="mt-0.5 h-5 w-5 text-teal-600" />
                  <div>
                    <p className="font-semibold text-gray-900">
                      {acceptResult.farmacia.nombre}
                    </p>
                    <p className="text-sm text-gray-600">
                      {acceptResult.farmacia.direccion}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-yellow-100 bg-yellow-50 p-3 text-sm text-gray-600">
                <strong>Proximos pasos:</strong>
                <ul className="mt-1 list-inside list-disc space-y-1">
                  <li>Lleva el medicamento a la farmacia indicada</li>
                  <li>Presenta tu codigo de entrega al momento de llevarlo</li>
                  <li>El solicitante recibira su propio codigo por separado</li>
                </ul>
              </div>

              <DialogFooter>
                <Button
                  onClick={handleClose}
                  className="w-full bg-gradient-to-r from-teal-600 to-teal-500"
                >
                  Entendido
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <>
              <div className="space-y-4 py-4">
                <div className="rounded-lg border border-teal-100 bg-gradient-to-r from-teal-50 to-white p-4">
                  <h4 className="mb-2 font-semibold text-gray-900">{name}</h4>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>
                      <strong>Beneficiario:</strong> {beneficiaryLabel}
                    </p>
                    {distance !== "N/A" && (
                      <p>
                        <strong>Distancia:</strong> {distance}
                      </p>
                    )}
                    <p>
                      <strong>Urgencia:</strong>{" "}
                      <span
                        className={`inline-block rounded px-2 py-0.5 text-xs ${getUrgencyColor(urgency)}`}
                      >
                        {urgency}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Building2 className="h-4 w-4 text-teal-600" />
                    Farmacia de entrega *
                  </label>
                  <Select
                    value={selectedPharmacy}
                    onValueChange={setSelectedPharmacy}
                    disabled={isLoadingPharmacies}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue
                        placeholder={
                          isLoadingPharmacies
                            ? "Cargando farmacias..."
                            : "Selecciona una farmacia"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {pharmacies.map((pharmacy) => (
                        <SelectItem key={pharmacy.id} value={pharmacy.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{pharmacy.nombre}</span>
                            <span className="text-xs text-gray-500">
                              {pharmacy.direccion}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {pharmacies.length === 0 && !isLoadingPharmacies && (
                    <p className="text-xs text-red-500">
                      No hay farmacias disponibles
                    </p>
                  )}
                </div>

                {motivo && (
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-sm text-gray-600">
                      <strong>Motivo:</strong> {motivo}
                    </p>
                  </div>
                )}

                <div className="rounded-lg border border-yellow-100 bg-yellow-50 p-3 text-sm text-gray-500">
                  <strong>Importante:</strong> Al confirmar, el sistema genera
                  codigos distintos para el donante y para el solicitante. Aqui
                  solo veras tu codigo de entrega.
                </div>
              </div>

              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  disabled={isAccepting}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleAcceptRequest}
                  disabled={isAccepting || !selectedPharmacy}
                  className="bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600"
                >
                  {isAccepting ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      <Heart className="mr-2 h-4 w-4" />
                      Confirmar Donacion
                    </>
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
