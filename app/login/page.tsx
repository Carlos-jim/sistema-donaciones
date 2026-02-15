"use client";

import type React from "react";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Space_Grotesk } from "next/font/google";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Bell, Building2, Heart, ShieldCheck } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || "Error al iniciar sesión");
        return;
      }

      toast({
        title: "¡Bienvenido!",
        description: "Has iniciado sesión exitosamente.",
      });

      // Redirigir al callbackUrl o al dashboard
      router.push(callbackUrl);
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={`${spaceGrotesk.className} relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-teal-50/40 to-white`}
    >
      <div className="pointer-events-none absolute -top-32 right-[-10%] h-72 w-72 rounded-full bg-gradient-to-br from-teal-200/50 to-cyan-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 left-[-10%] h-72 w-72 rounded-full bg-gradient-to-tr from-cyan-200/40 to-teal-100/60 blur-3xl" />
      <div className="pointer-events-none absolute top-20 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-gradient-to-tr from-teal-100/60 to-white/40 blur-2xl" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl items-center px-6 py-12 lg:px-10">
        <div className="grid w-full items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="order-2 space-y-6 lg:order-1">
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-100 bg-white/80 px-3 py-1 text-xs font-medium text-teal-700 shadow-sm">
              <Heart className="h-3.5 w-3.5" />
              MediShareNE
            </div>
            <div className="space-y-4">
              <h1 className="text-3xl font-semibold leading-tight text-slate-900 md:text-4xl">
                Conecta donantes, farmacias y beneficiarios con un acceso seguro.
              </h1>
              <p className="text-base text-slate-600 md:text-lg">
                Gestiona entregas con trazabilidad, notificaciones en tiempo real y
                un flujo claro para cada donación.
              </p>
            </div>
            <ul className="space-y-4 text-sm text-slate-600">
              <li className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full bg-teal-100 text-teal-700">
                  <ShieldCheck className="h-4 w-4" />
                </span>
                <div>
                  <p className="font-medium text-slate-900">Trazabilidad verificada</p>
                  <p className="text-slate-500">
                    Cada entrega queda registrada y validada por farmacia.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full bg-cyan-100 text-cyan-700">
                  <Building2 className="h-4 w-4" />
                </span>
                <div>
                  <p className="font-medium text-slate-900">Red de farmacias</p>
                  <p className="text-slate-500">
                    Entregas centralizadas para un retiro seguro y ordenado.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full bg-teal-50 text-teal-700">
                  <Bell className="h-4 w-4" />
                </span>
                <div>
                  <p className="font-medium text-slate-900">Alertas oportunas</p>
                  <p className="text-slate-500">
                    Recibe recordatorios para entregar y retirar a tiempo.
                  </p>
                </div>
              </li>
            </ul>
            <div className="rounded-2xl border border-white/70 bg-white/70 p-4 text-sm text-slate-600 shadow-lg shadow-teal-500/5 backdrop-blur">
              Un acceso, múltiples impactos. Cada login habilita una cadena de ayuda
              que llega a quien más lo necesita.
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <div className="rounded-3xl border border-white/60 bg-white/80 p-8 shadow-2xl shadow-teal-500/10 backdrop-blur-xl">
              <div className="space-y-2 text-center">
                <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-teal-600 to-cyan-500 shadow-lg shadow-teal-500/20">
                  <Heart className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-2xl font-semibold text-slate-900">
                  Iniciar Sesión
                </h2>
                <p className="text-sm text-slate-500">
                  Accede para continuar con tus donaciones y solicitudes.
                </p>
              </div>

              <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50/80 p-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm text-slate-700">
                    Correo Electrónico
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="h-11 rounded-xl border-gray-200 bg-white/90 focus-visible:ring-teal-500/40 focus-visible:ring-offset-0"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-sm text-slate-700">
                      Contraseña
                    </Label>
                    <Link
                      href="/forgot-password"
                      className="text-xs font-medium text-teal-600 hover:text-teal-500"
                    >
                      ¿Olvidaste tu contraseña?
                    </Link>
                  </div>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    className="h-11 rounded-xl border-gray-200 bg-white/90 focus-visible:ring-teal-500/40 focus-visible:ring-offset-0"
                  />
                </div>

                <Button
                  type="submit"
                  className="h-11 w-full rounded-xl bg-gradient-to-r from-teal-600 via-teal-500 to-cyan-500 text-white shadow-lg shadow-teal-500/20 hover:from-teal-700 hover:via-teal-600 hover:to-cyan-600"
                  disabled={isLoading}
                >
                  {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
                </Button>
              </form>

              <p className="mt-6 text-center text-sm text-slate-500">
                ¿No tienes una cuenta?{" "}
                <Link
                  href="/register"
                  className="font-semibold text-teal-600 hover:text-teal-500"
                >
                  Regístrate
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
