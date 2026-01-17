"use client";

import type React from "react";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MapView } from "@/components/map-view";
import { useToast } from "@/hooks/use-toast";
import {
  Gift,
  Pill,
  Calendar,
  MapPin,
  CheckCircle2,
  Loader2,
  Package,
  Clock,
  Camera,
} from "lucide-react";
import { RecipeUpload } from "@/components/recipe-upload";

interface DonationFormData {
  medication: string;
  quantity: number;
  unit: string;
  expirationDate: string;
  batchNumber: string;
  condition: string;
  description: string;
  latitude: number | null;
  longitude: number | null;
  availability: string;
  requiresPrescription: boolean;
  donationPhotoUrl: string;
}

// Step indicator component
function StepIndicator({
  step,
  currentStep,
  title,
  icon: Icon,
}: {
  step: number;
  currentStep: number;
  title: string;
  icon: React.ElementType;
}) {
  const isActive = currentStep === step;
  const isCompleted = currentStep > step;

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={`
          w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300
          ${
            isCompleted
              ? "bg-teal-600 text-white"
              : isActive
                ? "bg-gradient-to-br from-teal-500 to-teal-600 text-white scale-110"
                : "bg-gray-100 text-gray-400"
          }
        `}
      >
        {isCompleted ? (
          <CheckCircle2 className="w-6 h-6" />
        ) : (
          <Icon className="w-5 h-5" />
        )}
      </div>
      <span
        className={`text-xs font-medium transition-colors ${isActive ? "text-teal-600" : "text-gray-500"}`}
      >
        {title}
      </span>
    </div>
  );
}

