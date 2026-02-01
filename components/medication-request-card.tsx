"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { MapPin, Clock, Heart, User, CheckCircle, Building2, Copy } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";

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
    codigoComprobante: string;
    farmacia: {
        nombre: string;
        direccion: string;
    };
}

interface MedicationRequestCardProps {
    id: string;
    name: string;
    requester: string;
    location: string;
    distance: string;
    urgency: string;
    date: string;
    motivo?: string;
    medicamentos?: Array<{
        nombre: string;
        cantidad: number;
        presentacion?: string;
    }>;
    onAccepted?: () => void;
}

export function MedicationRequestCard({
    id,
    name,
    requester,
    location,
    distance,
    urgency,
    date,
    motivo,
    medicamentos,
    onAccepted,
}: MedicationRequestCardProps) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isAccepting, setIsAccepting] = useState(false);
    const [acceptResult, setAcceptResult] = useState<AcceptResult | null>(null);
    const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
    const [selectedPharmacy, setSelectedPharmacy] = useState<string>("");
    const [isLoadingPharmacies, setIsLoadingPharmacies] = useState(false);
    const { toast } = useToast();
    const router = useRouter();

    // Fetch pharmacies when dialog opens
    useEffect(() => {
        if (isDialogOpen && pharmacies.length === 0) {
            fetchPharmacies();
        }
    }, [isDialogOpen]);

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

    const getUrgencyColor = (urgency: string) => {
        switch (urgency.toLowerCase()) {
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
                description: "Código copiado al portapapeles",
            });
        } catch (err) {
            console.error("Failed to copy:", err);
        }
    };

    const handleAcceptRequest = async () => {
        if (!selectedPharmacy) {
            toast({
                title: "Selecciona una farmacia",
                description: "Debes seleccionar la farmacia donde entregarás el medicamento",
                variant: "destructive",
            });
            return;
        }

        setIsAccepting(true);
        try {
            // Get current user
            const userResponse = await fetch("/api/auth/me");
            if (!userResponse.ok) {
                if (userResponse.status === 401 || userResponse.status === 404) {
                    // Redirect to login if possible, or just throw clearer error
                    throw new Error("Sesión expirada. Por favor recarga la página e inicia sesión nuevamente.");
                }
                throw new Error("Debes iniciar sesión para aceptar solicitudes");
            }
            const userData = await userResponse.json();

            // Accept the request
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
                title: "¡Solicitud Aceptada!",
                description: `Código de comprobante: ${result.data.codigoComprobante}`,
            });
        } catch (error) {
            toast({
                title: "Error",
                description:
                    error instanceof Error ? error.message : "Error al aceptar solicitud",
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

    return (
        <>
            <Card className="overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow duration-300">
                <CardHeader className="pb-2 bg-gradient-to-r from-gray-50 to-white">
                    <div className="flex justify-between items-start gap-2">
                        <CardTitle className="text-lg font-semibold text-gray-900 line-clamp-1">
                            {name}
                        </CardTitle>
                        <Badge className={`${getUrgencyColor(urgency)} border shrink-0`}>
                            {urgency}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="pb-3 pt-3">
                    <div className="space-y-2 text-sm">
                        <div className="flex items-center text-gray-600">
                            <User className="h-4 w-4 mr-2 text-teal-600" />
                            <span className="font-medium">{requester}</span>
                        </div>
                        {distance !== "N/A" && (
                            <div className="flex items-center text-gray-500">
                                <MapPin className="h-4 w-4 mr-2" />
                                <span>{distance}</span>
                            </div>
                        )}
                        <div className="flex items-center text-gray-500">
                            <Clock className="h-4 w-4 mr-2" />
                            <span>{date}</span>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="pt-0">
                    <Button
                        onClick={() => setIsDialogOpen(true)}
                        className="w-full bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white shadow-md shadow-teal-600/20"
                    >
                        <Heart className="mr-2 h-4 w-4" />
                        Quiero Donar
                    </Button>
                </CardFooter>
            </Card>

            {/* Confirmation Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={handleClose}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-xl">
                            {acceptResult ? "¡Donación Confirmada!" : "Confirmar Donación"}
                        </DialogTitle>
                        <DialogDescription>
                            {acceptResult
                                ? "Guarda este código para presentarlo en la farmacia"
                                : "Selecciona la farmacia donde entregarás el medicamento"}
                        </DialogDescription>
                    </DialogHeader>

                    {acceptResult ? (
                        <div className="py-4 space-y-4">
                            {/* Success animation */}
                            <div className="text-center">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                                    <CheckCircle className="h-8 w-8 text-green-600" />
                                </div>
                            </div>

                            {/* Receipt code */}
                            <div className="p-4 bg-gradient-to-r from-teal-50 to-teal-100 rounded-xl border-2 border-teal-200">
                                <p className="text-sm text-teal-700 mb-1 font-medium">Código de Comprobante</p>
                                <div className="flex items-center justify-between">
                                    <span className="text-2xl font-bold text-teal-800 tracking-wider">
                                        {acceptResult.codigoComprobante}
                                    </span>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => copyToClipboard(acceptResult.codigoComprobante)}
                                        className="text-teal-700 hover:text-teal-900"
                                    >
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            {/* Pharmacy info */}
                            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="flex items-start gap-3">
                                    <Building2 className="h-5 w-5 text-teal-600 mt-0.5" />
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

                            {/* Instructions */}
                            <div className="text-sm text-gray-600 bg-yellow-50 p-3 rounded-lg border border-yellow-100">
                                <strong>Próximos pasos:</strong>
                                <ul className="mt-1 space-y-1 list-disc list-inside">
                                    <li>Lleva el medicamento a la farmacia indicada</li>
                                    <li>Presenta el código de comprobante</li>
                                    <li>El beneficiario será notificado cuando esté listo</li>
                                </ul>
                            </div>

                            <DialogFooter>
                                <Button onClick={handleClose} className="w-full bg-gradient-to-r from-teal-600 to-teal-500">
                                    Entendido
                                </Button>
                            </DialogFooter>
                        </div>
                    ) : (
                        <>
                            <div className="space-y-4 py-4">
                                {/* Request info */}
                                <div className="p-4 bg-gradient-to-r from-teal-50 to-white rounded-lg border border-teal-100">
                                    <h4 className="font-semibold text-gray-900 mb-2">{name}</h4>
                                    <div className="text-sm text-gray-600 space-y-1">
                                        <p>
                                            <strong>Beneficiario:</strong> {requester}
                                        </p>
                                        {distance !== "N/A" && (
                                            <p>
                                                <strong>Distancia:</strong> {distance}
                                            </p>
                                        )}
                                        <p>
                                            <strong>Urgencia:</strong>{" "}
                                            <span className={`inline-block px-2 py-0.5 rounded text-xs ${getUrgencyColor(urgency)}`}>
                                                {urgency}
                                            </span>
                                        </p>
                                    </div>
                                </div>

                                {/* Pharmacy selection */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                        <Building2 className="h-4 w-4 text-teal-600" />
                                        Farmacia de entrega *
                                    </label>
                                    <Select
                                        value={selectedPharmacy}
                                        onValueChange={setSelectedPharmacy}
                                        disabled={isLoadingPharmacies}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder={isLoadingPharmacies ? "Cargando farmacias..." : "Selecciona una farmacia"} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {pharmacies.map((pharmacy) => (
                                                <SelectItem key={pharmacy.id} value={pharmacy.id}>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">{pharmacy.nombre}</span>
                                                        <span className="text-xs text-gray-500">{pharmacy.direccion}</span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {pharmacies.length === 0 && !isLoadingPharmacies && (
                                        <p className="text-xs text-red-500">No hay farmacias disponibles</p>
                                    )}
                                </div>

                                {motivo && (
                                    <div className="p-3 bg-gray-50 rounded-lg">
                                        <p className="text-sm text-gray-600">
                                            <strong>Motivo:</strong> {motivo}
                                        </p>
                                    </div>
                                )}

                                <div className="text-sm text-gray-500 bg-yellow-50 p-3 rounded-lg border border-yellow-100">
                                    <strong>Importante:</strong> Al confirmar, recibirás un código de comprobante.
                                    Deberás presentarlo en la farmacia seleccionada al entregar el medicamento.
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
                                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                                            Procesando...
                                        </>
                                    ) : (
                                        <>
                                            <Heart className="mr-2 h-4 w-4" />
                                            Confirmar Donación
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
