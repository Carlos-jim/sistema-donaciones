"use client";

import type React from "react";
import { useState } from "react";
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

interface MedicationRequestFormData {
  medication: string;
  quantity: number;
  unit: string;
  requiresPrescription: boolean;
  description: string;
  latitude: number | null;
  longitude: number | null;
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
  const [formData, setFormData] = useState<MedicationRequestFormData>({
    medication: "",
    quantity: 1,
    unit: "tablets",
    requiresPrescription: false,
    description: "",
    latitude: null,
    longitude: null,
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
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
            disabled={isLoading}
          >
            {isLoading ? "Enviando solicitud..." : "Enviar Solicitud"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
