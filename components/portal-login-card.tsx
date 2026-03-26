"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

interface PortalLoginCardProps {
  badge: string;
  title: string;
  description: string;
  icon: LucideIcon;
  loginEndpoint: string;
  redirectTo: string;
  submitLabel: string;
  cardAccentClassName: string;
  buttonClassName: string;
  focusClassName: string;
  iconWrapClassName: string;
  iconClassName: string;
}

export function PortalLoginCard({
  badge,
  title,
  description,
  icon: Icon,
  loginEndpoint,
  redirectTo,
  submitLabel,
  cardAccentClassName,
  buttonClassName,
  focusClassName,
  iconWrapClassName,
  iconClassName,
}: PortalLoginCardProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch(loginEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error || "No se pudo iniciar sesion");
        return;
      }

      toast({
        title: "Sesion iniciada",
        description: "Acceso concedido correctamente.",
      });

      router.push(redirectTo);
      router.refresh();
    } catch {
      setError("Error de conexion. Intenta nuevamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(13,148,136,0.12),_transparent_36%),linear-gradient(180deg,_#f8fafc_0%,_#ecfeff_55%,_#ffffff_100%)] px-4 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-md items-center">
        <div className="w-full overflow-hidden rounded-[2rem] border border-white/70 bg-white/90 shadow-[0_30px_80px_-35px_rgba(15,23,42,0.35)] backdrop-blur">
          <div className={`px-8 py-7 ${cardAccentClassName}`}>
            <div className="mb-5 inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/85">
              {badge}
            </div>
            <div className="flex items-center gap-4">
              <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${iconWrapClassName}`}>
                <Icon className={iconClassName} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">{title}</h1>
                <p className="mt-1 text-sm text-white/75">{description}</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 px-8 py-7">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold text-slate-700">
                Correo electronico
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="usuario@medisharene.com"
                required
                autoFocus
                className={`h-11 rounded-xl border-slate-200 ${focusClassName}`}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-semibold text-slate-700">
                Contrasena
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="********"
                required
                className={`h-11 rounded-xl border-slate-200 ${focusClassName}`}
              />
            </div>

            {error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <Button
              type="submit"
              disabled={isLoading}
              className={`h-11 w-full rounded-xl text-white ${buttonClassName}`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Ingresando...
                </>
              ) : (
                submitLabel
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
