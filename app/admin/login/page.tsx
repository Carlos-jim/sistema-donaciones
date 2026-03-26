"use client";

import { Shield } from "lucide-react";
import { PortalLoginCard } from "@/components/portal-login-card";

export default function AdminLoginPage() {
  return (
    <PortalLoginCard
      badge="Portal Admin"
      title="Acceso administrativo"
      description="Solo administradores autorizados del sistema."
      icon={Shield}
      loginEndpoint="/api/admin/auth/login"
      redirectTo="/admin"
      submitLabel="Ingresar al panel"
      cardAccentClassName="bg-gradient-to-r from-slate-900 via-cyan-900 to-teal-700"
      buttonClassName="bg-gradient-to-r from-slate-900 via-cyan-800 to-teal-700 hover:from-slate-950 hover:via-cyan-900 hover:to-teal-800"
      focusClassName="focus-visible:border-cyan-500 focus-visible:ring-cyan-500/20"
      iconWrapClassName="bg-white/15 text-white"
      iconClassName="h-7 w-7"
    />
  );
}
