import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Clock3,
  MapPin,
  Package,
  Phone,
  Pill,
  ScanLine,
  Store,
} from "lucide-react";
import Link from "next/link";
import { getPharmacyDashboardData, type PharmacyActiveRequest } from "@/app/pharmacy/data";

function formatDate(date: Date | null) {
  if (!date) {
    return "Sin registros";
  }

  return new Intl.DateTimeFormat("es-VE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function requestStatusStyles(status: PharmacyActiveRequest["estado"]) {
  switch (status) {
    case "RECIBIDA":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "LISTA_PARA_RETIRO":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "EN_PROCESO":
      return "bg-amber-100 text-amber-700 border-amber-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

function requestStatusLabel(status: PharmacyActiveRequest["estado"]) {
  switch (status) {
    case "RECIBIDA":
      return "Recibida";
    case "LISTA_PARA_RETIRO":
      return "Lista para retiro";
    case "EN_PROCESO":
      return "En proceso";
    default:
      return status;
  }
}

function getNextStepLabel(request: PharmacyActiveRequest) {
  if (request.estado === "RECIBIDA") {
    return "Validar y marcar lista para retiro";
  }

  if (request.estado === "LISTA_PARA_RETIRO") {
    return request.pickupConfirmedAt
      ? "El beneficiario aviso que retirara pronto"
      : "Esperando confirmacion de retiro del beneficiario";
  }

  if (request.deliveryConfirmedAt) {
    return "El donante ya marco la entrega, falta recepcion";
  }

  if (request.farmaciaConfirmada !== true) {
    return "Esperando confirmacion del beneficiario";
  }

  return "Esperando entrega del donante";
}

export default async function PharmacyDashboardPage() {
  const { pharmacy, inventory, requests } = await getPharmacyDashboardData();

  const quickLinks = [
    {
      href: "/pharmacy/reception",
      icon: ScanLine,
      title: "Procesar recepcion",
      description: "Valida codigos de donacion y retiro desde el portal.",
      badge: null,
      iconClass: "bg-teal-100 text-teal-700",
    },
    {
      href: "/pharmacy/requests",
      icon: ClipboardList,
      title: "Solicitudes activas",
      description: "Consulta lo que esta en proceso, recibido o listo para retiro.",
      badge: requests.summary.totalActiveCount > 0 ? requests.summary.totalActiveCount : null,
      iconClass: "bg-amber-100 text-amber-700",
    },
    {
      href: "/pharmacy/inventory",
      icon: Package,
      title: "Inventario recibido",
      description: "Revisa los medicamentos fisicos registrados en esta farmacia.",
      badge: inventory.summary.receivedDonationsCount > 0
        ? inventory.summary.receivedDonationsCount
        : null,
      iconClass: "bg-cyan-100 text-cyan-700",
    },
  ];

  const stats = [
    {
      label: "Donaciones en inventario",
      value: inventory.summary.receivedDonationsCount,
      description: "Recepciones fisicas registradas en esta farmacia",
      icon: Package,
      iconClass: "bg-teal-50 text-teal-700",
      borderClass: "border-teal-100",
    },
    {
      label: "Medicamentos recibidos",
      value: inventory.summary.totalUnits,
      description: `${inventory.summary.uniqueMedicationCount} tipos de medicamento distintos`,
      icon: Pill,
      iconClass: "bg-cyan-50 text-cyan-700",
      borderClass: "border-cyan-100",
    },
    {
      label: "Solicitudes activas",
      value: requests.summary.totalActiveCount,
      description: `${requests.summary.inProcessCount} en proceso y ${requests.summary.receivedCount} recibidas`,
      icon: Clock3,
      iconClass: "bg-amber-50 text-amber-700",
      borderClass: "border-amber-100",
    },
    {
      label: "Listas para retiro",
      value: requests.summary.readyForPickupCount,
      description:
        requests.summary.pickupConfirmedCount > 0
          ? `${requests.summary.pickupConfirmedCount} beneficiarios ya avisaron que retiraran`
          : "Pendientes de entrega al beneficiario",
      icon: CheckCircle2,
      iconClass: "bg-emerald-50 text-emerald-700",
      borderClass: "border-emerald-100",
    },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <section className="rounded-3xl bg-gradient-to-r from-teal-600 via-teal-600 to-cyan-600 p-6 text-white shadow-lg">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-4">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
              <Store className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-teal-100">Portal Farmacia</p>
              <h2 className="text-3xl font-bold tracking-tight">{pharmacy.nombre}</h2>
              <p className="mt-2 max-w-2xl text-sm text-teal-50">
                Resumen de recepcion, solicitudes activas e inventario registrado en esta farmacia.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 text-teal-100" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-teal-100">
                    Direccion
                  </p>
                  <p className="mt-1 text-sm text-white">{pharmacy.direccion}</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
              <div className="flex items-start gap-3">
                <Phone className="mt-0.5 h-4 w-4 text-teal-100" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-teal-100">
                    Contacto
                  </p>
                  <p className="mt-1 text-sm text-white">
                    {pharmacy.telefono || "Sin telefono registrado"}
                  </p>
                  <p className="mt-1 text-xs text-teal-100">
                    {pharmacy.horario || "Horario no configurado"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <article
            key={stat.label}
            className={`rounded-2xl border bg-white p-5 shadow-sm ${stat.borderClass}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
                <p className="mt-1 text-sm font-semibold text-slate-700">{stat.label}</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">{stat.description}</p>
              </div>
              <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${stat.iconClass}`}>
                <stat.icon className="h-5 w-5" />
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                Medicamentos recibidos recientemente
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Resumen del inventario fisico registrado en esta farmacia.
              </p>
            </div>
            <Link
              href="/pharmacy/inventory"
              className="inline-flex items-center gap-2 text-sm font-semibold text-teal-700 transition hover:text-teal-800"
            >
              Ver inventario
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="p-6">
            {inventory.medications.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">
                <p className="text-sm font-semibold text-slate-700">
                  Aun no hay medicamentos recibidos en inventario
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  Cuando una donacion quede recibida en esta farmacia aparecera aqui.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {inventory.medications.slice(0, 5).map((medication) => (
                  <div
                    key={medication.medicamentoId}
                    className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-base font-semibold text-slate-900">
                          {medication.nombre}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {medication.presentacion || "Presentacion no registrada"}
                          {medication.concentracion ? ` · ${medication.concentracion}` : ""}
                        </p>
                      </div>
                      <div className="rounded-xl bg-white px-3 py-2 text-right shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Cantidad
                        </p>
                        <p className="text-lg font-bold text-slate-900">
                          {medication.totalCantidad}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span>{medication.donationCount} recepciones</span>
                      <span className="h-1 w-1 rounded-full bg-slate-300" />
                      <span>Ultimo ingreso: {formatDate(medication.lastReceivedAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </article>

        <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                Solicitudes activas en esta farmacia
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Lo que esta esperando recepcion, validacion o retiro.
              </p>
            </div>
            <Link
              href="/pharmacy/requests"
              className="inline-flex items-center gap-2 text-sm font-semibold text-teal-700 transition hover:text-teal-800"
            >
              Ver solicitudes
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="p-6">
            {requests.requests.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">
                <p className="text-sm font-semibold text-slate-700">
                  No hay solicitudes activas en esta farmacia
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  Las solicitudes asignadas a esta farmacia apareceran aqui.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {requests.requests.slice(0, 4).map((request) => (
                  <div
                    key={request.id}
                    className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-base font-semibold text-slate-900">
                          {request.usuarioComun.nombre}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {request.medicamentos
                            .map((item) => item.medicamento.nombre)
                            .join(", ")}
                        </p>
                      </div>
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${requestStatusStyles(request.estado)}`}
                      >
                        {requestStatusLabel(request.estado)}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-slate-600">{getNextStepLabel(request)}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span>Creada: {formatDate(request.createdAt)}</span>
                      {request.fechaLimiteRetiro && (
                        <>
                          <span className="h-1 w-1 rounded-full bg-slate-300" />
                          <span>Limite de retiro: {formatDate(request.fechaLimiteRetiro)}</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </article>
      </section>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-5">
          <h3 className="text-lg font-semibold text-slate-900">Accesos rapidos</h3>
          <p className="mt-1 text-sm text-slate-500">
            Navega directo a las tareas mas comunes del portal de farmacia.
          </p>
        </div>
        <div className="grid gap-4 p-6 lg:grid-cols-3">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:border-teal-200 hover:bg-teal-50/40"
            >
              <div className="flex items-start justify-between gap-4">
                <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${link.iconClass}`}>
                  <link.icon className="h-5 w-5" />
                </div>
                {link.badge != null && (
                  <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
                    {link.badge}
                  </span>
                )}
              </div>
              <p className="mt-4 text-base font-semibold text-slate-900">{link.title}</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">{link.description}</p>
              <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-teal-700">
                Abrir
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
