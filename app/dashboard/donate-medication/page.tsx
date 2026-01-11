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
import { Calendar } from "lucide-react";
import { MapView } from "@/components/map-view";
import { useToast } from "@/components/ui/use-toast";

export default function DonateMedicationPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const [location, setLocation] = useState<
    { lat: number; lng: number } | undefined
  >(undefined);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      medication: formData.get("medication"),
      quantity: Number(formData.get("quantity")),
      unit: formData.get("unit"),
      expiration: formData.get("expiration"),
      condition: formData.get("condition"),
      prescription: formData.get("prescription"), // "yes" or "no"
      description: formData.get("description"),
      availability: formData.get("availability"),
      location: location,
    };

    try {
      const response = await fetch("/api/donations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Error al registrar la donación");
      }

      toast({
        title: "¡Donación registrada!",
        description: "Tu medicamento ha sido registrado exitosamente.",
        variant: "default",
      });

      // Optional: Redirect or reset form
      // router.push("/dashboard");
      // e.currentTarget.reset(); // Reset form
      setTimeout(() => router.push("/dashboard"), 1500);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <Card className="border-0 shadow-xl shadow-gray-200/50">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-white">
          <CardTitle>Donar Medicamento</CardTitle>
          <CardDescription>
            Completa el formulario para ofrecer un medicamento en donación.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="medication">Nombre del Medicamento</Label>
              <Input
                id="medication"
                name="medication"
                placeholder="Ej. Paracetamol 500mg"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Cantidad</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="quantity"
                  name="quantity"
                  type="number"
                  min="1"
                  placeholder="Ej. 10"
                  required
                />
                <Select name="unit" defaultValue="tablets">
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
              <Label htmlFor="expiration">Fecha de Vencimiento</Label>
              <div className="flex items-center gap-2">
                <Input id="expiration" name="expiration" type="date" required />
                <Button variant="outline" size="icon" type="button">
                  <Calendar className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="condition">Estado del Medicamento</Label>
              <Select name="condition" defaultValue="sealed">
                <SelectTrigger id="condition">
                  <SelectValue placeholder="Selecciona el estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sealed">Sellado (sin abrir)</SelectItem>
                  <SelectItem value="opened">
                    Abierto (en buen estado)
                  </SelectItem>
                  <SelectItem value="partial">Parcialmente usado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="prescription">¿Requiere Receta Médica?</Label>
              <Select name="prescription" defaultValue="no">
                <SelectTrigger id="prescription">
                  <SelectValue placeholder="Selecciona una opción" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Sí, requiere receta</SelectItem>
                  <SelectItem value="no">No requiere receta</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Describe el medicamento, su uso y cualquier otra información relevante"
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label>Tu Ubicación</Label>
              <p className="text-sm text-gray-500 mb-2">
                Tu dirección exacta no será visible públicamente, solo la zona
                general.
              </p>
              <div className="h-[300px] rounded-md overflow-hidden border">
                <MapView onPositionChange={setLocation} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="availability">Disponibilidad para Entrega</Label>
              <Select name="availability" defaultValue="flexible">
                <SelectTrigger id="availability">
                  <SelectValue placeholder="Selecciona tu disponibilidad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="flexible">Horario flexible</SelectItem>
                  <SelectItem value="morning">Mañanas (8am - 12pm)</SelectItem>
                  <SelectItem value="afternoon">Tardes (12pm - 6pm)</SelectItem>
                  <SelectItem value="evening">Noches (6pm - 10pm)</SelectItem>
                  <SelectItem value="weekend">Solo fines de semana</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              type="button"
              onClick={() => router.push("/dashboard")}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-teal-600 hover:bg-teal-700"
              disabled={isLoading}
            >
              {isLoading ? "Registrando donación..." : "Registrar Donación"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
