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
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
};

type SupervisorForm = {
  nombre: string;
  email: string;
  password: string;
  direccion: string;
  telefono: string;
};

type ModalState =
  | { type: "none" }
  | { type: "farmacia-create" }
  | { type: "farmacia-edit"; item: Farmacia }
  | { type: "supervisor-create" }
  | { type: "supervisor-edit"; item: Supervisor };

// ── Defaults ───────────────────────────────────────────────────────────────────
const emptyFarmaciaForm: FarmaciaForm = {
  nombre: "",
  email: "",
  password: "",
  direccion: "",
  telefono: "",
  horario: "",
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
    <div className={`bg-white rounded-2xl p-5 border ${borderClass} flex items-center gap-4 shadow-sm`}>
      <div className={`w-12 h-12 ${bgClass} rounded-xl flex items-center justify-center flex-shrink-0`}>
        <Icon className={`w-6 h-6 ${colorClass}`} />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
        <p className="text-xs text-gray-500 mt-0.5 leading-tight">{label}</p>
      </div>
    </div>
  );
}

function StatusBadge({ active, activeLabel = "Activo", inactiveLabel = "Inactivo" }: { active: boolean; activeLabel?: string; inactiveLabel?: string }) {
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
  if (farmacias.length === 0) return <EmptyState label="No se encontraron farmacias" />;

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-gray-100 bg-gray-50/60">
          <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nombre</th>
          <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
          <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Dirección</th>
          <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Horario</th>
          <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
          <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-50">
        {farmacias.map((f) => (
          <tr key={f.id} className="hover:bg-gray-50/50 transition-colors group">
            <td className="px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-teal-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-4 h-4 text-teal-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-800 text-sm">{f.nombre}</p>
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
                  {f.activo ? <ShieldOff className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
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
  if (supervisores.length === 0) return <EmptyState label="No se encontraron supervisores" />;

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-gray-100 bg-gray-50/60">
          <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nombre / Institución</th>
          <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
          <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Dirección</th>
          <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
          <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
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
                  <p className="font-medium text-gray-800 text-sm">{s.nombre}</p>
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
              <StatusBadge active={s.aprobado} activeLabel="Activo" inactiveLabel="Dado de baja" />
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
                  {s.aprobado ? <ShieldOff className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function AdminDashboardClient() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"farmacias" | "supervisores">("farmacias");
  const [farmacias, setFarmacias] = useState<Farmacia[]>([]);
  const [supervisores, setSupervisores] = useState<Supervisor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<ModalState>({ type: "none" });
  const [submitting, setSubmitting] = useState(false);
  const [farmaciaForm, setFarmaciaForm] = useState<FarmaciaForm>(emptyFarmaciaForm);
  const [supervisorForm, setSupervisorForm] = useState<SupervisorForm>(emptySupervisorForm);

  // ── Data ──────────────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [farmRes, supRes] = await Promise.all([
        fetch("/api/admin/farmacias"),
        fetch("/api/admin/supervisores"),
      ]);
      if (farmRes.ok) setFarmacias(await farmRes.json());
      if (supRes.ok) setSupervisores(await supRes.json());
    } catch {
      toast({ title: "Error", description: "No se pudieron cargar los datos", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Modal openers ─────────────────────────────────────────────────────────────
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
      const id = isEdit ? (modal as { type: "farmacia-edit"; item: Farmacia }).item.id : null;
      const url = isEdit ? `/api/admin/farmacias/${id}` : "/api/admin/farmacias";

      const body: Record<string, unknown> = {
        nombre: farmaciaForm.nombre,
        email: farmaciaForm.email,
        direccion: farmaciaForm.direccion,
        ...(farmaciaForm.telefono && { telefono: farmaciaForm.telefono }),
        ...(farmaciaForm.horario && { horario: farmaciaForm.horario }),
        ...(farmaciaForm.password && { password: farmaciaForm.password }),
      };

      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        toast({ title: "Error", description: data.error, variant: "destructive" });
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
      const id = isEdit ? (modal as { type: "supervisor-edit"; item: Supervisor }).item.id : null;
      const url = isEdit ? `/api/admin/supervisores/${id}` : "/api/admin/supervisores";

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
        toast({ title: "Error", description: data.error, variant: "destructive" });
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
      toast({ title: "Error", description: "Error al cambiar estado", variant: "destructive" });
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
        title: item.aprobado ? "Supervisor dado de baja" : "Supervisor reactivado",
        description: `${item.nombre} fue ${item.aprobado ? "dado de baja" : "reactivado"} exitosamente.`,
      });
      loadData();
    } catch {
      toast({ title: "Error", description: "Error al cambiar estado", variant: "destructive" });
    }
  };

  // ── Filtered data ─────────────────────────────────────────────────────────────
  const q = search.toLowerCase();
  const filteredFarmacias = farmacias.filter(
    (f) => f.nombre.toLowerCase().includes(q) || f.email.toLowerCase().includes(q) || f.direccion.toLowerCase().includes(q)
  );
  const filteredSupervisores = supervisores.filter(
    (s) => s.nombre.toLowerCase().includes(q) || s.email.toLowerCase().includes(q) || s.direccion.toLowerCase().includes(q)
  );

  // ── Derived state ─────────────────────────────────────────────────────────────
  const isFarmaciaModal = modal.type === "farmacia-create" || modal.type === "farmacia-edit";
  const isSupervisorModal = modal.type === "supervisor-create" || modal.type === "supervisor-edit";
  const isEditMode = modal.type === "farmacia-edit" || modal.type === "supervisor-edit";

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
          label="Total Supervisores"
          value={loading ? "–" : supervisores.length}
          icon={Users}
          colorClass="text-cyan-600"
          bgClass="bg-cyan-50"
          borderClass="border-cyan-100"
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
        <div className="flex items-center justify-between px-6 border-b border-gray-100">
          <div className="flex">
            {(
              [
                { key: "farmacias", label: "Farmacias", icon: Building2, count: farmacias.length },
                { key: "supervisores", label: "Supervisores", icon: Users, count: supervisores.length },
              ] as const
            ).map(({ key, label, icon: Icon, count }) => (
              <button
                key={key}
                onClick={() => { setActiveTab(key); setSearch(""); }}
                className={`flex items-center gap-2 px-5 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === key
                    ? "border-teal-600 text-teal-700"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                    activeTab === key ? "bg-teal-100 text-teal-700" : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {count}
                </span>
              </button>
            ))}
          </div>
          <button
            onClick={loadData}
            disabled={loading}
            className="p-2 text-gray-400 hover:text-teal-600 rounded-lg hover:bg-teal-50 transition-colors"
            title="Actualizar datos"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-teal-500" : ""}`} />
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <Input
              placeholder={activeTab === "farmacias" ? "Buscar farmacia..." : "Buscar supervisor..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 border-gray-200 rounded-xl text-sm focus:border-teal-400"
            />
          </div>
          <Button
            onClick={activeTab === "farmacias" ? openCreateFarmacia : openCreateSupervisor}
            className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white rounded-xl h-9 text-sm gap-1.5"
          >
            <Plus className="w-4 h-4" />
            {activeTab === "farmacias" ? "Nueva Farmacia" : "Nuevo Supervisor"}
          </Button>
        </div>

        {/* Table area */}
        <div className="overflow-x-auto min-h-[300px]">
          {loading ? (
            <div className="flex items-center justify-center h-48 text-gray-400 gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Cargando datos...</span>
            </div>
          ) : activeTab === "farmacias" ? (
            <FarmaciasTable farmacias={filteredFarmacias} onEdit={openEditFarmacia} onToggle={toggleFarmacia} />
          ) : (
            <SupervisoresTable supervisores={filteredSupervisores} onEdit={openEditSupervisor} onToggle={toggleSupervisor} />
          )}
        </div>
      </div>

      {/* ── Farmacia Modal ──────────────────────────────────────────────────────── */}
      <Dialog open={isFarmaciaModal} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent className="sm:max-w-lg rounded-2xl gap-0 p-0 overflow-hidden">
          <div className="bg-gradient-to-r from-teal-600 to-cyan-600 px-6 py-5">
            <DialogTitle className="text-white font-bold text-lg">
              {isEditMode ? "Editar Farmacia" : "Nueva Farmacia"}
            </DialogTitle>
            <p className="text-teal-100 text-xs mt-0.5">
              {isEditMode ? "Modifica los datos de la farmacia" : "Completa los datos para crear una farmacia"}
            </p>
          </div>
          <form onSubmit={handleFarmaciaSubmit} className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Nombre *</Label>
                <Input
                  required
                  value={farmaciaForm.nombre}
                  onChange={(e) => setFarmaciaForm({ ...farmaciaForm, nombre: e.target.value })}
                  placeholder="Farmacia Central"
                  className="h-10 rounded-xl border-gray-200 focus:border-teal-400"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Email *</Label>
                <Input
                  required
                  type="email"
                  value={farmaciaForm.email}
                  onChange={(e) => setFarmaciaForm({ ...farmaciaForm, email: e.target.value })}
                  placeholder="farmacia@email.com"
                  className="h-10 rounded-xl border-gray-200 focus:border-teal-400"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Contraseña {isEditMode && <span className="text-gray-400 normal-case font-normal">(vacío = sin cambios)</span>}
                  {!isEditMode && " *"}
                </Label>
                <Input
                  required={!isEditMode}
                  type="password"
                  value={farmaciaForm.password}
                  onChange={(e) => setFarmaciaForm({ ...farmaciaForm, password: e.target.value })}
                  placeholder="••••••••"
                  className="h-10 rounded-xl border-gray-200 focus:border-teal-400"
                />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Dirección *</Label>
                <Input
                  required
                  value={farmaciaForm.direccion}
                  onChange={(e) => setFarmaciaForm({ ...farmaciaForm, direccion: e.target.value })}
                  placeholder="Av. Principal, Edificio A, Local 1"
                  className="h-10 rounded-xl border-gray-200 focus:border-teal-400"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Teléfono</Label>
                <Input
                  value={farmaciaForm.telefono}
                  onChange={(e) => setFarmaciaForm({ ...farmaciaForm, telefono: e.target.value })}
                  placeholder="+58 412 000 0000"
                  className="h-10 rounded-xl border-gray-200 focus:border-teal-400"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Horario</Label>
                <Input
                  value={farmaciaForm.horario}
                  onChange={(e) => setFarmaciaForm({ ...farmaciaForm, horario: e.target.value })}
                  placeholder="Lun–Vie 8am–6pm"
                  className="h-10 rounded-xl border-gray-200 focus:border-teal-400"
                />
              </div>
            </div>
            <DialogFooter className="pt-2 gap-2">
              <Button type="button" variant="ghost" onClick={closeModal} className="rounded-xl">
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white rounded-xl min-w-[130px]"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {isEditMode ? "Guardar cambios" : "Crear farmacia"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Supervisor Modal ────────────────────────────────────────────────────── */}
      <Dialog open={isSupervisorModal} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent className="sm:max-w-lg rounded-2xl gap-0 p-0 overflow-hidden">
          <div className="bg-gradient-to-r from-cyan-600 to-teal-600 px-6 py-5">
            <DialogTitle className="text-white font-bold text-lg">
              {isEditMode ? "Editar Supervisor" : "Nuevo Supervisor"}
            </DialogTitle>
            <p className="text-cyan-100 text-xs mt-0.5">
              {isEditMode ? "Modifica los datos del supervisor" : "Completa los datos para crear un supervisor"}
            </p>
          </div>
          <form onSubmit={handleSupervisorSubmit} className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Nombre / Institución *</Label>
                <Input
                  required
                  value={supervisorForm.nombre}
                  onChange={(e) => setSupervisorForm({ ...supervisorForm, nombre: e.target.value })}
                  placeholder="Hospital Central"
                  className="h-10 rounded-xl border-gray-200 focus:border-cyan-400"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Email *</Label>
                <Input
                  required
                  type="email"
                  value={supervisorForm.email}
                  onChange={(e) => setSupervisorForm({ ...supervisorForm, email: e.target.value })}
                  placeholder="supervisor@hospital.com"
                  className="h-10 rounded-xl border-gray-200 focus:border-cyan-400"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Contraseña {isEditMode && <span className="text-gray-400 normal-case font-normal">(vacío = sin cambios)</span>}
                  {!isEditMode && " *"}
                </Label>
                <Input
                  required={!isEditMode}
                  type="password"
                  value={supervisorForm.password}
                  onChange={(e) => setSupervisorForm({ ...supervisorForm, password: e.target.value })}
                  placeholder="••••••••"
                  className="h-10 rounded-xl border-gray-200 focus:border-cyan-400"
                />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Dirección *</Label>
                <Input
                  required
                  value={supervisorForm.direccion}
                  onChange={(e) => setSupervisorForm({ ...supervisorForm, direccion: e.target.value })}
                  placeholder="Av. Hospital, Piso 2, Oficina 5"
                  className="h-10 rounded-xl border-gray-200 focus:border-cyan-400"
                />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Teléfono</Label>
                <Input
                  value={supervisorForm.telefono}
                  onChange={(e) => setSupervisorForm({ ...supervisorForm, telefono: e.target.value })}
                  placeholder="+58 412 000 0000"
                  className="h-10 rounded-xl border-gray-200 focus:border-cyan-400"
                />
              </div>
            </div>
            <DialogFooter className="pt-2 gap-2">
              <Button type="button" variant="ghost" onClick={closeModal} className="rounded-xl">
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white rounded-xl min-w-[140px]"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {isEditMode ? "Guardar cambios" : "Crear supervisor"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
