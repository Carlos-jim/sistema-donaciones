import { Pill } from "lucide-react";
import { PortalLoginCard } from "@/components/portal-login-card";

export default function PharmacyLoginPage() {
  return (
    <PortalLoginCard
      badge="Portal Pharmacy"
      title="Acceso farmacia"
      description="Recepcion, validacion y entrega segura de medicamentos."
      icon={Pill}
      loginEndpoint="/api/pharmacy/auth/login"
      redirectTo="/pharmacy"
      submitLabel="Ingresar a farmacia"
      cardAccentClassName="bg-gradient-to-r from-teal-700 via-emerald-700 to-sky-700"
      buttonClassName="bg-gradient-to-r from-teal-700 via-emerald-700 to-sky-700 hover:from-teal-800 hover:via-emerald-800 hover:to-sky-800"
      focusClassName="focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20"
      iconWrapClassName="bg-white/15 text-white"
      iconClassName="h-7 w-7"
    />
  );
}
