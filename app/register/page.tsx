"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Space_Grotesk } from "next/font/google";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  User,
  MapPin,
  Lock,
  ArrowRight,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  Phone,
  CreditCard,
} from "lucide-react";
import { MapView } from "@/components/map-view";
import { useToast } from "@/hooks/use-toast";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

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
          w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300
          ${
            isCompleted
              ? "bg-teal-600 text-white shadow-md shadow-teal-500/30"
              : isActive
                ? "bg-gradient-to-br from-teal-500 to-cyan-500 text-white scale-110 shadow-lg shadow-teal-500/30"
                : "bg-white/80 text-gray-400 border border-gray-100"
          }
        `}
      >
        {isCompleted ? (
          <CheckCircle2 className="w-5 h-5" />
        ) : (
          <Icon className="w-5 h-5" />
        )}
      </div>
      <span
        className={`text-xs font-medium transition-colors ${isActive ? "text-teal-700" : "text-gray-500"}`}
      >
        {title}
      </span>
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    cedulaType: "V",
    cedulaNumber: "",
    email: "",
    password: "",
    confirmPassword: "",
    hasLocation: false, // Internal check
    locationData: null as any, // Stores { lat, lng, address }
  });

  const nextStep = () => {
    if (currentStep < 3) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleLocationChange = async (pos: { lat: number; lng: number }) => {
    // Reverse geocode explicitly to ensure we have the address before submit
    let address = "";
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.lat}&lon=${pos.lng}`,
      );
      const data = await response.json();
      address = data.display_name || "";
    } catch (error) {
      console.error("Error fetching address:", error);
    }

    setFormData((prev) => ({
      ...prev,
      hasLocation: true,
      locationData: { ...pos, address },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Error",
        description: "Las contraseñas no coinciden",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        nombre: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        password: formData.password,
        telefono: formData.phone,
        cedula: `${formData.cedulaType}-${formData.cedulaNumber}`,
        // Send location as JSON object if set
        direccion: formData.hasLocation ? formData.locationData : undefined,
      };

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Error al registrarse");
      }

      toast({
        title: "¡Bienvenido!",
        description: "Tu cuenta ha sido creada exitosamente.",
      });

      // Redirect
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

  // Validation logic for buttons
  const isStep1Valid =
    formData.firstName.trim() !== "" &&
    formData.lastName.trim() !== "" &&
    formData.phone.trim() !== "" &&
    formData.cedulaNumber.trim() !== "";

  const isStep2Valid = formData.hasLocation;

  return (
    <div
      className={`${spaceGrotesk.className} relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-teal-50/40 to-white py-10 px-4 flex flex-col justify-center`}
    >
      <div className="pointer-events-none absolute -top-28 right-[-10%] h-72 w-72 rounded-full bg-gradient-to-br from-teal-200/50 to-cyan-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 left-[-10%] h-72 w-72 rounded-full bg-gradient-to-tr from-cyan-200/40 to-teal-100/60 blur-3xl" />
      <div className="pointer-events-none absolute top-16 left-1/2 h-36 w-36 -translate-x-1/2 rounded-full bg-gradient-to-tr from-teal-100/60 to-white/50 blur-2xl" />

      <div className="mx-auto w-full max-w-lg">
        {/* Logo/Brand */}
        <div className="mb-8 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-teal-600 to-cyan-500 shadow-lg shadow-teal-500/20 mb-4">
            <User className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-3xl font-semibold text-slate-900">
            Crear Nueva Cuenta
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Únete a una red de donaciones trazables y seguras.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white/70 shadow-2xl shadow-teal-500/10 overflow-hidden">
          {/* Steps Header */}
          <div className="bg-white/70 border-b border-white/60 px-8 py-4">
            <div className="flex justify-between items-center px-4">
              <StepIndicator
                step={1}
                currentStep={currentStep}
                title="Datos"
                icon={User}
              />
              <div
                className={`flex-1 h-0.5 mx-3 transition-colors duration-300 ${currentStep > 1 ? "bg-teal-500" : "bg-gray-200"}`}
              />
              <StepIndicator
                step={2}
                currentStep={currentStep}
                title="Ubicación"
                icon={MapPin}
              />
              <div
                className={`flex-1 h-0.5 mx-3 transition-colors duration-300 ${currentStep > 2 ? "bg-teal-500" : "bg-gray-200"}`}
              />
              <StepIndicator
                step={3}
                currentStep={currentStep}
                title="Cuenta"
                icon={Lock}
              />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-8">
            {/* Step 1: Personal Info */}
            {currentStep === 1 && (
              <div className="space-y-5 animate-in fade-in slide-in-from-right-8 duration-300">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-gray-700">
                      Nombre
                    </Label>
                    <Input
                      id="firstName"
                      placeholder="Juan"
                      required
                      value={formData.firstName}
                      onChange={(e) =>
                        setFormData({ ...formData, firstName: e.target.value })
                      }
                      className="h-11 rounded-xl border-gray-200 bg-white/90 focus-visible:ring-teal-500/40 focus-visible:ring-offset-0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-gray-700">
                      Apellido
                    </Label>
                    <Input
                      id="lastName"
                      placeholder="Pérez"
                      required
                      value={formData.lastName}
                      onChange={(e) =>
                        setFormData({ ...formData, lastName: e.target.value })
                      }
                      className="h-11 rounded-xl border-gray-200 bg-white/90 focus-visible:ring-teal-500/40 focus-visible:ring-offset-0"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-teal-600" />
                    Teléfono
                  </Label>
                  <Input
                    id="phone"
                    placeholder="0414-1234567"
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="h-11 rounded-xl border-gray-200 bg-white/90 focus-visible:ring-teal-500/40 focus-visible:ring-offset-0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cedula" className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-teal-600" />
                    Cédula de Identidad
                  </Label>
                  <div className="flex gap-2">
                    <Select
                      value={formData.cedulaType}
                      onValueChange={(val) =>
                        setFormData({ ...formData, cedulaType: val })
                      }
                    >
                      <SelectTrigger className="h-11 w-[80px] rounded-xl border-gray-200 bg-white/90 focus:border-teal-500 focus:ring-teal-500/20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="V">V-</SelectItem>
                        <SelectItem value="E">E-</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      id="cedula"
                      placeholder="12345678"
                      className="flex-1 h-11 rounded-xl border-gray-200 bg-white/90 focus-visible:ring-teal-500/40 focus-visible:ring-offset-0"
                      required
                      value={formData.cedulaNumber}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          cedulaNumber: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Location */}
            {currentStep === 2 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-8 duration-300">
                <div className="text-center space-y-2 mb-4">
                  <h3 className="font-semibold text-gray-800 flex items-center justify-center gap-2">
                    <MapPin className="w-5 h-5 text-teal-600" />
                    Selecciona tu ubicación
                  </h3>
                  <p className="text-sm text-gray-500 px-4">
                    Arrastra el marcador azul o usa el botón de geolocalización
                    para marcar donde vives.
                  </p>
                </div>

                <div className="h-[300px] w-full rounded-2xl overflow-hidden border border-teal-100/80 bg-white/70 shadow-lg shadow-teal-500/5 relative group">
                  <MapView
                    onUserLocationChange={handleLocationChange}
                    showUserMarker={true}
                  />
                  {!formData.hasLocation && (
                    <div className="absolute inset-x-0 bottom-4 text-center pointer-events-none z-[1001]">
                      <span className="bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-semibold text-teal-600 shadow-sm border border-teal-100">
                        Arrastra el marcador para confirmar
                      </span>
                    </div>
                  )}
                </div>

                {formData.hasLocation && (
                  <div className="bg-teal-50/70 border border-teal-100 rounded-xl p-3 flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-teal-800 uppercase tracking-wide">
                        Ubicación marcada
                      </p>
                      <p className="text-sm text-teal-700 mt-1 line-clamp-2">
                        {formData.locationData?.address ||
                          "Coordenadas capturadas"}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Account */}
            {currentStep === 3 && (
              <div className="space-y-5 animate-in fade-in slide-in-from-right-8 duration-300">
                <div className="space-y-2">
                  <Label htmlFor="email">Correo Electrónico</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="ejemplo@correo.com"
                    required
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="h-11 rounded-xl border-gray-200 bg-white/90 focus-visible:ring-teal-500/40 focus-visible:ring-offset-0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    minLength={8}
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="h-11 rounded-xl border-gray-200 bg-white/90 focus-visible:ring-teal-500/40 focus-visible:ring-offset-0"
                  />
                  <p className="text-xs text-gray-500">Mínimo 8 caracteres</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    required
                    minLength={8}
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        confirmPassword: e.target.value,
                      })
                    }
                    className="h-11 rounded-xl border-gray-200 bg-white/90 focus-visible:ring-teal-500/40 focus-visible:ring-offset-0"
                  />
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="mt-8 flex justify-between gap-3 pt-4 border-t border-gray-100">
              {currentStep > 1 ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={prevStep}
                  disabled={isLoading}
                  className="rounded-xl text-gray-500 hover:text-gray-900"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Atrás
                </Button>
              ) : (
                <div /> // Spacer
              )}

              {currentStep < 3 ? (
                <Button
                  type="button"
                  onClick={nextStep}
                  disabled={
                    (currentStep === 1 && !isStep1Valid) ||
                    (currentStep === 2 && !isStep2Valid)
                  }
                  className="rounded-xl bg-gradient-to-r from-teal-600 via-teal-500 to-cyan-500 hover:from-teal-700 hover:via-teal-600 hover:to-cyan-600 text-white min-w-[120px] shadow-lg shadow-teal-500/20"
                >
                  Siguiente
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="rounded-xl bg-gradient-to-r from-teal-600 via-teal-500 to-cyan-500 hover:from-teal-700 hover:via-teal-600 hover:to-cyan-600 text-white min-w-[140px] shadow-lg shadow-teal-500/20"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      Registrarse
                      <CheckCircle2 className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </form>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-sm text-gray-500">
          ¿Ya tienes una cuenta?{" "}
          <Link
            href="/login"
            className="font-semibold text-teal-600 hover:text-teal-500 hover:underline transition-all"
          >
            Iniciar Sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
