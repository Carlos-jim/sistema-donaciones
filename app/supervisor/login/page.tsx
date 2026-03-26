"use client";

import { ClipboardCheck } from "lucide-react";
import { PortalLoginCard } from "@/components/portal-login-card";

export default function SupervisorLoginPage() {
  return (
    <PortalLoginCard
      badge="Portal Supervisor"
      title="Acceso supervisor"
      description="Revision y aprobacion de solicitudes medicas."
      icon={ClipboardCheck}
      loginEndpoint="/api/supervisor/auth/login"
      redirectTo="/supervisor"
      submitLabel="Ingresar al portal"
      cardAccentClassName="bg-gradient-to-r from-cyan-700 via-teal-700 to-emerald-700"
      buttonClassName="bg-gradient-to-r from-cyan-700 via-teal-700 to-emerald-700 hover:from-cyan-800 hover:via-teal-800 hover:to-emerald-800"
      focusClassName="focus-visible:border-cyan-500 focus-visible:ring-cyan-500/20"
      iconWrapClassName="bg-white/15 text-white"
      iconClassName="h-7 w-7"
    />
  );
}
