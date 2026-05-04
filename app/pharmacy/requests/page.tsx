import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Clock3,
  HeartHandshake,
  ScanLine,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import {
  getPharmacyActiveRequestsData,
  type PharmacyActiveRequest,
} from "@/app/pharmacy/data";

function formatDate(date: Date | null) {
  if (!date) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat("es-VE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function urgencyBadgeClass(priority: PharmacyActiveRequest["tiempoEspera"]) {
  switch (priority) {
    case "ALTO":
      return "bg-red-100 text-red-700 border-red-200";
    case "MEDIO":
      return "bg-amber-100 text-amber-700 border-amber-200";
    case "BAJO":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

function urgencyLabel(priority: PharmacyActiveRequest["tiempoEspera"]) {
  switch (priority) {
    case "ALTO":
      return "Urgencia alta";
    case "MEDIO":
      return "Urgencia media";
    case "BAJO":
      return "Urgencia baja";
    default:
      return priority;
  }
}

function statusBadgeClass(status: PharmacyActiveRequest["estado"]) {
  switch (status) {
    case "EN_PROCESO":
      return "bg-amber-100 text-amber-700 border-amber-200";
    case "RECIBIDA":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "LISTA_PARA_RETIRO":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

function statusLabel(status: PharmacyActiveRequest["estado"]) {
  switch (status) {
    case "EN_PROCESO":
      return "En proceso";
    case "RECIBIDA":
      return "Recibida";
    case "LISTA_PARA_RETIRO":
      return "Lista para retiro";
    default:
      return status;
  }
}

function getNextStepLabel(request: PharmacyActiveRequest) {
  if (request.estado === "RECIBIDA") {
    return "Pendiente marcarla como lista para retiro";
  }

  if (request.estado === "LISTA_PARA_RETIRO") {
    return request.pickupConfirmedAt
      ? "El beneficiario ya confirmo que ira a retirar"
      : "Esperando confirmacion de retiro del beneficiario";
  }

  if (request.deliveryConfirmedAt) {
    return "El donante ya indico la entrega, toca validar en recepcion";
  }

  if (request.farmaciaConfirmada !== true) {
    return "Esperando confirmacion del beneficiario sobre la farmacia";
  }

  return "Esperando que el donante entregue el medicamento";
}

function statusSectionDescription(status: PharmacyActiveRequest["estado"]) {
  switch (status) {
    case "EN_PROCESO":
      return "Solicitudes asignadas a esta farmacia que todavia esperan entrega o validacion.";
    case "RECIBIDA":
      return "Medicamentos ya recibidos por farmacia y pendientes de marcar para retiro.";
    case "LISTA_PARA_RETIRO":
      return "Solicitudes listas para que el beneficiario las retire en farmacia.";
    default:
      return "Solicitudes activas";
  }
}

type RequestSection = {
  key: PharmacyActiveRequest["estado"];
  title: string;
  icon: typeof Clock3;
  iconClass: string;
  items: PharmacyActiveRequest[];
};

export default async function PharmacyRequestsPage() {
  const { pharmacy, requests, summary } = await getPharmacyActiveRequestsData();

  const sections: RequestSection[] = [
    {
      key: "EN_PROCESO",
      title: "En proceso",
      icon: Clock3,
      iconClass: "bg-amber-50 text-amber-700",
      items: requests.filter((request) => request.estado === "EN_PROCESO"),
    },
    {
      key: "RECIBIDA",
      title: "Recibidas en farmacia",
      icon: HeartHandshake,
      iconClass: "bg-blue-50 text-blue-700",
      items: requests.filter((request) => request.estado === "RECIBIDA"),
    },
    {
      key: "LISTA_PARA_RETIRO",
      title: "Listas para retiro",
      icon: CheckCircle2,
      iconClass: "bg-emerald-50 text-emerald-700",
      items: requests.filter(
        (request) => request.estado === "LISTA_PARA_RETIRO",
      ),
    },
  ];

  const stats = [
    {
      label: "En proceso",
      value: summary.inProcessCount,
      description: "Esperando entrega, confirmacion o validacion",
      icon: Clock3,
      iconClass: "bg-amber-50 text-amber-700",
      borderClass: "border-amber-100",
    },
    {
      label: "Recibidas",
      value: summary.receivedCount,
      description: "Ya llegaron a farmacia y faltan pasos internos",
      icon: HeartHandshake,
      iconClass: "bg-blue-50 text-blue-700",
      borderClass: "border-blue-100",
    },
    {
      label: "Listas para retiro",
      value: summary.readyForPickupCount,
      description: "Esperando al beneficiario en esta farmacia",
      icon: CheckCircle2,
      iconClass: "bg-emerald-50 text-emerald-700",
      borderClass: "border-emerald-100",
    },
    {
      label: "Total activas",
      value: summary.totalActiveCount,
      description:
        summary.pickupConfirmedCount > 0
          ? `${summary.pickupConfirmedCount} beneficiarios ya avisaron que retiraran`
          : `Portal de ${pharmacy.nombre}`,
      icon: ClipboardList,
      iconClass: "bg-cyan-50 text-cyan-700",
      borderClass: "border-cyan-100",
    },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <section className="rounded-3xl bg-gradient-to-r from-teal-600 via-teal-600 to-cyan-600 p-6 text-white shadow-lg">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
              <ClipboardList className="h-6 w-6" />
            </div>
            <p className="mt-4 text-sm font-medium text-teal-100">
              Solicitudes activas
            </p>
            <h2 className="mt-1 text-3xl font-bold tracking-tight">
              {pharmacy.nombre}
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-teal-50">
              Bandeja de solicitudes que esta farmacia debe recibir, validar o
              entregar al beneficiario.
            </p>
          </div>

          <Link
            href="/pharmacy/reception"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-teal-700 shadow-sm transition hover:bg-teal-50"
          >
            <ScanLine className="h-4 w-4" />
            Ir a recepcion
          </Link>
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
                <p className="text-3xl font-bold text-slate-900">
                  {stat.value}
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-700">
                  {stat.label}
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  {stat.description}
                </p>
              </div>
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-2xl ${stat.iconClass}`}
              >
                <stat.icon className="h-5 w-5" />
              </div>
            </div>
          </article>
        ))}
      </section>

      {sections.map((section) => (
        <section
          key={section.key}
          className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
        >
          <div className="border-b border-slate-100 px-6 py-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-2xl ${section.iconClass}`}
                  >
                    <section.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      {section.title}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {statusSectionDescription(section.key)}
                    </p>
                  </div>
                </div>
              </div>
              <span className="inline-flex w-fit rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
                {section.items.length} activas
              </span>
            </div>
          </div>

          <div className="p-6">
            {section.items.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-8 text-center">
                <p className="text-sm font-semibold text-slate-700">
                  No hay solicitudes en este estado
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  Cuando una solicitud pase a {section.title.toLowerCase()}{" "}
                  aparecera aqui.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {section.items.map((request) => (
                  <article
                    key={request.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-base font-semibold text-slate-900">
                            {request.usuarioComun.nombre}
                          </h4>
                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusBadgeClass(request.estado)}`}
                          >
                            {statusLabel(request.estado)}
                          </span>
                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-semibold ${urgencyBadgeClass(request.tiempoEspera)}`}
                          >
                            {urgencyLabel(request.tiempoEspera)}
                          </span>
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                          {request.usuarioComun.cedula && (
                            <span>{request.usuarioComun.cedula}</span>
                          )}
                          {request.usuarioComun.telefono && (
                            <span>{request.usuarioComun.telefono}</span>
                          )}
                          {!request.usuarioComun.cedula &&
                            !request.usuarioComun.telefono && (
                              <span>Sin datos de contacto adicionales</span>
                            )}
                        </div>
                      </div>

                      <Link
                        href="/pharmacy/reception"
                        className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-teal-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-teal-50"
                      >
                        Procesar en recepcion
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {request.medicamentos.map((medication) => (
                        <span
                          key={medication.id}
                          className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200"
                        >
                          {medication.medicamento.nombre}
                          {medication.cantidad > 1
                            ? ` x${medication.cantidad}`
                            : ""}
                        </span>
                      ))}
                    </div>

                    <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                      <div className="rounded-2xl border border-slate-100 bg-white p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Siguiente paso
                        </p>
                        <p className="mt-2 text-sm font-medium text-slate-900">
                          {getNextStepLabel(request)}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-slate-100 bg-white p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Donante asignado
                        </p>
                        <p className="mt-2 text-sm font-medium text-slate-900">
                          {request.donanteAsignado?.nombre || "Aun no asignado"}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-slate-100 bg-white p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Creada
                        </p>
                        <p className="mt-2 text-sm font-medium text-slate-900">
                          {formatDate(request.createdAt)}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-slate-100 bg-white p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Retiro limite
                        </p>
                        <p className="mt-2 text-sm font-medium text-slate-900">
                          {formatDate(request.fechaLimiteRetiro)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <UserRound className="h-3.5 w-3.5" />
                      <span>
                        Beneficiario{" "}
                        {request.pickupConfirmedAt
                          ? "ya confirmo retiro"
                          : "pendiente de retiro"}
                      </span>
                      {request.deliveryConfirmedAt && (
                        <>
                          <span className="h-1 w-1 rounded-full bg-slate-300" />
                          <span>El donante ya confirmo la entrega</span>
                        </>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      ))}
    </div>
  );
}
