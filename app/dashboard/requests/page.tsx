"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getQrImageUrl } from "@/lib/qr";
import { PlusCircle } from "lucide-react";

type RequestItem = {
  id: string;
  codigo: string | null;
  estado: string;
  motivo: string | null;
  tiempoEspera: "ALTO" | "MEDIO" | "BAJO";
  createdAt: string;
  fechaRecepcionFarmacia: string | null;
  fechaListaRetiro: string | null;
  fechaLimiteRetiro: string | null;
  fechaRetiro: string | null;
  codigoRetiroSolicitante: string | null;
  requesterQrPayload: string | null;
  farmaciaEntrega: {
    id: string;
    nombre: string;
    direccion: string;
  } | null;
  medicamentos: Array<{
    id: string;
    cantidad: number;
    medicamento: {
      nombre: string;
      presentacion: string | null;
    };
  }>;
};

function statusClass(status: string) {
  switch (status) {
    case "COMPLETADA":
      return "bg-green-100 text-green-800 border-green-200";
    case "LISTA_PARA_RETIRO":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "EN_PROCESO":
    case "RECIBIDA":
    case "APROBADA":
      return "bg-amber-100 text-amber-800 border-amber-200";
    case "RECHAZADA":
    case "ABANDONADA":
      return "bg-red-100 text-red-800 border-red-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
}

function urgencyText(value: string) {
  if (value === "ALTO") return "Alta";
  if (value === "MEDIO") return "Media";
  return "Baja";
}

function formatDate(date: string | null) {
  if (!date) return "N/A";
  return new Date(date).toLocaleString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function MyRequestsPage() {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadRequests() {
      try {
        const response = await fetch("/api/requests");
        if (!response.ok) throw new Error("No se pudieron cargar solicitudes");
        const payload = (await response.json()) as RequestItem[];
        setRequests(payload);
      } catch (error) {
        console.error("Error fetching requests:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadRequests();
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Mis Solicitudes
          </h1>
          <p className="text-gray-500 mt-1">
            Da seguimiento al estado de tus solicitudes y al retiro en farmacia.
          </p>
        </div>
        <Link href="/dashboard/request-medication">
          <Button className="bg-teal-600 hover:bg-teal-700">
            <PlusCircle className="mr-2 h-4 w-4" />
            Nueva Solicitud
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <p className="text-sm text-gray-500">Cargando solicitudes...</p>
      ) : requests.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            No tienes solicitudes registradas.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {requests.map((request) => (
            <Card key={request.id} className="border-gray-200">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg">
                    {request.medicamentos[0]?.medicamento.nombre ||
                      "Medicamento"}
                  </CardTitle>
                  <Badge className={statusClass(request.estado)} variant="outline">
                    {request.estado.replace(/_/g, " ")}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-3 text-sm text-gray-700">
                <p>
                  <strong>Prioridad:</strong> {urgencyText(request.tiempoEspera)}
                </p>
                <p>
                  <strong>Creada:</strong> {formatDate(request.createdAt)}
                </p>
                {request.farmaciaEntrega && (
                  <p>
                    <strong>Farmacia de retiro:</strong>{" "}
                    {request.farmaciaEntrega.nombre}
                  </p>
                )}
                {request.motivo && (
                  <p className="line-clamp-2">
                    <strong>Motivo:</strong> {request.motivo}
                  </p>
                )}

                <div className="pt-2 border-t space-y-1">
                  <p>Recepción en farmacia: {formatDate(request.fechaRecepcionFarmacia)}</p>
                  <p>Lista para retiro: {formatDate(request.fechaListaRetiro)}</p>
                  <p>Límite de retiro: {formatDate(request.fechaLimiteRetiro)}</p>
                  <p>Retirada: {formatDate(request.fechaRetiro)}</p>
                </div>

                {request.estado === "LISTA_PARA_RETIRO" &&
                  request.codigoRetiroSolicitante && (
                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                      <p className="text-xs font-semibold text-blue-700 uppercase">
                        Código de retiro
                      </p>
                      <p className="font-mono text-lg font-bold text-blue-800 mt-1">
                        {request.codigoRetiroSolicitante}
                      </p>
                      {request.requesterQrPayload && (
                        <img
                          src={getQrImageUrl(request.requesterQrPayload, 170)}
                          alt="QR de retiro"
                          className="mt-3 h-[170px] w-[170px] rounded-md border bg-white p-2"
                        />
                      )}
                      <p className="text-xs text-blue-700 mt-2">
                        Presenta este código o QR en farmacia para retirar.
                      </p>
                    </div>
                  )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
