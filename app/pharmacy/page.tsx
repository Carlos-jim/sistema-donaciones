import { prisma } from "@/lib/prisma";
import {
  Package,
  Clock,
  Activity,
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  Inbox,
} from "lucide-react";
import Link from "next/link";

export default async function PharmacyDashboardPage() {
  const [receivedDonationsCount, pendingRequestsCount, readyForPickupCount] =
    await Promise.all([
      prisma.donacion.count({ where: { estado: "RECIBIDA" } }),
      prisma.solicitud.count({ where: { estado: "RECIBIDA" } }),
      prisma.solicitud.count({ where: { estado: "LISTA_PARA_RETIRO" } }),
    ]);

  const stats = [
    {
      label: "En Inventario",
      value: receivedDonationsCount,
      description: "Donaciones recibidas físicamente",
      icon: Package,
      colorClass: "text-teal-600",
      bgClass: "bg-teal-50",
      borderClass: "border-teal-100",
      accentClass: "bg-teal-500",
    },
    {
      label: "En Proceso",
      value: pendingRequestsCount,
      description: "Solicitudes recibidas, pendientes de entrega",
      icon: Clock,
      colorClass: "text-amber-600",
      bgClass: "bg-amber-50",
      borderClass: "border-amber-100",
      accentClass: "bg-amber-500",
    },
    {
      label: "Listas para Retiro",
      value: readyForPickupCount,
      description: "Solicitudes listas para que el paciente retire",
      icon: CheckCircle2,
      colorClass: "text-emerald-600",
      bgClass: "bg-emerald-50",
      borderClass: "border-emerald-100",
      accentClass: "bg-emerald-500",
    },
    {
      label: "Total Activas",
      value: pendingRequestsCount + readyForPickupCount,
      description: "Solicitudes en curso en total",
      icon: TrendingUp,
      colorClass: "text-cyan-600",
      bgClass: "bg-cyan-50",
      borderClass: "border-cyan-100",
      accentClass: "bg-cyan-500",
    },
  ];

  const quickLinks = [
    {
      href: "/pharmacy/reception",
      icon: Activity,
      title: "Procesar Recepción",
      description: "Ingresar código de donación o solicitud",
      iconBg: "bg-teal-100 group-hover:bg-teal-200",
      iconColor: "text-teal-700",
      badge: null,
    },
    {
      href: "/pharmacy/requests",
      icon: Inbox,
      title: "Ver Solicitudes",
      description: "Gestionar solicitudes activas en la farmacia",
      iconBg: "bg-amber-100 group-hover:bg-amber-200",
      iconColor: "text-amber-700",
      badge: pendingRequestsCount + readyForPickupCount > 0
        ? pendingRequestsCount + readyForPickupCount
        : null,
    },
    {
      href: "/pharmacy/inventory",
      icon: Package,
      title: "Inventario",
      description: "Ver donaciones recibidas físicamente",
      iconBg: "bg-cyan-100 group-hover:bg-cyan-200",
      iconColor: "text-cyan-700",
      badge: null,
    },
  ];

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 to-cyan-600 rounded-2xl p-6 text-white shadow-md">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
            <Package className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold leading-tight">Dashboard Farmacia</h2>
            <p className="text-teal-100 text-sm">Resumen de actividad e inventario</p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className={`bg-white rounded-2xl p-5 border ${s.borderClass} shadow-sm flex items-start gap-4`}
          >
            <div className={`w-11 h-11 ${s.bgClass} rounded-xl flex items-center justify-center flex-shrink-0`}>
              <s.icon className={`w-5 h-5 ${s.colorClass}`} />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              <p className="text-xs font-semibold text-gray-600 mt-0.5">{s.label}</p>
              <p className="text-xs text-gray-400 mt-0.5 leading-snug">{s.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/60">
          <h3 className="text-sm font-semibold text-gray-700">Accesos Rápidos</h3>
          <p className="text-xs text-gray-400 mt-0.5">Acciones frecuentes del portal</p>
        </div>
        <div className="p-4 grid gap-3">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group"
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 ${link.iconBg} rounded-xl flex items-center justify-center transition-colors`}>
                  <link.icon className={`w-5 h-5 ${link.iconColor}`} />
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">{link.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{link.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {link.badge != null && (
                  <span className="text-xs font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                    {link.badge}
                  </span>
                )}
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
