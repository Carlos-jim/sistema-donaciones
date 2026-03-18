"use client";

import type React from "react";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Space_Grotesk } from "next/font/google";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Heart, Mail, Lock, Loader2, ArrowRight } from "lucide-react";
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

      router.push(callbackUrl);
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-teal-50/20 to-white flex flex-col justify-center py-8 px-4">
      <div className="mx-auto w-full max-w-md">
        {/* Logo / Brand */}
        <div className="mb-8 text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-teal-600 to-cyan-500 shadow-lg shadow-teal-500/20 mb-4">
            <Heart className="h-7 w-7 text-white" />
          </div>
          <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-900 to-teal-600">
            Bienvenido de nuevo
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Inicia sesión para continuar ayudando
          </p>
        </div>

        {/* Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden">
          <div className="p-8">
            <form className="space-y-5" onSubmit={handleSubmit}>
              {error && (
                <div className="flex items-start gap-3 rounded-xl bg-red-50 border border-red-100 p-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-red-600 text-xs font-bold">!</span>
                  </div>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-gray-700 flex items-center gap-2"
                >
                  <Mail className="w-4 h-4 text-teal-600" />
                  Correo Electrónico
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="ejemplo@correo.com"
                  autoComplete="email"
                  required
                  className="rounded-xl border-gray-200 focus:border-teal-500 focus:ring-teal-500/20 h-11"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="password"
                    className="text-gray-700 flex items-center gap-2"
                  >
                    <Lock className="w-4 h-4 text-teal-600" />
                    Contraseña
                  </Label>
                  <Link
                    href="/forgot-password"
                    className="text-xs font-medium text-teal-600 hover:text-teal-500 transition-colors"
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
                  className="rounded-xl border-gray-200 focus:border-teal-500 focus:ring-teal-500/20 h-11"
                />
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  className="w-full h-11 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white shadow-lg shadow-teal-500/20 transition-all duration-300 font-medium"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      Iniciar Sesión
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>

          {/* Divider + Register CTA */}
          <div className="border-t border-gray-100 bg-gray-50/50 px-8 py-5">
            <p className="text-center text-sm text-gray-500">
              ¿No tienes una cuenta?{" "}
              <Link
                href="/register"
                className="font-semibold text-teal-600 hover:text-teal-500 hover:underline transition-all"
              >
                Regístrate
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
