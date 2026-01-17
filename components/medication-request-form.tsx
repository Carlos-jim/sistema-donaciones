"use client";

import type React from "react";
import { useState, useRef } from "react";
import Image from "next/image";
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
  Upload,
  X,
  AlertTriangle,
  Pill,
  Clock,
  FileText,
  MapPin,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface MedicationRequestFormData {
  medication: string;
  quantity: number;
  unit: string;
  requiresPrescription: boolean;
  description: string;
  latitude: number | null;
  longitude: number | null;
  waitTime: string;
  recipePhotoUrl: string | null;
  recipePhotoFile: File | null;
}

interface MedicationRequestFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
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
              ? "bg-teal-600 text-white shadow-lg shadow-teal-200"
              : isActive
                ? "bg-gradient-to-br from-teal-500 to-teal-600 text-white shadow-lg shadow-teal-200 scale-110"
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

export function MedicationRequestForm({
  onSuccess,
  onCancel,
}: MedicationRequestFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<MedicationRequestFormData>({
    medication: "",
    quantity: 1,
    unit: "tablets",
    requiresPrescription: false,
    description: "",
    latitude: null,
    longitude: null,
    waitTime: "MEDIO",
    recipePhotoUrl: null,
    recipePhotoFile: null,
  });

  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const processFile = (file: File) => {
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Formato no válido",
        description: "Por favor sube una imagen JPG, PNG o WebP",
        variant: "destructive",
      });
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: "Archivo muy grande",
        description: "El archivo debe ser menor a 5MB",
        variant: "destructive",
      });
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setFormData({
      ...formData,
      recipePhotoFile: file,
      recipePhotoUrl: previewUrl,
    });
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleRemovePhoto = () => {
    if (formData.recipePhotoUrl) {
      URL.revokeObjectURL(formData.recipePhotoUrl);
    }
    setFormData({ ...formData, recipePhotoFile: null, recipePhotoUrl: null });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let uploadedPhotoUrl: string | null = null;

      if (formData.recipePhotoFile) {
        setIsUploading(true);
        const uploadFormData = new FormData();
        uploadFormData.append("file", formData.recipePhotoFile);

        const uploadResponse = await fetch("/api/upload/recipe", {
          method: "POST",
          body: uploadFormData,
        });

        if (!uploadResponse.ok) {
          const uploadError = await uploadResponse.json();
          throw new Error(uploadError.error || "Error al subir la foto");
        }

        const uploadResult = await uploadResponse.json();
        uploadedPhotoUrl = uploadResult.url;
        setIsUploading(false);
      }

      const response = await fetch("/api/requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          motivo: formData.description,
          medicamentos: [
            {
              nombre: formData.medication,
              cantidad: formData.quantity,
              unidad: formData.unit,
            },
          ],
          ubicacion: {
            lat: formData.latitude,
            lng: formData.longitude,
          },
          requiereReceta: formData.requiresPrescription,
          tiempoEspera: formData.waitTime,
          recipePhotoUrl: uploadedPhotoUrl,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al enviar la solicitud");
      }

      toast({
        title: "¡Solicitud enviada!",
        description:
          "Tu solicitud de medicamento ha sido registrada exitosamente.",
      });

      // Reset form
      if (formData.recipePhotoUrl) {
        URL.revokeObjectURL(formData.recipePhotoUrl);
      }
      setFormData({
        medication: "",
        quantity: 1,
        unit: "tablets",
        requiresPrescription: false,
        description: "",
        latitude: null,
        longitude: null,
        waitTime: "MEDIO",
        recipePhotoUrl: null,
        recipePhotoFile: null,
      });
      setCurrentStep(1);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      setIsLoading(false);

      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error("Error:", err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Error desconocido",
        variant: "destructive",
      });
      setIsLoading(false);
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      router.push("/dashboard");
    }
  };

  const canProceedToStep2 = formData.medication.trim() !== "";
  const canProceedToStep3 = formData.description.trim() !== "" || true; // Description is optional

  const nextStep = () => {
    if (currentStep < 3) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  return (
    <div className="relative">
      {/* Background decoration */}
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-gradient-to-br from-teal-100 to-teal-50 rounded-full blur-3xl opacity-60 pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-gradient-to-tr from-teal-50 to-cyan-50 rounded-full blur-3xl opacity-60 pointer-events-none" />

      <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl border border-gray-200 overflow-hidden">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-teal-600 via-teal-500 to-cyan-500 px-8 py-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <Pill className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">
                Solicitar Medicamento
              </h1>
              <p className="text-teal-100 text-sm mt-1">
                Completa el formulario para recibir ayuda
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
              icon={FileText}
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
                      setFormData({ ...formData, medication: e.target.value })
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

                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-teal-600" />
                    Prioridad
                  </Label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, waitTime: "ALTO" })
                      }
                      className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                        formData.waitTime === "ALTO"
                          ? "border-red-500 bg-red-50"
                          : "border-gray-200 hover:border-gray-300 bg-white"
                      }`}
                    >
                      <div
                        className={`font-semibold ${formData.waitTime === "ALTO" ? "text-red-700" : "text-gray-700"}`}
                      >
                        Alta
                      </div>
                      <div className="text-xs text-gray-500 mt-1">1-2 días</div>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, waitTime: "MEDIO" })
                      }
                      className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                        formData.waitTime === "MEDIO"
                          ? "border-amber-500 bg-amber-50"
                          : "border-gray-200 hover:border-gray-300 bg-white"
                      }`}
                    >
                      <div
                        className={`font-semibold ${formData.waitTime === "MEDIO" ? "text-amber-700" : "text-gray-700"}`}
                      >
                        Media
                      </div>
                      <div className="text-xs text-gray-500 mt-1">3-4 días</div>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, waitTime: "BAJO" })
                      }
                      className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                        formData.waitTime === "BAJO"
                          ? "border-green-500 bg-green-50"
                          : "border-gray-200 hover:border-gray-300 bg-white"
                      }`}
                    >
                      <div
                        className={`font-semibold ${formData.waitTime === "BAJO" ? "text-green-700" : "text-gray-700"}`}
                      >
                        Baja
                      </div>
                      <div className="text-xs text-gray-500 mt-1">1 semana</div>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Details */}
            {currentStep === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="space-y-3">
                  <Label
                    htmlFor="prescription"
                    className="text-sm font-semibold text-gray-700 flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4 text-teal-600" />
                    ¿Requiere Receta Médica?
                  </Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, requiresPrescription: true })
                      }
                      className={`
                        p-4 rounded-xl border-2 transition-all duration-200 text-center
                        ${
                          formData.requiresPrescription
                            ? "border-teal-500 bg-teal-50 shadow-lg shadow-teal-100"
                            : "border-gray-200 hover:border-gray-300 bg-white"
                        }
                      `}
                    >
                      <div
                        className={`font-semibold ${formData.requiresPrescription ? "text-teal-700" : "text-gray-700"}`}
                      >
                        Sí, tengo receta
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          requiresPrescription: false,
                        })
                      }
                      className={`
                        p-4 rounded-xl border-2 transition-all duration-200 text-center
                        ${
                          !formData.requiresPrescription
                            ? "border-teal-500 bg-teal-50 shadow-lg shadow-teal-100"
                            : "border-gray-200 hover:border-gray-300 bg-white"
                        }
                      `}
                    >
                      <div
                        className={`font-semibold ${!formData.requiresPrescription ? "text-teal-700" : "text-gray-700"}`}
                      >
                        No requiere receta
                      </div>
                    </button>
                  </div>
                </div>

                {formData.requiresPrescription && (
                  <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <Label className="text-sm font-semibold text-gray-700">
                      Foto del Récipe Médico
                    </Label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      id="recipePhoto"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    {!formData.recipePhotoUrl ? (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`
                          w-full h-40 border-2 border-dashed rounded-2xl transition-all duration-200 cursor-pointer
                          flex flex-col items-center justify-center gap-3
                          ${
                            isDragging
                              ? "border-teal-500 bg-teal-50 scale-[1.02]"
                              : "border-gray-300 hover:border-teal-500 hover:bg-teal-50/50"
                          }
                        `}
                      >
                        <div
                          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isDragging ? "bg-teal-100" : "bg-gray-100"}`}
                        >
                          <Upload
                            className={`w-6 h-6 ${isDragging ? "text-teal-600" : "text-gray-400"}`}
                          />
                        </div>
                        <div className="text-center">
                          <p
                            className={`font-medium ${isDragging ? "text-teal-600" : "text-gray-600"}`}
                          >
                            {isDragging
                              ? "Suelta la imagen aquí"
                              : "Arrastra o haz clic para subir"}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            JPG, PNG o WebP (máx. 5MB)
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="relative rounded-2xl overflow-hidden border-2 border-teal-200 shadow-lg">
                        <Image
                          src={formData.recipePhotoUrl}
                          alt="Vista previa del récipe"
                          width={400}
                          height={200}
                          className="w-full h-48 object-cover"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-3 right-3 rounded-full shadow-lg"
                          onClick={handleRemovePhoto}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}

                    <Alert className="border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      <AlertDescription className="text-amber-800 font-medium text-sm">
                        Recuerda: Debes presentar el récipe físico al momento
                        del retiro.
                      </AlertDescription>
                    </Alert>
                  </div>
                )}

                <div className="space-y-3">
                  <Label
                    htmlFor="description"
                    className="text-sm font-semibold text-gray-700"
                  >
                    Descripción (opcional)
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Cuéntanos brevemente tu situación y por qué necesitas este medicamento..."
                    rows={4}
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
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
                    Selecciona tu ubicación aproximada. Tu dirección exacta no
                    será visible públicamente.
                  </p>
                </div>
                <div className="h-[280px] rounded-2xl overflow-hidden border-2 border-gray-200 shadow-inner">
                  <MapView />
                </div>

                {/* Summary card */}
                <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-2xl p-5 border border-teal-100">
                  <h3 className="font-semibold text-teal-800 mb-3 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    Resumen de tu solicitud
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
                      <span className="text-gray-500">Prioridad:</span>
                      <p className="font-medium text-gray-800">
                        {formData.waitTime === "ALTO"
                          ? "Alta"
                          : formData.waitTime === "MEDIO"
                            ? "Media"
                            : "Baja"}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">Receta:</span>
                      <p className="font-medium text-gray-800">
                        {formData.requiresPrescription ? "Sí" : "No"}
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
                className="bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white px-8 rounded-xl shadow-lg shadow-teal-200 transition-all hover:shadow-xl hover:shadow-teal-200"
              >
                Siguiente →
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={isLoading || isUploading}
                className="bg-gradient-to-r from-teal-600 to-cyan-500 hover:from-teal-700 hover:to-cyan-600 text-white px-8 rounded-xl shadow-lg shadow-teal-200 transition-all hover:shadow-xl hover:shadow-teal-200 disabled:opacity-70"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Subiendo foto...
                  </>
                ) : isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Enviar Solicitud
                  </>
                )}
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
