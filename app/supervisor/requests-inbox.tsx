"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea"; // Assuming Textarea exists or use Input
import { useToast } from "@/components/ui/use-toast";
import { approveRequest, rejectRequest } from "./actions";
import { Eye, CheckCircle, XCircle, FileText } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

// Define concise types matching Prisma output
type RequestItem = {
  id: string;
  createdAt: Date;
  usuarioComun: {
    nombre: string;
    cedula: string | null;
    email: string;
    telefono: string | null;
  };
  medicamentos: {
    cantidad: number;
    medicamento: {
      nombre: string;
      presentacion: string | null;
    };
  }[];
  recipePhotoUrl: string | null;
  motivo: string | null;
};

export default function RequestsInbox({
  requests,
}: {
  requests: RequestItem[];
}) {
  const [selectedRequest, setSelectedRequest] = useState<RequestItem | null>(
    null,
  );
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleApprove = async () => {
    if (!selectedRequest) return;
    setIsLoading(true);
    try {
      await approveRequest(selectedRequest.id);
      toast({
        title: "Solicitud Aprobada",
        description: "La solicitud ha sido publicada exitosamente.",
      });
      setSelectedRequest(null);
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo aprobar la solicitud.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;
    if (!rejectionReason.trim()) {
      toast({
        title: "Requerido",
        description: "Debe ingresar un motivo de rechazo.",
        variant: "destructive",
      });
      return;
    }
    setIsLoading(true);
    try {
      await rejectRequest(selectedRequest.id, rejectionReason);
      toast({
        title: "Solicitud Rechazada",
        description: "La solicitud ha sido rechazada.",
        variant: "destructive",
      });
      setSelectedRequest(null);
      setIsRejecting(false);
      setRejectionReason("");
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo rechazar la solicitud.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow border p-4">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">
          Solicitudes Pendientes
        </h2>
        {requests.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No hay solicitudes pendientes por revisar.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Beneficiario</TableHead>
                <TableHead>Medicamentos</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((req) => (
                <TableRow key={req.id}>
                  <TableCell>
                    {new Date(req.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{req.usuarioComun.nombre}</div>
                    <div className="text-xs text-gray-500">
                      {req.usuarioComun.cedula || "S/C"}
                    </div>
                  </TableCell>
                  <TableCell>
                    {req.medicamentos.map((m, i) => (
                      <div key={i} className="text-sm">
                        {m.medicamento.nombre} ({m.cantidad})
                      </div>
                    ))}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedRequest(req);
                        setIsRejecting(false);
                      }}
                    >
                      <Eye className="w-4 h-4 mr-2" /> Revisar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog
        open={!!selectedRequest}
        onOpenChange={(open) => !open && setSelectedRequest(null)}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Revisión de Solicitud</DialogTitle>
            <DialogDescription>
              Detalles del beneficiario y récipe médico.
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <div className="space-y-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <h3 className="font-semibold text-gray-700 mb-2 flex items-center">
                    <FileText className="w-4 h-4 mr-2" /> Datos del Beneficiario
                  </h3>
                  <div className="text-sm space-y-1">
                    <p>
                      <span className="font-medium">Nombre:</span>{" "}
                      {selectedRequest.usuarioComun.nombre}
                    </p>
                    <p>
                      <span className="font-medium">Cédula:</span>{" "}
                      {selectedRequest.usuarioComun.cedula || "N/A"}
                    </p>
                    <p>
                      <span className="font-medium">Email:</span>{" "}
                      {selectedRequest.usuarioComun.email}
                    </p>
                    <p>
                      <span className="font-medium">Teléfono:</span>{" "}
                      {selectedRequest.usuarioComun.telefono || "N/A"}
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg">
                  <h3 className="font-semibold text-gray-700 mb-2">
                    Medicamentos Solicitados
                  </h3>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    {selectedRequest.medicamentos.map((m, i) => (
                      <li key={i}>
                        {m.medicamento.nombre} - {m.medicamento.presentacion}{" "}
                        (Cant: {m.cantidad})
                      </li>
                    ))}
                  </ul>
                  {selectedRequest.motivo && (
                    <div className="mt-2 text-sm">
                      <span className="font-medium">Motivo:</span>{" "}
                      {selectedRequest.motivo}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-gray-700">Récipe Médico</h3>
                <div className="border rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center min-h-[200px]">
                  {selectedRequest.recipePhotoUrl ? (
                    <div className="relative w-full h-full min-h-[300px]">
                      <Image
                        src={selectedRequest.recipePhotoUrl}
                        alt="Récipe"
                        fill
                        className="object-contain"
                      />
                    </div>
                  ) : (
                    <span className="text-gray-400">
                      Sin foto de récipe adjunta
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="mt-6 flex flex-col sm:flex-row gap-2 sm:justify-end">
            {!isRejecting ? (
              <>
                <Button
                  variant="destructive"
                  onClick={() => setIsRejecting(true)}
                  disabled={isLoading}
                >
                  <XCircle className="w-4 h-4 mr-2" /> Rechazar
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={handleApprove}
                  disabled={isLoading}
                >
                  <CheckCircle className="w-4 h-4 mr-2" /> Aprobar
                </Button>
              </>
            ) : (
              <div className="w-full space-y-3">
                <Label htmlFor="reason">Motivo de Rechazo</Label>
                <Input
                  id="reason"
                  placeholder="Explique por qué se rechaza la solicitud..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                />
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => setIsRejecting(false)}>
                    Cancelar
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleReject}
                    disabled={isLoading}
                  >
                    Confirmar Rechazo
                  </Button>
                </div>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
