"use client";

import type React from "react";
import { useState, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { useToast } from "@/components/ui/use-toast";
import { Upload, X, AlertTriangle } from "lucide-react";
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

export function MedicationRequestForm({
  onSuccess,
  onCancel,
}: MedicationRequestFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
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
    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Formato no válido",
        description: "Por favor sube una imagen JPG, PNG o WebP",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: "Archivo muy grande",
        description: "El archivo debe ser menor a 5MB",
        variant: "destructive",
      });
      return;
    }

    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    setFormData({
      ...formData,
      recipePhotoFile: file,
      recipePhotoUrl: previewUrl,
    });
  };

  const handleDragOver = (e: React.DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLButtonElement>) => {
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

      // Upload photo if exists
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

      console.log("Sending request...");
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

      console.log("Response status:", response.status);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al enviar la solicitud");
      }

      const data = await response.json();
      console.log("Response data:", data);

      toast({
        title: "¡Solicitud enviada!",
        description:
          "Tu solicitud de medicamento ha sido registrada exitosamente.",
      });

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Solicitar Medicamento</CardTitle>
        <CardDescription>
          Completa el formulario para solicitar un medicamento que necesitas.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="medication">Nombre del Medicamento</Label>
            <Input
              id="medication"
              placeholder="Ej. Paracetamol 500mg"
              required
              value={formData.medication}
              onChange={(e) =>
                setFormData({ ...formData, medication: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">Cantidad</Label>
            <div className="flex items-center gap-2">
              <Input
                id="quantity"
                type="number"
                min="1"
                placeholder="Ej. 10"
                required
                value={formData.quantity}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    quantity: parseInt(e.target.value) || 1,
                  })
                }
              />
              <Select
                value={formData.unit}
                onValueChange={(value) =>
                  setFormData({ ...formData, unit: value })
                }
              >
                <SelectTrigger className="w-[180px]">
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

          <div className="space-y-2">
            <Label htmlFor="waitTime">Prioridad</Label>
            <Select
              value={formData.waitTime}
              onValueChange={(value) =>
                setFormData({ ...formData, waitTime: value })
              }
            >
              <SelectTrigger id="waitTime">
                <SelectValue placeholder="Selecciona prioridad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALTO">Alta (Urgente - 1/2 días)</SelectItem>
                <SelectItem value="MEDIO">Media (3/4 días)</SelectItem>
                <SelectItem value="BAJO">Baja (1 semana)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="prescription">¿Requiere Receta Médica?</Label>
            <Select
              value={formData.requiresPrescription ? "yes" : "no"}
              onValueChange={(value) =>
                setFormData({
                  ...formData,
                  requiresPrescription: value === "yes",
                })
              }
            >
              <SelectTrigger id="prescription">
                <SelectValue placeholder="Selecciona una opción" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Sí, tengo receta médica</SelectItem>
                <SelectItem value="no">No requiere receta</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.requiresPrescription && (
            <div className="space-y-2">
              <Label htmlFor="recipePhoto">Foto del Récipe Médico</Label>
              <p className="text-sm text-gray-500">
                Sube una foto clara de tu receta médica (JPG, PNG o WebP, máx.
                5MB)
              </p>
              <div className="flex flex-col gap-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  id="recipePhoto"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />
                {!formData.recipePhotoUrl ? (
                  <Button
                    type="button"
                    variant="outline"
                    className={`w-full h-32 border-dashed border-2 transition-all duration-200 ${
                      isDragging
                        ? "border-teal-500 bg-teal-50 scale-[1.02]"
                        : "hover:border-teal-500 hover:bg-teal-50"
                    }`}
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <div className="flex flex-col items-center gap-2 text-gray-500">
                      <Upload
                        className={`h-8 w-8 transition-transform ${
                          isDragging ? "scale-110 text-teal-600" : ""
                        }`}
                      />
                      <span
                        className={
                          isDragging ? "text-teal-600 font-medium" : ""
                        }
                      >
                        {isDragging
                          ? "Suelta la imagen aquí"
                          : "Arrastra o haz clic para subir foto"}
                      </span>
                    </div>
                  </Button>
                ) : (
                  <div className="relative rounded-lg overflow-hidden border">
                    <Image
                      src={formData.recipePhotoUrl}
                      alt="Vista previa del récipe"
                      width={400}
                      height={300}
                      className="w-full h-48 object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={handleRemovePhoto}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Warning message about physical recipe */}
              <Alert className="border-amber-500 bg-amber-50">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800 font-medium">
                  Recuerda: Debes presentar el récipe físico en buen estado al
                  momento del retiro.
                </AlertDescription>
              </Alert>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              placeholder="Describe tu situación y por qué necesitas este medicamento"
              rows={4}
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Tu Ubicación</Label>
            <p className="text-sm text-gray-500 mb-2">
              Selecciona tu ubicación en el mapa. Tu dirección exacta no será
              visible públicamente.
            </p>
            <div className="h-[300px] rounded-md overflow-hidden border">
              <MapView />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" type="button" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button
            type="submit"
            className="bg-teal-600 hover:bg-teal-700"
            disabled={isLoading || isUploading}
          >
            {isUploading
              ? "Subiendo foto..."
              : isLoading
                ? "Enviando solicitud..."
                : "Enviar Solicitud"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
