"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Building2,
  Users,
  Plus,
  Pencil,
  CheckCircle2,
  XCircle,
  Search,
  Loader2,
  ShieldCheck,
  ShieldOff,
  RefreshCw,
  Clock,
  MapPin,
  Phone,
  ChevronLeft,
  ChevronRight,
  BarChart2,
  Download,
  Database,
  FileText,
  TrendingUp,
  Pill,
  Trash2,
  FlaskConical,
  Tag,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { LocationPickerMap } from "@/components/location-picker-map";

// ── Types ──────────────────────────────────────────────────────────────────────
type Farmacia = {
  id: string;
  nombre: string;
  direccion: string;
  email: string;
  telefono: string | null;
  horario: string | null;
  latitude: number | null;
  longitude: number | null;
  activo: boolean;
  createdAt: string;
};

type Supervisor = {
  id: string;
  nombre: string;
  email: string;
  direccion: string;
  telefono: string | null;
  aprobado: boolean;
  createdAt: string;
};

type FarmaciaForm = {
  nombre: string;
  email: string;
  password: string;
  direccion: string;
  telefono: string;
  horario: string;
  latitude: number | null;
  longitude: number | null;
};

const PAGE_SIZE = 6;

type SupervisorForm = {
  nombre: string;
  email: string;
  password: string;
  direccion: string;
  telefono: string;
};

type Medicamento = {
  id: string;
  nombre: string;
  principioActivo: string | null;
  presentacion: string | null;
  concentracion: string | null;
  descripcion: string | null;
  activo: boolean;
  createdAt: string;
  _count: { solicitudes: number; donaciones: number };
};

type MedicamentoForm = {
  nombre: string;
  principioActivo: string;
  presentacion: string;
  concentracion: string;
  descripcion: string;
};

const emptyMedicamentoForm: MedicamentoForm = {
  nombre: "",
  principioActivo: "",
  presentacion: "",
  concentracion: "",
  descripcion: "",
};

const PRESENTACIONES = [
  "Tabletas",
  "Cápsulas",
  "Jarabe",
  "Suspensión",
  "Inyectable",
  "Crema",
  "Ungüento",
  "Gotas",
  "Parche",
  "Inhalador",
  "Supositorio",
  "Otro",
];

type ModalState =
  | { type: "none" }
  | { type: "farmacia-create" }
  | { type: "farmacia-edit"; item: Farmacia }
  | { type: "supervisor-create" }
  | { type: "supervisor-edit"; item: Supervisor }
  | { type: "medicamento-create" }
  | { type: "medicamento-edit"; item: Medicamento };

// ── Defaults ───────────────────────────────────────────────────────────────────
const emptyFarmaciaForm: FarmaciaForm = {
  nombre: "",
  email: "",
  password: "",
  direccion: "",
  telefono: "",
  horario: "",
  latitude: null,
  longitude: null,
};

const emptySupervisorForm: SupervisorForm = {
  nombre: "",
  email: "",
  password: "",
  direccion: "",
  telefono: "",
};

// ── Sub-components ─────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  icon: Icon,
  colorClass,
  bgClass,
  borderClass,
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  colorClass: string;
  bgClass: string;
  borderClass: string;
}) {
  return (
    <div
      className={`bg-white rounded-2xl p-5 border ${borderClass} flex items-center gap-4 shadow-sm`}
    >
      <div
        className={`w-12 h-12 ${bgClass} rounded-xl flex items-center justify-center flex-shrink-0`}
      >
        <Icon className={`w-6 h-6 ${colorClass}`} />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
        <p className="text-xs text-gray-500 mt-0.5 leading-tight">{label}</p>
      </div>
    </div>
  );
}

function StatusBadge({
  active,
  activeLabel = "Activo",
  inactiveLabel = "Inactivo",
}: {
  active: boolean;
  activeLabel?: string;
  inactiveLabel?: string;
}) {
  return active ? (
    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100 text-xs">
      <CheckCircle2 className="w-3 h-3 mr-1" />
      {activeLabel}
    </Badge>
  ) : (
    <Badge className="bg-red-100 text-red-600 border-red-200 hover:bg-red-100 text-xs">
      <XCircle className="w-3 h-3 mr-1" />
      {inactiveLabel}
    </Badge>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
      <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-3">
        <Search className="w-7 h-7" />
      </div>
      <p className="text-sm font-medium">{label}</p>
    </div>
  );
}