export default function DonateMedicationPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const [formData, setFormData] = useState<DonationFormData>({
    medication: "",
    quantity: 1,
    unit: "tablets",
    expirationDate: "",
    batchNumber: "",
    condition: "sealed",
    description: "",
    latitude: null,
    longitude: null,
    availability: "flexible",
    requiresPrescription: false,
    donationPhotoUrl: "",
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log("Enviando datos de donación:", formData);
      const payload = {
        medication: formData.medication,
        quantity: formData.quantity,
        unit: formData.unit,
        expiration: formData.expirationDate,
        lote: formData.batchNumber, // Nota: el API espera 'lote' o 'batchNumber'? Revisar schema.
        condition: formData.condition,
        prescription: formData.requiresPrescription ? "yes" : "no",
        description: formData.description,
        location:
          formData.latitude && formData.longitude
            ? { lat: formData.latitude, lng: formData.longitude }
            : undefined,
        availability: formData.availability,
        donationPhotoUrl: formData.donationPhotoUrl,
      };
      console.log("Payload enviado:", payload);

      const response = await fetch("/api/donations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error("Error del servidor:", result);
        throw new Error(result.error || "Error al registrar la donación");
      }

      toast({
        title: "¡Donación registrada!",
        description: "Tu medicamento ha sido registrado exitosamente.",
      });

      // Reset form
      setFormData({
        medication: "",
        quantity: 1,
        unit: "tablets",
        expirationDate: "",
        batchNumber: "",
        condition: "sealed",
        description: "",
        latitude: null,
        longitude: null,
        availability: "flexible",
        requiresPrescription: false,
        donationPhotoUrl: "",
      });
      setCurrentStep(1);

      setTimeout(() => router.push("/dashboard"), 1500);
    } catch (error: unknown) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.push("/dashboard");
  };

  const canProceedToStep2 =
    formData.medication.trim() !== "" && formData.expirationDate !== "";

  const nextStep = () => {
    if (currentStep < 3) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  // Get minimum date for expiration (today)
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-teal-50/30 py-8 px-4">
      <div className="mx-auto max-w-2xl">
        <div className="relative">
          {/* Background decoration */}
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-gradient-to-br from-teal-100 to-teal-50 rounded-full blur-3xl opacity-60 pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-gradient-to-tr from-teal-50 to-cyan-50 rounded-full blur-3xl opacity-60 pointer-events-none" />

          <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl border border-gray-200 overflow-hidden">
            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-teal-600 via-teal-500 to-cyan-500 px-8 py-8">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <Gift className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">
                    Donar Medicamento
                  </h1>
                  <p className="text-teal-100 text-sm mt-1">
                    Ayuda a quienes más lo necesitan
                  </p>
                </div>
              </div>
            </div>

            {/* Step indicators */}
            <div className="px-8 py-6 bg-gradient-to-b from-gray-50/80 to-white border-b border-gray-100">
              <div className="flex justify-between items-center max-w-md mx-auto">
                <StepIndicator
                  step={1}
                  currentStep={currentStep}
                  title="Medicamento"
                  icon={Pill}
                />
                <div
                  className={`flex-1 h-1 mx-2 rounded-full transition-colors ${currentStep > 1 ? "bg-teal-500" : "bg-gray-200"}`}
                />
                <StepIndicator
                  step={2}
                  currentStep={currentStep}
                  title="Detalles"
                  icon={Package}
                />
                <div
                  className={`flex-1 h-1 mx-2 rounded-full transition-colors ${currentStep > 2 ? "bg-teal-500" : "bg-gray-200"}`}
                />
                <StepIndicator
                  step={3}
                  currentStep={currentStep}
                  title="Ubicación"
                  icon={MapPin}
                />
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="px-8 py-6 min-h-[400px]">
                {/* Step 1: Medication Info */}
                {currentStep === 1 && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="space-y-3">
                      <Label
                        htmlFor="medication"
                        className="text-sm font-semibold text-gray-700 flex items-center gap-2"
                      >
                        <Pill className="w-4 h-4 text-teal-600" />
                        Nombre del Medicamento
                      </Label>
                      <Input
                        id="medication"
                        placeholder="Ej. Paracetamol 500mg"
                        required
                        value={formData.medication}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            medication: e.target.value,
                          })
                        }
                        className="h-12 rounded-xl border-gray-200 focus:border-teal-500 focus:ring-teal-500/20 transition-all"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <Label
                          htmlFor="quantity"
                          className="text-sm font-semibold text-gray-700"
                        >
                          Cantidad
                        </Label>
                        <Input
                          id="quantity"
                          type="number"
                          min="1"
                          placeholder="10"
                          required
                          value={formData.quantity}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              quantity: parseInt(e.target.value) || 1,
                            })
                          }
                          className="h-12 rounded-xl border-gray-200 focus:border-teal-500 focus:ring-teal-500/20"
                        />
                      </div>
                      <div className="space-y-3">
                        <Label className="text-sm font-semibold text-gray-700">
                          Unidad
                        </Label>
                        <Select
                          value={formData.unit}
                          onValueChange={(value) =>
                            setFormData({ ...formData, unit: value })
                          }
                        >
                          <SelectTrigger className="h-12 rounded-xl border-gray-200 focus:border-teal-500 focus:ring-teal-500/20">
                            <SelectValue placeholder="Unidad" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="tablets">Tabletas</SelectItem>
                            <SelectItem value="capsules">Cápsulas</SelectItem>
                            <SelectItem value="ml">ml</SelectItem>
                            <SelectItem value="units">Unidades</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <Label
                          htmlFor="expiration"
                          className="text-sm font-semibold text-gray-700 flex items-center gap-2"
                        >
                          <Calendar className="w-4 h-4 text-teal-600" />
                          Fecha de Vencimiento
                        </Label>
                        <Input
                          id="expiration"
                          type="date"
                          min={today}
                          required
                          value={formData.expirationDate}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              expirationDate: e.target.value,
                            })
                          }
                          className="h-12 rounded-xl border-gray-200 focus:border-teal-500 focus:ring-teal-500/20"
                        />
                      </div>
                      <div className="space-y-3">
                        <Label
                          htmlFor="batch"
                          className="text-sm font-semibold text-gray-700"
                        >
                          Número de Lote (opcional)
                        </Label>
                        <Input
                          id="batch"
                          placeholder="Ej. LOT123456"
                          value={formData.batchNumber}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              batchNumber: e.target.value,
                            })
                          }
                          className="h-12 rounded-xl border-gray-200 focus:border-teal-500 focus:ring-teal-500/20"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Condition & Details */}
                {currentStep === 2 && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="space-y-3">
                      <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <Package className="w-4 h-4 text-teal-600" />
                        Estado del Medicamento
                      </Label>
                      <div className="grid grid-cols-3 gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            setFormData({ ...formData, condition: "sealed" })
                          }
                          className={`p-4 rounded-xl border-2 transition-all duration-200 text-center ${
                            formData.condition === "sealed"
                              ? "border-teal-500 bg-teal-50"
                              : "border-gray-200 hover:border-gray-300 bg-white"
                          }`}
                        >
                          <div
                            className={`font-semibold text-sm ${formData.condition === "sealed" ? "text-teal-700" : "text-gray-700"}`}
                          >
                            Sellado
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Sin abrir
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setFormData({ ...formData, condition: "opened" })
                          }
                          className={`p-4 rounded-xl border-2 transition-all duration-200 text-center ${
                            formData.condition === "opened"
                              ? "border-amber-500 bg-amber-50"
                              : "border-gray-200 hover:border-gray-300 bg-white"
                          }`}
                        >
                          <div
                            className={`font-semibold text-sm ${formData.condition === "opened" ? "text-amber-700" : "text-gray-700"}`}
                          >
                            Abierto
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Buen estado
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setFormData({ ...formData, condition: "partial" })
                          }
                          className={`p-4 rounded-xl border-2 transition-all duration-200 text-center ${
                            formData.condition === "partial"
                              ? "border-orange-500 bg-orange-50"
                              : "border-gray-200 hover:border-gray-300 bg-white"
                          }`}
                        >
                          <div
                            className={`font-semibold text-sm ${formData.condition === "partial" ? "text-orange-700" : "text-gray-700"}`}
                          >
                            Parcial
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Usado
                          </div>
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <Camera className="w-4 h-4 text-teal-600" />
                        Foto del Medicamento (opcional)
                      </Label>
                      <RecipeUpload
                        label="Sube una foto del medicamento"
                        currentImageUrl={formData.donationPhotoUrl}
                        onUploadComplete={(url) =>
                          setFormData({ ...formData, donationPhotoUrl: url })
                        }
                      />
                    </div>

                    <div className="space-y-3">
                      <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-teal-600" />
                        Disponibilidad para Entrega
                      </Label>
                      <Select
                        value={formData.availability}
                        onValueChange={(value) =>
                          setFormData({ ...formData, availability: value })
                        }
                      >
                        <SelectTrigger className="h-12 rounded-xl border-gray-200 focus:border-teal-500 focus:ring-teal-500/20">
                          <SelectValue placeholder="Selecciona tu disponibilidad" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="flexible">
                            Horario flexible
                          </SelectItem>
                          <SelectItem value="morning">
                            Mañanas (8am - 12pm)
                          </SelectItem>
                          <SelectItem value="afternoon">
                            Tardes (12pm - 6pm)
                          </SelectItem>
                          <SelectItem value="evening">
                            Noches (6pm - 10pm)
                          </SelectItem>
                          <SelectItem value="weekend">
                            Solo fines de semana
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <Pill className="w-4 h-4 text-teal-600" />
                        ¿Requiere Receta Médica?
                      </Label>
                      <div className="flex gap-4">
                        <button
                          type="button"
                          onClick={() =>
                            setFormData({
                              ...formData,
                              requiresPrescription: true,
                            })
                          }
                          className={`flex-1 p-3 rounded-xl border-2 transition-all duration-200 text-center ${
                            formData.requiresPrescription
                              ? "border-teal-500 bg-teal-50 text-teal-700"
                              : "border-gray-200 hover:border-gray-300 bg-white text-gray-700"
                          }`}
                        >
                          Sí, requiere receta
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setFormData({
                              ...formData,
                              requiresPrescription: false,
                            })
                          }
                          className={`flex-1 p-3 rounded-xl border-2 transition-all duration-200 text-center ${
                            !formData.requiresPrescription
                              ? "border-teal-500 bg-teal-50 text-teal-700"
                              : "border-gray-200 hover:border-gray-300 bg-white text-gray-700"
                          }`}
                        >
                          No requiere receta
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label
                        htmlFor="description"
                        className="text-sm font-semibold text-gray-700"
                      >
                        Descripción (opcional)
                      </Label>
                      <Textarea
                        id="description"
                        placeholder="Información adicional sobre el medicamento, instrucciones de uso, etc."
                        rows={4}
                        value={formData.description}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            description: e.target.value,
                          })
                        }
                        className="rounded-xl border-gray-200 focus:border-teal-500 focus:ring-teal-500/20 resize-none"
                      />
                    </div>
                  </div>
                )}

                {/* Step 3: Location */}
                {currentStep === 3 && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-teal-600" />
                        Tu Ubicación
                      </Label>
                      <p className="text-sm text-gray-500">
                        Tu dirección exacta no será visible, solo la zona
                        general.
                      </p>
                    </div>
                    <div className="h-[280px] rounded-2xl overflow-hidden border-2 border-gray-200 shadow-inner">
                      <MapView
                        onUserLocationChange={(pos) =>
                          setFormData({
                            ...formData,
                            latitude: pos.lat,
                            longitude: pos.lng,
                          })
                        }
                      />
                    </div>

                    {/* Summary card */}
                    <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-2xl p-5 border border-teal-100">
                      <h3 className="font-semibold text-teal-800 mb-3 flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5" />
                        Resumen de tu donación
                      </h3>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-gray-500">Medicamento:</span>
                          <p className="font-medium text-gray-800">
                            {formData.medication || "-"}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500">Cantidad:</span>
                          <p className="font-medium text-gray-800">
                            {formData.quantity}{" "}
                            {formData.unit === "tablets"
                              ? "tabletas"
                              : formData.unit === "capsules"
                                ? "cápsulas"
                                : formData.unit}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500">Vencimiento:</span>
                          <p className="font-medium text-gray-800">
                            {formData.expirationDate
                              ? new Date(
                                  formData.expirationDate,
                                ).toLocaleDateString("es-ES")
                              : "-"}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500">Estado:</span>
                          <p className="font-medium text-gray-800">
                            {formData.condition === "sealed"
                              ? "Sellado"
                              : formData.condition === "opened"
                                ? "Abierto"
                                : "Parcial"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer with navigation */}
              <div className="px-8 py-5 bg-gray-50/80 border-t border-gray-100 flex justify-between items-center">
                {currentStep === 1 ? (
                  <Button
                    variant="ghost"
                    type="button"
                    onClick={handleCancel}
                    className="text-gray-600 hover:text-gray-800"
                  >
                    Cancelar
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    type="button"
                    onClick={prevStep}
                    className="text-gray-600 hover:text-gray-800"
                  >
                    ← Anterior
                  </Button>
                )}

                {currentStep < 3 ? (
                  <Button
                    type="button"
                    onClick={nextStep}
                    disabled={currentStep === 1 && !canProceedToStep2}
                    className="bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white px-8 rounded-xl transition-all"
                  >
                    Siguiente →
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="bg-gradient-to-r from-teal-600 to-cyan-500 hover:from-teal-700 hover:to-cyan-600 text-white px-8 rounded-xl transition-all disabled:opacity-70"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Registrando...
                      </>
                    ) : (
                      <>
                        <Gift className="w-4 h-4 mr-2" />
                        Registrar Donación
                      </>
                    )}
                  </Button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
