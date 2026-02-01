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
import { approveRequest, rejectRequest, updateMedicamentoPriority } from "./actions";
import { Eye, CheckCircle, XCircle, FileText, Edit, Save, X } from "lucide-react";
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
    id: string;
    cantidad: number;
    prioridad: number;
    prioridadOriginal?: number | null;
    fechaModificacionPrioridad?: Date | null;
    prioridadModificadaPor?: {
      nombre: string;
    } | null;
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
  const [editingPriority, setEditingPriority] = useState<string | null>(null);
  const [tempPriorities, setTempPriorities] = useState<Record<string, number>>({});
  const [isUpdatingPriority, setIsUpdatingPriority] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const priorityLabels = {
    1: { label: "Baja", color: "bg-green-100 text-green-800" },
    2: { label: "Media", color: "bg-yellow-100 text-yellow-800" },
    3: { label: "Alta", color: "bg-red-100 text-red-800" },
  };

  const handlePriorityEdit = (medicamentoId: string, currentPriority: number) => {
    setEditingPriority(medicamentoId);
    setTempPriorities({ ...tempPriorities, [medicamentoId]: currentPriority });
  };

  const handlePrioritySave = async (medicamentoId: string) => {
    const newPriority = tempPriorities[medicamentoId];
    if (!newPriority || newPriority < 1 || newPriority > 3) {
      toast({
        title: "Error",
        description: "La prioridad debe estar entre 1 (Baja) y 3 (Alta)",
        variant: "destructive",
      });
      return;
    }

    setIsUpdatingPriority(true);
    try {
      const result = await updateMedicamentoPriority(medicamentoId, newPriority);
      
      if (result.success) {
        toast({
          title: "Prioridad Actualizada",
          description: result.message,
        });
        setEditingPriority(null);
        router.refresh();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar la prioridad.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingPriority(false);
    }
  };

  const handlePriorityCancel = (medicamentoId: string) => {
    setEditingPriority(null);
    const newTempPriorities = { ...tempPriorities };
    delete newTempPriorities[medicamentoId];
    setTempPriorities(newTempPriorities);
  };

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
      <div className="bg-white rounded-xl border-0 shadow-xl shadow-gray-200/50 overflow-hidden">
        <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-4 border-b">
          <h2 className="text-xl font-semibold">
            Solicitudes Pendientes
          </h2>
        </div>
        <div className="p-4">
          {requests.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
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
                  <div className="bg-gradient-to-r from-gray-50 to-white p-4 rounded-xl border">
                    <h3 className="font-semibold mb-2 flex items-center">
                      <FileText className="w-4 h-4 mr-2 text-teal-600" /> Datos del Beneficiario
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

                  <div className="bg-gradient-to-r from-gray-50 to-white p-4 rounded-xl border">
                    <h3 className="font-semibold mb-2">
                      Medicamentos Solicitados
                    </h3>
                    <ul className="space-y-2">
                      {selectedRequest.medicamentos.map((m, i) => (
                        <li key={m.id} className="flex items-center justify-between p-2 rounded border bg-white">
                          <div className="flex-1">
                            <div className="font-medium text-sm">
                              {m.medicamento.nombre} - {m.medicamento.presentacion}
                            </div>
                            <div className="text-xs text-gray-600">
                              Cantidad: {m.cantidad}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {editingPriority === m.id ? (
                              <div className="flex items-center gap-2">
                                <select
                                  value={tempPriorities[m.id] || m.prioridad}
                                  onChange={(e) => 
                                    setTempPriorities({ ...tempPriorities, [m.id]: parseInt(e.target.value) })
                                  }
                                  className="text-xs border rounded px-2 py-1"
                                  disabled={isUpdatingPriority}
                                >
                                  <option value={1}>Baja (1)</option>
                                  <option value={2}>Media (2)</option>
                                  <option value={3}>Alta (3)</option>
                                </select>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handlePrioritySave(m.id)}
                                  disabled={isUpdatingPriority}
                                >
                                  <Save className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handlePriorityCancel(m.id)}
                                  disabled={isUpdatingPriority}
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className={`text-xs px-2 py-1 rounded-full font-medium ${priorityLabels[m.prioridad as keyof typeof priorityLabels].color}`}>
                                  {priorityLabels[m.prioridad as keyof typeof priorityLabels].label}
                                </span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handlePriorityEdit(m.id, m.prioridad)}
                                  disabled={isLoading || isRejecting}
                                >
                                  <Edit className="w-3 h-3" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                    {selectedRequest.medicamentos.some(m => m.fechaModificacionPrioridad) && (
                      <div className="mt-3 p-2 bg-blue-50 rounded border border-blue-200">
                        <div className="text-xs text-blue-800 font-medium mb-1">Historial de modificaciones:</div>
                        {selectedRequest.medicamentos
                          .filter(m => m.fechaModificacionPrioridad)
                          .map(m => (
                            <div key={m.id} className="text-xs text-blue-700">
                              {m.medicamento.nombre}: Prioridad cambiada de {m.prioridadOriginal} a {m.prioridad} 
                              {m.prioridadModificadaPor && ` por ${m.prioridadModificadaPor.nombre}`}
                              {' '}{m.fechaModificacionPrioridad && `el ${new Date(m.fechaModificacionPrioridad).toLocaleDateString()}`}
                            </div>
                          ))}
                      </div>
                    )}
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
                    className="bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 shadow-lg shadow-teal-600/20"
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
    </div>
  );
}