function FarmaciasTable({
  farmacias,
  onEdit,
  onToggle,
}: {
  farmacias: Farmacia[];
  onEdit: (f: Farmacia) => void;
  onToggle: (f: Farmacia) => void;
}) {
  if (farmacias.length === 0)
    return <EmptyState label="No se encontraron farmacias" />;

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-gray-100 bg-gray-50/60">
          <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Nombre
          </th>
          <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Email
          </th>
          <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">
            Dirección
          </th>
          <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">
            Horario
          </th>
          <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Estado
          </th>
          <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Acciones
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-50">
        {farmacias.map((f) => (
          <tr
            key={f.id}
            className="hover:bg-gray-50/50 transition-colors group"
          >
            <td className="px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-teal-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-4 h-4 text-teal-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-800 text-sm">
                    {f.nombre}
                  </p>
                  {f.telefono && (
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3" />
                      {f.telefono}
                    </p>
                  )}
                </div>
              </div>
            </td>
            <td className="px-6 py-4 text-gray-600 text-sm">{f.email}</td>
            <td className="px-6 py-4 text-gray-500 text-xs hidden md:table-cell max-w-[180px] truncate">
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                {f.direccion}
              </span>
            </td>
            <td className="px-6 py-4 text-gray-500 text-xs hidden lg:table-cell">
              {f.horario ? (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {f.horario}
                </span>
              ) : (
                <span className="text-gray-300">—</span>
              )}
            </td>
            <td className="px-6 py-4">
              <StatusBadge active={f.activo} />
            </td>
            <td className="px-6 py-4">
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => onEdit(f)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-teal-600 hover:bg-teal-50 transition-colors"
                  title="Editar"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onToggle(f)}
                  className={`p-1.5 rounded-lg transition-colors ${
                    f.activo
                      ? "text-gray-400 hover:text-red-500 hover:bg-red-50"
                      : "text-gray-400 hover:text-emerald-600 hover:bg-emerald-50"
                  }`}
                  title={f.activo ? "Dar de baja" : "Reactivar"}
                >
                  {f.activo ? (
                    <ShieldOff className="w-4 h-4" />
                  ) : (
                    <ShieldCheck className="w-4 h-4" />
                  )}
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function SupervisoresTable({
  supervisores,
  onEdit,
  onToggle,
}: {
  supervisores: Supervisor[];
  onEdit: (s: Supervisor) => void;
  onToggle: (s: Supervisor) => void;
}) {
  if (supervisores.length === 0)
    return <EmptyState label="No se encontraron supervisores" />;

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-gray-100 bg-gray-50/60">
          <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Nombre / Institución
          </th>
          <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Email
          </th>
          <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">
            Dirección
          </th>
          <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Estado
          </th>
          <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Acciones
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-50">
        {supervisores.map((s) => (
          <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
            <td className="px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-cyan-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Users className="w-4 h-4 text-cyan-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-800 text-sm">
                    {s.nombre}
                  </p>
                  {s.telefono && (
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3" />
                      {s.telefono}
                    </p>
                  )}
                </div>
              </div>
            </td>
            <td className="px-6 py-4 text-gray-600 text-sm">{s.email}</td>
            <td className="px-6 py-4 text-gray-500 text-xs hidden md:table-cell max-w-[180px] truncate">
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                {s.direccion}
              </span>
            </td>
            <td className="px-6 py-4">
              <StatusBadge
                active={s.aprobado}
                activeLabel="Activo"
                inactiveLabel="Dado de baja"
              />
            </td>
            <td className="px-6 py-4">
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => onEdit(s)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-teal-600 hover:bg-teal-50 transition-colors"
                  title="Editar"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onToggle(s)}
                  className={`p-1.5 rounded-lg transition-colors ${
                    s.aprobado
                      ? "text-gray-400 hover:text-red-500 hover:bg-red-50"
                      : "text-gray-400 hover:text-emerald-600 hover:bg-emerald-50"
                  }`}
                  title={s.aprobado ? "Dar de baja" : "Reactivar"}
                >
                  {s.aprobado ? (
                    <ShieldOff className="w-4 h-4" />
                  ) : (
                    <ShieldCheck className="w-4 h-4" />
                  )}
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ── Medicamentos Table ─────────────────────────────────────────────────────────
function MedicamentosTable({
  medicamentos,
  onEdit,
  onToggle,
  onDelete,
}: {
  medicamentos: Medicamento[];
  onEdit: (m: Medicamento) => void;
  onToggle: (m: Medicamento) => void;
  onDelete: (m: Medicamento) => void;
}) {
  if (medicamentos.length === 0)
    return <EmptyState label="No se encontraron medicamentos" />;

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-gray-100 bg-gray-50/60">
          <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Nombre Comercial
          </th>
          <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">
            Principio Activo
          </th>
          <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">
            Categoría / Presentación
          </th>
          <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">
            Concentración
          </th>
          <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">
            Usos
          </th>
          <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Estado
          </th>
          <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Acciones
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-50">
        {medicamentos.map((m) => (
          <tr key={m.id} className="hover:bg-gray-50/50 transition-colors">
            <td className="px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-violet-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Pill className="w-4 h-4 text-violet-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-800 text-sm">
                    {m.nombre}
                  </p>
                  {m.descripcion && (
                    <p className="text-xs text-gray-400 truncate max-w-[160px]">
                      {m.descripcion}
                    </p>
                  )}
                </div>
              </div>
            </td>
            <td className="px-6 py-4 text-gray-600 text-sm hidden md:table-cell">
              {m.principioActivo ? (
                <span className="flex items-center gap-1.5">
                  <FlaskConical className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                  {m.principioActivo}
                </span>
              ) : (
                <span className="text-gray-300">—</span>
              )}
            </td>
            <td className="px-6 py-4 hidden lg:table-cell">
              {m.presentacion ? (
                <span className="inline-flex items-center gap-1 bg-violet-50 text-violet-700 text-xs px-2 py-0.5 rounded-full border border-violet-100">
                  <Tag className="w-3 h-3" />
                  {m.presentacion}
                </span>
              ) : (
                <span className="text-gray-300 text-xs">—</span>
              )}
            </td>
            <td className="px-6 py-4 text-gray-500 text-xs hidden lg:table-cell">
              {m.concentracion ?? <span className="text-gray-300">—</span>}
            </td>
            <td className="px-4 py-4 hidden md:table-cell">
              <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                <span title="Solicitudes" className="flex items-center gap-0.5">
                  <ClipboardListIcon className="w-3.5 h-3.5 text-blue-400" />
                  {m._count.solicitudes}
                </span>
                <span title="Donaciones" className="flex items-center gap-0.5">
                  <HeartIcon className="w-3.5 h-3.5 text-emerald-400" />
                  {m._count.donaciones}
                </span>
              </div>
            </td>
            <td className="px-6 py-4">
              <StatusBadge active={m.activo} />
            </td>
            <td className="px-6 py-4">
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => onEdit(m)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-teal-600 hover:bg-teal-50 transition-colors"
                  title="Editar"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onToggle(m)}
                  className={`p-1.5 rounded-lg transition-colors ${
                    m.activo
                      ? "text-gray-400 hover:text-amber-500 hover:bg-amber-50"
                      : "text-gray-400 hover:text-emerald-600 hover:bg-emerald-50"
                  }`}
                  title={m.activo ? "Desactivar" : "Reactivar"}
                >
                  {m.activo ? (
                    <ShieldOff className="w-4 h-4" />
                  ) : (
                    <ShieldCheck className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => onDelete(m)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  title="Eliminar"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// Small inline icon helpers (avoid extra imports)
function ClipboardListIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="M12 11h4" />
      <path d="M12 16h4" />
      <path d="M8 11h.01" />
      <path d="M8 16h.01" />
    </svg>
  );
}

function HeartIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  );
}

// ── Reports Panel ──────────────────────────────────────────────────────────────
type ReportType = "general" | "usuarios" | "donaciones" | "solicitudes";

function InformesPanel({
  reportType,
  reportData,
  reportLoading,
  onSelectType,
  onFetch,
  onExport,
}: {
  reportType: ReportType;
  reportData: unknown;
  reportLoading: boolean;
  onSelectType: (t: ReportType) => void;
  onFetch: () => void;
  onExport: (data: unknown[], filename: string) => void;
}) {
  const types: {
    key: ReportType;
    label: string;
    icon: React.ElementType;
    color: string;
    bg: string;
  }[] = [
    {
      key: "general",
      label: "Resumen General",
      icon: TrendingUp,
      color: "text-teal-600",
      bg: "bg-teal-50",
    },
    {
      key: "usuarios",
      label: "Usuarios",
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      key: "donaciones",
      label: "Donaciones",
      icon: FileText,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      key: "solicitudes",
      label: "Solicitudes",
      icon: BarChart2,
      color: "text-violet-600",
      bg: "bg-violet-50",
    },
  ];

  const general =
    reportType === "general" && reportData
      ? (reportData as {
          resumen: Record<string, number>;
          solicitudesPorEstado: { estado: string; cantidad: number }[];
          donacionesPorEstado: { estado: string; cantidad: number }[];
          topMedicamentos: { nombre: string; totalSolicitudes: number }[];
        })
      : null;

  const tableData =
    reportType !== "general" && Array.isArray(reportData)
      ? (reportData as Record<string, unknown>[])
      : null;

  const getExportData = () => {
    if (reportType === "general" && general) {
      return general.topMedicamentos;
    }
    return tableData ?? [];
  };

  return (
    <div className="p-6 space-y-5">
      {/* Type selector */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {types.map(({ key, label, icon: Icon, color, bg }) => (
          <button
            key={key}
            onClick={() => onSelectType(key)}
            className={`flex items-center gap-2.5 p-3.5 rounded-xl border text-left transition-all ${
              reportType === key
                ? "border-teal-300 bg-teal-50 shadow-sm"
                : "border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50"
            }`}
          >
            <div
              className={`w-8 h-8 ${bg} rounded-lg flex items-center justify-center flex-shrink-0`}
            >
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <span
              className={`text-xs font-medium leading-tight ${reportType === key ? "text-teal-700" : "text-gray-600"}`}
            >
              {label}
            </span>
          </button>
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <Button
          onClick={onFetch}
          disabled={reportLoading}
          className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white rounded-xl h-9 text-sm gap-1.5"
        >
          {reportLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <BarChart2 className="w-4 h-4" />
          )}
          Generar informe
        </Button>
        {reportData && (
          <Button
            variant="outline"
            onClick={() =>
              onExport(
                getExportData(),
                `informe-${reportType}-${new Date().toISOString().split("T")[0]}.csv`,
              )
            }
            className="rounded-xl h-9 text-sm gap-1.5 border-gray-200"
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </Button>
        )}
      </div>

      {/* Results */}
      {reportLoading && (
        <div className="flex items-center justify-center py-12 text-gray-400 gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Generando informe...</span>
        </div>
      )}

      {!reportLoading && general && (
        <div className="space-y-4">
          {/* Summary cards */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {Object.entries(general.resumen).map(([key, value]) => (
              <div
                key={key}
                className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100"
              >
                <p className="text-xl font-bold text-gray-800">{value}</p>
                <p className="text-xs text-gray-500 mt-0.5 capitalize leading-tight">
                  {key
                    .replace("total", "")
                    .replace(/([A-Z])/g, " $1")
                    .trim()}
                </p>
              </div>
            ))}
          </div>

          {/* Top medications */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-teal-600" />
              Top 10 Medicamentos más solicitados
            </h4>
            <div className="overflow-x-auto rounded-xl border border-gray-100">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      #
                    </th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Medicamento
                    </th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Solicitudes
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {general.topMedicamentos.map((m, i) => (
                    <tr key={i} className="hover:bg-gray-50/50">
                      <td className="px-4 py-2.5 text-gray-400 text-xs">
                        {i + 1}
                      </td>
                      <td className="px-4 py-2.5 text-gray-700 font-medium text-xs">
                        {m.nombre}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <span className="bg-teal-100 text-teal-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                          {m.totalSolicitudes}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Status breakdowns */}
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              {
                title: "Solicitudes por estado",
                data: general.solicitudesPorEstado,
                keyLabel: "estado",
                valLabel: "cantidad",
              },
              {
                title: "Donaciones por estado",
                data: general.donacionesPorEstado,
                keyLabel: "estado",
                valLabel: "cantidad",
              },
            ].map(({ title, data, keyLabel, valLabel }) => (
              <div key={title}>
                <h4 className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
                  {title}
                </h4>
                <div className="space-y-1.5">
                  {data.map((item) => (
                    <div
                      key={String(item[keyLabel as keyof typeof item])}
                      className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-1.5 border border-gray-100"
                    >
                      <span className="text-xs text-gray-600">
                        {String(item[keyLabel as keyof typeof item])}
                      </span>
                      <span className="text-xs font-bold text-gray-800">
                        {String(item[valLabel as keyof typeof item])}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!reportLoading && tableData && (
        <div className="overflow-x-auto rounded-xl border border-gray-100">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {Object.keys(tableData[0] ?? {})
                  .slice(0, 7)
                  .map((k) => (
                    <th
                      key={k}
                      className="text-left px-4 py-2.5 font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap"
                    >
                      {k}
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {tableData.slice(0, 50).map((row, i) => (
                <tr key={i} className="hover:bg-gray-50/50">
                  {Object.values(row)
                    .slice(0, 7)
                    .map((val, j) => (
                      <td
                        key={j}
                        className="px-4 py-2 text-gray-600 max-w-[180px] truncate"
                      >
                        {typeof val === "object"
                          ? JSON.stringify(val)
                          : String(val ?? "—")}
                      </td>
                    ))}
                </tr>
              ))}
            </tbody>
          </table>
          {tableData.length > 50 && (
            <p className="text-xs text-gray-400 px-4 py-2 bg-gray-50/40 border-t border-gray-100">
              Mostrando 50 de {tableData.length} registros. Exporta a CSV para
              ver todos.
            </p>
          )}
        </div>
      )}

      {!reportLoading && !reportData && (
        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
          <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-3">
            <BarChart2 className="w-7 h-7" />
          </div>
          <p className="text-sm font-medium">
            Selecciona un tipo y genera el informe
          </p>
        </div>
      )}
    </div>
  );
}

// ── Backup Panel ───────────────────────────────────────────────────────────────
function RespaldoPanel({
  backupLoading,
  onDownload,
}: {
  backupLoading: boolean;
  onDownload: () => void;
}) {
  return (
    <div className="p-8 flex flex-col items-center justify-center text-center min-h-[300px] space-y-5">
      <div className="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center">
        <Database className="w-8 h-8 text-teal-600" />
      </div>
      <div>
        <h3 className="text-lg font-bold text-gray-800">Respaldo de Datos</h3>
        <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">
          Genera un archivo JSON completo con todos los datos del sistema:
          usuarios, farmacias, supervisores, solicitudes, donaciones y
          medicamentos.
        </p>
      </div>
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-3 text-left max-w-md w-full">
        <p className="text-xs font-semibold text-amber-700 mb-1">
          Información incluida en el respaldo:
        </p>
        <ul className="text-xs text-amber-600 space-y-0.5">
          <li>• Usuarios registrados (sin contraseñas)</li>
          <li>• Farmacias y sus datos de contacto</li>
          <li>• Supervisores / entes de salud</li>
          <li>• Solicitudes con sus medicamentos</li>
          <li>• Donaciones con sus medicamentos</li>
          <li>• Catálogo de medicamentos</li>
        </ul>
      </div>
      <Button
        onClick={onDownload}
        disabled={backupLoading}
        size="lg"
        className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white rounded-xl gap-2"
      >
        {backupLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Download className="w-5 h-5" />
        )}
        {backupLoading
          ? "Generando backup..."
          : "Descargar respaldo completo (JSON)"}
      </Button>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function AdminDashboardClient() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<
    "farmacias" | "supervisores" | "medicamentos" | "informes" | "respaldo"
  >("farmacias");
  const [farmacias, setFarmacias] = useState<Farmacia[]>([]);
  const [supervisores, setSupervisores] = useState<Supervisor[]>([]);
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<ModalState>({ type: "none" });
  const [submitting, setSubmitting] = useState(false);
  const [farmaciaForm, setFarmaciaForm] =
    useState<FarmaciaForm>(emptyFarmaciaForm);
  const [supervisorForm, setSupervisorForm] =
    useState<SupervisorForm>(emptySupervisorForm);
  const [farmaciaPage, setFarmaciaPage] = useState(1);
  const [supervisorPage, setSupervisorPage] = useState(1);
  const [medicamentoPage, setMedicamentoPage] = useState(1);
  const [medicamentoForm, setMedicamentoForm] =
    useState<MedicamentoForm>(emptyMedicamentoForm);
  const [reportType, setReportType] = useState<
    "general" | "usuarios" | "donaciones" | "solicitudes"
  >("general");
  const [reportData, setReportData] = useState<unknown>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [backupLoading, setBackupLoading] = useState(false);

  // ── Data ──────────────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [farmRes, supRes, medRes] = await Promise.all([
        fetch("/api/admin/farmacias"),
        fetch("/api/admin/supervisores"),
        fetch("/api/admin/medicamentos"),
      ]);
      if (farmRes.ok) setFarmacias(await farmRes.json());
      if (supRes.ok) setSupervisores(await supRes.json());
      if (medRes.ok) setMedicamentos(await medRes.json());
    } catch {
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const fetchReport = async (type: typeof reportType) => {
    setReportLoading(true);
    setReportData(null);
    try {
      const res = await fetch(`/api/admin/reports?type=${type}`);
      if (!res.ok) throw new Error("Error al obtener informe");
      setReportData(await res.json());
    } catch {
      toast({
        title: "Error",
        description: "No se pudo generar el informe",
        variant: "destructive",
      });
    } finally {
      setReportLoading(false);
    }
  };

  const downloadBackup = async () => {
    setBackupLoading(true);
    try {
      const res = await fetch("/api/admin/backup");
      if (!res.ok) throw new Error("Error al generar backup");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `backup-donaciones-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast({
        title: "Backup descargado",
        description: "El archivo JSON fue generado exitosamente.",
      });
    } catch {
      toast({
        title: "Error",
        description: "No se pudo generar el backup",
        variant: "destructive",
      });
    } finally {
      setBackupLoading(false);
    }
  };

  const exportCSV = (data: unknown[], filename: string) => {
    if (!data.length) return;
    const keys = Object.keys(data[0] as Record<string, unknown>);
    const rows = [
      keys.join(","),
      ...data.map((row) =>
        keys
          .map((k) => {
            const v = (row as Record<string, unknown>)[k];
            const str =
              typeof v === "object" ? JSON.stringify(v) : String(v ?? "");
            return `"${str.replace(/"/g, '""')}"`;
          })
          .join(","),
      ),
    ].join("\n");
    const blob = new Blob([rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Modal openers ─────────────────────────────────────────────────────────────
  const openCreateMedicamento = () => {
    setMedicamentoForm(emptyMedicamentoForm);
    setModal({ type: "medicamento-create" });
  };

  const openEditMedicamento = (item: Medicamento) => {
    setMedicamentoForm({
      nombre: item.nombre,
      principioActivo: item.principioActivo ?? "",
      presentacion: item.presentacion ?? "",
      concentracion: item.concentracion ?? "",
      descripcion: item.descripcion ?? "",
    });
    setModal({ type: "medicamento-edit", item });
  };

  const handleMedicamentoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const isEdit = modal.type === "medicamento-edit";
      const id = isEdit
        ? (modal as { type: "medicamento-edit"; item: Medicamento }).item.id
        : null;
      const url = isEdit
        ? `/api/admin/medicamentos/${id}`
        : "/api/admin/medicamentos";

      const body: Record<string, unknown> = {
        nombre: medicamentoForm.nombre,
        ...(medicamentoForm.principioActivo && {
          principioActivo: medicamentoForm.principioActivo,
        }),
        ...(medicamentoForm.presentacion && {
          presentacion: medicamentoForm.presentacion,
        }),
        ...(medicamentoForm.concentracion && {
          concentracion: medicamentoForm.concentracion,
        }),
        ...(medicamentoForm.descripcion && {
          descripcion: medicamentoForm.descripcion,
        }),
      };

      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive",
        });
        return;
      }
      toast({
        title: isEdit ? "Medicamento actualizado" : "Medicamento creado",
        description: `${medicamentoForm.nombre} fue ${isEdit ? "actualizado" : "creado"} exitosamente.`,
      });
      closeModal();
      loadData();
    } finally {
      setSubmitting(false);
    }
  };

  const toggleMedicamento = async (item: Medicamento) => {
    try {
      const res = await fetch(`/api/admin/medicamentos/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activo: !item.activo }),
      });
      if (!res.ok) {
        const d = await res.json();
        toast({ title: "Error", description: d.error, variant: "destructive" });
        return;
      }
      toast({
        title: item.activo
          ? "Medicamento desactivado"
          : "Medicamento reactivado",
        description: `${item.nombre} fue ${item.activo ? "desactivado" : "reactivado"} exitosamente.`,
      });
      loadData();
    } catch {
      toast({
        title: "Error",
        description: "Error al cambiar estado",
        variant: "destructive",
      });
    }
  };

  const deleteMedicamento = async (item: Medicamento) => {
    if (
      !confirm(
        `¿Eliminar "${item.nombre}"? Si tiene registros asociados, se desactivará en su lugar.`,
      )
    )
      return;
    try {
      const res = await fetch(`/api/admin/medicamentos/${item.id}`, {
        method: "DELETE",
      });
      const d = await res.json();
      toast({ title: "Hecho", description: d.message });
      loadData();
    } catch {
      toast({
        title: "Error",
        description: "Error al eliminar medicamento",
        variant: "destructive",
      });
    }
  };

  const openCreateFarmacia = () => {
    setFarmaciaForm(emptyFarmaciaForm);
    setModal({ type: "farmacia-create" });
  };

  const openEditFarmacia = (item: Farmacia) => {
    setFarmaciaForm({
      nombre: item.nombre,
      email: item.email,
      password: "",
      direccion: item.direccion,
      telefono: item.telefono ?? "",
      horario: item.horario ?? "",
      latitude: item.latitude,
      longitude: item.longitude,
    });
    setModal({ type: "farmacia-edit", item });
  };

  const openCreateSupervisor = () => {
    setSupervisorForm(emptySupervisorForm);
    setModal({ type: "supervisor-create" });
  };

  const openEditSupervisor = (item: Supervisor) => {
    setSupervisorForm({
      nombre: item.nombre,
      email: item.email,
      password: "",
      direccion: item.direccion,
      telefono: item.telefono ?? "",
    });
    setModal({ type: "supervisor-edit", item });
  };

  const closeModal = () => setModal({ type: "none" });

  // ── Submit handlers ───────────────────────────────────────────────────────────
  const handleFarmaciaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const isEdit = modal.type === "farmacia-edit";
      const id = isEdit
        ? (modal as { type: "farmacia-edit"; item: Farmacia }).item.id
        : null;
      const url = isEdit
        ? `/api/admin/farmacias/${id}`
        : "/api/admin/farmacias";

      const body: Record<string, unknown> = {
        nombre: farmaciaForm.nombre,
        email: farmaciaForm.email,
        direccion: farmaciaForm.direccion,
        ...(farmaciaForm.telefono && { telefono: farmaciaForm.telefono }),
        ...(farmaciaForm.horario && { horario: farmaciaForm.horario }),
        ...(farmaciaForm.password && { password: farmaciaForm.password }),
        ...(farmaciaForm.latitude != null && {
          latitude: farmaciaForm.latitude,
        }),
        ...(farmaciaForm.longitude != null && {
          longitude: farmaciaForm.longitude,
        }),
      };

      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: isEdit ? "Farmacia actualizada" : "Farmacia creada",
        description: `${farmaciaForm.nombre} fue ${isEdit ? "actualizada" : "creada"} exitosamente.`,
      });
      closeModal();
      loadData();
    } finally {
      setSubmitting(false);
    }
  };

  const handleSupervisorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const isEdit = modal.type === "supervisor-edit";
      const id = isEdit
        ? (modal as { type: "supervisor-edit"; item: Supervisor }).item.id
        : null;
      const url = isEdit
        ? `/api/admin/supervisores/${id}`
        : "/api/admin/supervisores";

      const body: Record<string, unknown> = {
        nombre: supervisorForm.nombre,
        email: supervisorForm.email,
        direccion: supervisorForm.direccion,
        ...(supervisorForm.telefono && { telefono: supervisorForm.telefono }),
        ...(supervisorForm.password && { password: supervisorForm.password }),
      };

      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: isEdit ? "Supervisor actualizado" : "Supervisor creado",
        description: `${supervisorForm.nombre} fue ${isEdit ? "actualizado" : "creado"} exitosamente.`,
      });
      closeModal();
      loadData();
    } finally {
      setSubmitting(false);
    }
  };

  const toggleFarmacia = async (item: Farmacia) => {
    try {
      const res = await fetch(`/api/admin/farmacias/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activo: !item.activo }),
      });
      if (!res.ok) {
        const d = await res.json();
        toast({ title: "Error", description: d.error, variant: "destructive" });
        return;
      }
      toast({
        title: item.activo ? "Farmacia desactivada" : "Farmacia reactivada",
        description: `${item.nombre} fue ${item.activo ? "desactivada" : "reactivada"} exitosamente.`,
      });
      loadData();
    } catch {
      toast({
        title: "Error",
        description: "Error al cambiar estado",
        variant: "destructive",
      });
    }
  };

  const toggleSupervisor = async (item: Supervisor) => {
    try {
      const res = await fetch(`/api/admin/supervisores/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aprobado: !item.aprobado }),
      });
      if (!res.ok) {
        const d = await res.json();
        toast({ title: "Error", description: d.error, variant: "destructive" });
        return;
      }
      toast({
        title: item.aprobado
          ? "Supervisor dado de baja"
          : "Supervisor reactivado",
        description: `${item.nombre} fue ${item.aprobado ? "dado de baja" : "reactivado"} exitosamente.`,
      });
      loadData();
    } catch {
      toast({
        title: "Error",
        description: "Error al cambiar estado",
        variant: "destructive",
      });
    }
  };

  // ── Filtered + paginated data ──────────────────────────────────────────────────
  const q = search.toLowerCase();
  const filteredFarmacias = farmacias.filter(
    (f) =>
      f.nombre.toLowerCase().includes(q) ||
      f.email.toLowerCase().includes(q) ||
      f.direccion.toLowerCase().includes(q),
  );
  const filteredSupervisores = supervisores.filter(
    (s) =>
      s.nombre.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      s.direccion.toLowerCase().includes(q),
  );
  const filteredMedicamentos = medicamentos.filter(
    (m) =>
      m.nombre.toLowerCase().includes(q) ||
      (m.principioActivo ?? "").toLowerCase().includes(q) ||
      (m.presentacion ?? "").toLowerCase().includes(q),
  );

  const farmaciaPages = Math.max(
    1,
    Math.ceil(filteredFarmacias.length / PAGE_SIZE),
  );
  const supervisorPages = Math.max(
    1,
    Math.ceil(filteredSupervisores.length / PAGE_SIZE),
  );
  const medicamentoPages = Math.max(
    1,
    Math.ceil(filteredMedicamentos.length / PAGE_SIZE),
  );
  const pagedFarmacias = filteredFarmacias.slice(
    (farmaciaPage - 1) * PAGE_SIZE,
    farmaciaPage * PAGE_SIZE,
  );
  const pagedSupervisores = filteredSupervisores.slice(
    (supervisorPage - 1) * PAGE_SIZE,
    supervisorPage * PAGE_SIZE,
  );
  const pagedMedicamentos = filteredMedicamentos.slice(
    (medicamentoPage - 1) * PAGE_SIZE,
    medicamentoPage * PAGE_SIZE,
  );

  // ── Derived state ─────────────────────────────────────────────────────────────
  const isFarmaciaModal =
    modal.type === "farmacia-create" || modal.type === "farmacia-edit";
  const isSupervisorModal =
    modal.type === "supervisor-create" || modal.type === "supervisor-edit";
  const isMedicamentoModal =
    modal.type === "medicamento-create" || modal.type === "medicamento-edit";
  const isEditMode =
    modal.type === "farmacia-edit" ||
    modal.type === "supervisor-edit" ||
    modal.type === "medicamento-edit";

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Farmacias"
          value={loading ? "–" : farmacias.length}
          icon={Building2}
          colorClass="text-teal-600"
          bgClass="bg-teal-50"
          borderClass="border-teal-100"
        />
        <StatCard
          label="Farmacias Activas"
          value={loading ? "–" : farmacias.filter((f) => f.activo).length}
          icon={CheckCircle2}
          colorClass="text-emerald-600"
          bgClass="bg-emerald-50"
          borderClass="border-emerald-100"
        />
        <StatCard
          label="Medicamentos en catálogo"
          value={loading ? "–" : medicamentos.filter((m) => m.activo).length}
          icon={Pill}
          colorClass="text-violet-600"
          bgClass="bg-violet-50"
          borderClass="border-violet-100"
        />
        <StatCard
          label="Supervisores Activos"
          value={loading ? "–" : supervisores.filter((s) => s.aprobado).length}
          icon={ShieldCheck}
          colorClass="text-blue-600"
          bgClass="bg-blue-50"
          borderClass="border-blue-100"
        />
      </div>

      {/* Main card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Tabs header */}
        <div className="flex items-center justify-between px-6 border-b border-gray-100 overflow-x-auto">
          <div className="flex flex-shrink-0">
            {[
              {
                key: "farmacias" as const,
                label: "Farmacias",
                icon: Building2,
                badge: farmacias.length,
              },
              {
                key: "supervisores" as const,
                label: "Supervisores",
                icon: Users,
                badge: supervisores.length,
              },
              {
                key: "medicamentos" as const,
                label: "Medicamentos",
                icon: Pill,
                badge: medicamentos.length,
              },
              {
                key: "informes" as const,
                label: "Informes",
                icon: BarChart2,
                badge: null,
              },
              {
                key: "respaldo" as const,
                label: "Respaldo",
                icon: Database,
                badge: null,
              },
            ].map(({ key, label, icon: Icon, badge }) => (
              <button
                key={key}
                onClick={() => {
                  setActiveTab(key);
                  setSearch("");
                  setFarmaciaPage(1);
                  setSupervisorPage(1);
                }}
                className={`flex items-center gap-2 px-5 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === key
                    ? "border-teal-600 text-teal-700"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
                {badge !== null && (
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                      activeTab === key
                        ? "bg-teal-100 text-teal-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {badge}
                  </span>
                )}
              </button>
            ))}
          </div>
          <button
            onClick={loadData}
            disabled={loading}
            className="p-2 text-gray-400 hover:text-teal-600 rounded-lg hover:bg-teal-50 transition-colors flex-shrink-0"
            title="Actualizar datos"
          >
            <RefreshCw
              className={`w-4 h-4 ${loading ? "animate-spin text-teal-500" : ""}`}
            />
          </button>
        </div>

        {/* Toolbar - only for table tabs */}
        {(activeTab === "farmacias" ||
          activeTab === "supervisores" ||
          activeTab === "medicamentos") && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <Input
                placeholder={
                  activeTab === "farmacias"
                    ? "Buscar farmacia..."
                    : activeTab === "supervisores"
                      ? "Buscar supervisor..."
                      : "Buscar medicamento, principio activo..."
                }
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setFarmaciaPage(1);
                  setSupervisorPage(1);
                  setMedicamentoPage(1);
                }}
                className="pl-9 h-9 border-gray-200 rounded-xl text-sm focus:border-teal-400"
              />
            </div>
            <Button
              onClick={
                activeTab === "farmacias"
                  ? openCreateFarmacia
                  : activeTab === "supervisores"
                    ? openCreateSupervisor
                    : openCreateMedicamento
              }
              className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white rounded-xl h-9 text-sm gap-1.5"
            >
              <Plus className="w-4 h-4" />
              {activeTab === "farmacias"
                ? "Nueva Farmacia"
                : activeTab === "supervisores"
                  ? "Nuevo Supervisor"
                  : "Nuevo Medicamento"}
            </Button>
          </div>
        )}

        {/* Table area */}
        <div className="overflow-x-auto min-h-[300px]">
          {activeTab === "farmacias" ||
          activeTab === "supervisores" ||
          activeTab === "medicamentos" ? (
            loading ? (
              <div className="flex items-center justify-center h-48 text-gray-400 gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm">Cargando datos...</span>
              </div>
            ) : activeTab === "farmacias" ? (
              <FarmaciasTable
                farmacias={pagedFarmacias}
                onEdit={openEditFarmacia}
                onToggle={toggleFarmacia}
              />
            ) : activeTab === "supervisores" ? (
              <SupervisoresTable
                supervisores={pagedSupervisores}
                onEdit={openEditSupervisor}
                onToggle={toggleSupervisor}
              />
            ) : (
              <MedicamentosTable
                medicamentos={pagedMedicamentos}
                onEdit={openEditMedicamento}
                onToggle={toggleMedicamento}
                onDelete={deleteMedicamento}
              />
            )
          ) : activeTab === "informes" ? (
            <InformesPanel
              reportType={reportType}
              reportData={reportData}
              reportLoading={reportLoading}
              onSelectType={(t) => {
                setReportType(t);
                setReportData(null);
              }}
              onFetch={() => fetchReport(reportType)}
              onExport={exportCSV}
            />
          ) : (
            <RespaldoPanel
              backupLoading={backupLoading}
              onDownload={downloadBackup}
            />
          )}
        </div>

        {/* Pagination - only for table tabs */}
        {!loading &&
          (activeTab === "farmacias" ||
            activeTab === "supervisores" ||
            activeTab === "medicamentos") && (
            <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100 bg-gray-50/40">
              {activeTab === "farmacias" ? (
                <>
                  <span className="text-xs text-gray-500">
                    {filteredFarmacias.length === 0
                      ? "0 farmacias"
                      : `${(farmaciaPage - 1) * PAGE_SIZE + 1}–${Math.min(farmaciaPage * PAGE_SIZE, filteredFarmacias.length)} de ${filteredFarmacias.length}`}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setFarmaciaPage((p) => Math.max(1, p - 1))}
                      disabled={farmaciaPage === 1}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-teal-600 hover:bg-teal-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    {Array.from({ length: farmaciaPages }, (_, i) => i + 1).map(
                      (p) => (
                        <button
                          key={p}
                          onClick={() => setFarmaciaPage(p)}
                          className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${
                            p === farmaciaPage
                              ? "bg-teal-600 text-white"
                              : "text-gray-500 hover:bg-gray-100"
                          }`}
                        >
                          {p}
                        </button>
                      ),
                    )}
                    <button
                      onClick={() =>
                        setFarmaciaPage((p) => Math.min(farmaciaPages, p + 1))
                      }
                      disabled={farmaciaPage === farmaciaPages}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-teal-600 hover:bg-teal-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </>
              ) : activeTab === "supervisores" ? (
                <>
                  <span className="text-xs text-gray-500">
                    {filteredSupervisores.length === 0
                      ? "0 supervisores"
                      : `${(supervisorPage - 1) * PAGE_SIZE + 1}–${Math.min(supervisorPage * PAGE_SIZE, filteredSupervisores.length)} de ${filteredSupervisores.length}`}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() =>
                        setSupervisorPage((p) => Math.max(1, p - 1))
                      }
                      disabled={supervisorPage === 1}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-teal-600 hover:bg-teal-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    {Array.from(
                      { length: supervisorPages },
                      (_, i) => i + 1,
                    ).map((p) => (
                      <button
                        key={p}
                        onClick={() => setSupervisorPage(p)}
                        className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${
                          p === supervisorPage
                            ? "bg-teal-600 text-white"
                            : "text-gray-500 hover:bg-gray-100"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                    <button
                      onClick={() =>
                        setSupervisorPage((p) =>
                          Math.min(supervisorPages, p + 1),
                        )
                      }
                      disabled={supervisorPage === supervisorPages}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-teal-600 hover:bg-teal-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <span className="text-xs text-gray-500">
                    {filteredMedicamentos.length === 0
                      ? "0 medicamentos"
                      : `${(medicamentoPage - 1) * PAGE_SIZE + 1}–${Math.min(medicamentoPage * PAGE_SIZE, filteredMedicamentos.length)} de ${filteredMedicamentos.length}`}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() =>
                        setMedicamentoPage((p) => Math.max(1, p - 1))
                      }
                      disabled={medicamentoPage === 1}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-teal-600 hover:bg-teal-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    {Array.from(
                      { length: medicamentoPages },
                      (_, i) => i + 1,
                    ).map((p) => (
                      <button
                        key={p}
                        onClick={() => setMedicamentoPage(p)}
                        className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${
                          p === medicamentoPage
                            ? "bg-teal-600 text-white"
                            : "text-gray-500 hover:bg-gray-100"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                    <button
                      onClick={() =>
                        setMedicamentoPage((p) =>
                          Math.min(medicamentoPages, p + 1),
                        )
                      }
                      disabled={medicamentoPage === medicamentoPages}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-teal-600 hover:bg-teal-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
      </div>

      {/* ── Farmacia Modal ──────────────────────────────────────────────────────── */}
      <Dialog
        open={isFarmaciaModal}
        onOpenChange={(open) => !open && closeModal()}
      >
        <DialogContent className="sm:max-w-2xl rounded-2xl gap-0 p-0 overflow-hidden max-h-[90vh] flex flex-col">
          <div className="bg-gradient-to-r from-teal-600 to-cyan-600 px-6 py-5 flex-shrink-0">
            <DialogTitle className="text-white font-bold text-lg">
              {isEditMode ? "Editar Farmacia" : "Nueva Farmacia"}
            </DialogTitle>
            <p className="text-teal-100 text-xs mt-0.5">
              {isEditMode
                ? "Modifica los datos de la farmacia"
                : "Completa los datos para crear una farmacia"}
            </p>
          </div>
          <form
            onSubmit={handleFarmaciaSubmit}
            className="p-6 space-y-4 overflow-y-auto flex-1"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Nombre *
                </Label>
                <Input
                  required
                  value={farmaciaForm.nombre}
                  onChange={(e) =>
                    setFarmaciaForm({ ...farmaciaForm, nombre: e.target.value })
                  }
                  placeholder="Farmacia Central"
                  className="h-10 rounded-xl border-gray-200 focus:border-teal-400"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Email *
                </Label>
                <Input
                  required
                  type="email"
                  value={farmaciaForm.email}
                  onChange={(e) =>
                    setFarmaciaForm({ ...farmaciaForm, email: e.target.value })
                  }
                  placeholder="farmacia@email.com"
                  className="h-10 rounded-xl border-gray-200 focus:border-teal-400"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Contraseña{" "}
                  {isEditMode && (
                    <span className="text-gray-400 normal-case font-normal">
                      (vacío = sin cambios)
                    </span>
                  )}
                  {!isEditMode && " *"}
                </Label>
                <Input
                  required={!isEditMode}
                  type="password"
                  value={farmaciaForm.password}
                  onChange={(e) =>
                    setFarmaciaForm({
                      ...farmaciaForm,
                      password: e.target.value,
                    })
                  }
                  placeholder="••••••••"
                  className="h-10 rounded-xl border-gray-200 focus:border-teal-400"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Teléfono
                </Label>
                <Input
                  value={farmaciaForm.telefono}
                  onChange={(e) =>
                    setFarmaciaForm({
                      ...farmaciaForm,
                      telefono: e.target.value,
                    })
                  }
                  placeholder="+58 412 000 0000"
                  className="h-10 rounded-xl border-gray-200 focus:border-teal-400"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Horario
                </Label>
                <Input
                  value={farmaciaForm.horario}
                  onChange={(e) =>
                    setFarmaciaForm({
                      ...farmaciaForm,
                      horario: e.target.value,
                    })
                  }
                  placeholder="Lun–Vie 8am–6pm"
                  className="h-10 rounded-xl border-gray-200 focus:border-teal-400"
                />
              </div>
            </div>

            {/* Location */}
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Dirección *
                </Label>
                <Input
                  required
                  value={farmaciaForm.direccion}
                  onChange={(e) =>
                    setFarmaciaForm({
                      ...farmaciaForm,
                      direccion: e.target.value,
                    })
                  }
                  placeholder="Av. Principal, Edificio A, Local 1"
                  className="h-10 rounded-xl border-gray-200 focus:border-teal-400"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-teal-600" />
                  Ubicación en el mapa
                  <span className="text-gray-400 normal-case font-normal">
                    (haz clic para marcar)
                  </span>
                </Label>
                <LocationPickerMap
                  value={
                    farmaciaForm.latitude != null &&
                    farmaciaForm.longitude != null
                      ? {
                          lat: farmaciaForm.latitude,
                          lng: farmaciaForm.longitude,
                        }
                      : null
                  }
                  onChange={({ lat, lng }) =>
                    setFarmaciaForm({
                      ...farmaciaForm,
                      latitude: lat,
                      longitude: lng,
                    })
                  }
                  height="260px"
                />
                {farmaciaForm.latitude != null && (
                  <p className="text-xs text-teal-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Lat: {farmaciaForm.latitude.toFixed(6)}, Lng:{" "}
                    {farmaciaForm.longitude?.toFixed(6)}
                  </p>
                )}
              </div>
            </div>

            <DialogFooter className="pt-2 gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={closeModal}
                className="rounded-xl"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white rounded-xl min-w-[130px]"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                {isEditMode ? "Guardar cambios" : "Crear farmacia"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Supervisor Modal ────────────────────────────────────────────────────── */}
      <Dialog
        open={isSupervisorModal}
        onOpenChange={(open) => !open && closeModal()}
      >
        <DialogContent className="sm:max-w-lg rounded-2xl gap-0 p-0 overflow-hidden">
          <div className="bg-gradient-to-r from-cyan-600 to-teal-600 px-6 py-5">
            <DialogTitle className="text-white font-bold text-lg">
              {isEditMode ? "Editar Supervisor" : "Nuevo Supervisor"}
            </DialogTitle>
            <p className="text-cyan-100 text-xs mt-0.5">
              {isEditMode
                ? "Modifica los datos del supervisor"
                : "Completa los datos para crear un supervisor"}
            </p>
          </div>
          <form onSubmit={handleSupervisorSubmit} className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Nombre / Institución *
                </Label>
                <Input
                  required
                  value={supervisorForm.nombre}
                  onChange={(e) =>
                    setSupervisorForm({
                      ...supervisorForm,
                      nombre: e.target.value,
                    })
                  }
                  placeholder="Hospital Central"
                  className="h-10 rounded-xl border-gray-200 focus:border-cyan-400"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Email *
                </Label>
                <Input
                  required
                  type="email"
                  value={supervisorForm.email}
                  onChange={(e) =>
                    setSupervisorForm({
                      ...supervisorForm,
                      email: e.target.value,
                    })
                  }
                  placeholder="supervisor@hospital.com"
                  className="h-10 rounded-xl border-gray-200 focus:border-cyan-400"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Contraseña{" "}
                  {isEditMode && (
                    <span className="text-gray-400 normal-case font-normal">
                      (vacío = sin cambios)
                    </span>
                  )}
                  {!isEditMode && " *"}
                </Label>
                <Input
                  required={!isEditMode}
                  type="password"
                  value={supervisorForm.password}
                  onChange={(e) =>
                    setSupervisorForm({
                      ...supervisorForm,
                      password: e.target.value,
                    })
                  }
                  placeholder="••••••••"
                  className="h-10 rounded-xl border-gray-200 focus:border-cyan-400"
                />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Dirección *
                </Label>
                <Input
                  required
                  value={supervisorForm.direccion}
                  onChange={(e) =>
                    setSupervisorForm({
                      ...supervisorForm,
                      direccion: e.target.value,
                    })
                  }
                  placeholder="Av. Hospital, Piso 2, Oficina 5"
                  className="h-10 rounded-xl border-gray-200 focus:border-cyan-400"
                />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Teléfono
                </Label>
                <Input
                  value={supervisorForm.telefono}
                  onChange={(e) =>
                    setSupervisorForm({
                      ...supervisorForm,
                      telefono: e.target.value,
                    })
                  }
                  placeholder="+58 412 000 0000"
                  className="h-10 rounded-xl border-gray-200 focus:border-cyan-400"
                />
              </div>
            </div>
            <DialogFooter className="pt-2 gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={closeModal}
                className="rounded-xl"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white rounded-xl min-w-[140px]"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                {isEditMode ? "Guardar cambios" : "Crear supervisor"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Medicamento Modal ───────────────────────────────────────────────────── */}
      <Dialog
        open={isMedicamentoModal}
        onOpenChange={(open) => !open && closeModal()}
      >
        <DialogContent className="sm:max-w-lg rounded-2xl gap-0 p-0 overflow-hidden">
          <div className="bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-5">
            <DialogTitle className="text-white font-bold text-lg">
              {isEditMode ? "Editar Medicamento" : "Nuevo Medicamento"}
            </DialogTitle>
            <p className="text-violet-100 text-xs mt-0.5">
              {isEditMode
                ? "Modifica los datos del medicamento"
                : "Añade un nuevo medicamento al catálogo"}
            </p>
          </div>
          <form onSubmit={handleMedicamentoSubmit} className="p-6 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Nombre Comercial *
              </Label>
              <Input
                required
                value={medicamentoForm.nombre}
                onChange={(e) =>
                  setMedicamentoForm({
                    ...medicamentoForm,
                    nombre: e.target.value,
                  })
                }
                placeholder="Ej: Paracetamol 500mg, Amoxil, Voltarén"
                className="h-10 rounded-xl border-gray-200 focus:border-violet-400"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Nombre Genérico / Principio Activo
              </Label>
              <Input
                value={medicamentoForm.principioActivo}
                onChange={(e) =>
                  setMedicamentoForm({
                    ...medicamentoForm,
                    principioActivo: e.target.value,
                  })
                }
                placeholder="Ej: Paracetamol, Amoxicilina, Diclofenaco"
                className="h-10 rounded-xl border-gray-200 focus:border-violet-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Categoría / Presentación
                </Label>
                <select
                  value={medicamentoForm.presentacion}
                  onChange={(e) =>
                    setMedicamentoForm({
                      ...medicamentoForm,
                      presentacion: e.target.value,
                    })
                  }
                  className="w-full h-10 rounded-xl border border-gray-200 focus:border-violet-400 focus:outline-none px-3 text-sm text-gray-700 bg-white"
                >
                  <option value="">Seleccionar...</option>
                  {PRESENTACIONES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Concentración / Dosis
                </Label>
                <Input
                  value={medicamentoForm.concentracion}
                  onChange={(e) =>
                    setMedicamentoForm({
                      ...medicamentoForm,
                      concentracion: e.target.value,
                    })
                  }
                  placeholder="Ej: 500mg, 250mg/5ml"
                  className="h-10 rounded-xl border-gray-200 focus:border-violet-400"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Descripción
              </Label>
              <Input
                value={medicamentoForm.descripcion}
                onChange={(e) =>
                  setMedicamentoForm({
                    ...medicamentoForm,
                    descripcion: e.target.value,
                  })
                }
                placeholder="Indicaciones, usos o notas adicionales"
                className="h-10 rounded-xl border-gray-200 focus:border-violet-400"
              />
            </div>

            <DialogFooter className="pt-2 gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={closeModal}
                className="rounded-xl"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-xl min-w-[150px]"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                {isEditMode ? "Guardar cambios" : "Crear medicamento"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
