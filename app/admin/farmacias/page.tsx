"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Shield, Plus, Pencil, Power, PowerOff, X, Save, Loader2,
  MapPin, Phone, Clock, Mail, Search, LogOut,
} from "lucide-react";

interface Farmacia {
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
}

const emptyForm = {
  nombre: "", direccion: "", email: "", password: "",
  telefono: "", horario: "", latitude: "", longitude: "",
};

export default function AdminFarmaciasPage() {
  const router = useRouter();
  const [farmacias, setFarmacias] = useState<Farmacia[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterActivo, setFilterActivo] = useState<"all" | "active" | "inactive">("all");

  // Form dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Farmacia | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState("");

  async function fetchFarmacias() {
    try {
      const res = await fetch("/api/admin/farmacias");
      if (res.status === 401) { router.push("/admin/login"); return; }
      if (res.ok) setFarmacias(await res.json());
    } catch {}
    finally { setIsLoading(false); }
  }

  useEffect(() => { fetchFarmacias(); }, []);

  const openCreate = () => {
    setEditTarget(null);
    setForm(emptyForm);
    setFormError("");
    setDialogOpen(true);
  };

  const openEdit = (f: Farmacia) => {
    setEditTarget(f);
    setForm({
      nombre: f.nombre, direccion: f.direccion, email: f.email, password: "",
      telefono: f.telefono || "", horario: f.horario || "",
      latitude: f.latitude?.toString() || "", longitude: f.longitude?.toString() || "",
    });
    setFormError("");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setFormError("");
    try {
      const body: any = {
        nombre: form.nombre, direccion: form.direccion, email: form.email,
        telefono: form.telefono || undefined, horario: form.horario || undefined,
        latitude: form.latitude ? parseFloat(form.latitude) : undefined,
        longitude: form.longitude ? parseFloat(form.longitude) : undefined,
      };
      if (form.password) body.password = form.password;
      if (!editTarget) body.password = form.password; // required for create

      const url = editTarget ? `/api/admin/farmacias/${editTarget.id}` : "/api/admin/farmacias";
      const method = editTarget ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setFormError(data.error); return; }
      setDialogOpen(false);
      fetchFarmacias();
    } catch {
      setFormError("Error de conexión");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActivo = async (farmacia: Farmacia) => {
    try {
      await fetch(`/api/admin/farmacias/${farmacia.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activo: !farmacia.activo }),
      });
      fetchFarmacias();
    } catch {}
  };

  const handleLogout = async () => {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    router.push("/admin/login");
  };

  const filtered = farmacias
    .filter((f) => {
      if (filterActivo === "active") return f.activo;
      if (filterActivo === "inactive") return !f.activo;
      return true;
    })
    .filter((f) =>
      !search || f.nombre.toLowerCase().includes(search.toLowerCase()) ||
      f.direccion.toLowerCase().includes(search.toLowerCase())
    );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-700 to-indigo-700 text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-none">Panel Admin</h1>
              <p className="text-violet-200 text-xs">Gestión de Farmacias</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-violet-200 hover:text-white transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Salir
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex gap-2 flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar farmacia..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 w-56"
              />
            </div>
            <select
              value={filterActivo}
              onChange={(e) => setFilterActivo(e.target.value as any)}
              className="text-sm border border-gray-200 rounded-xl bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
            >
              <option value="all">Todas</option>
              <option value="active">Activas</option>
              <option value="inactive">Inactivas</option>
            </select>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-medium shadow-md shadow-violet-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            Nueva Farmacia
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total", value: farmacias.length, color: "text-gray-700" },
            { label: "Activas", value: farmacias.filter(f => f.activo).length, color: "text-green-700" },
            { label: "Inactivas", value: farmacias.filter(f => !f.activo).length, color: "text-red-600" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center text-gray-400">Cargando...</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-gray-400">No hay farmacias que mostrar</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50 text-xs text-gray-500 uppercase tracking-wide">
                    <th className="text-left px-5 py-3">Farmacia</th>
                    <th className="text-left px-5 py-3 hidden md:table-cell">Contacto</th>
                    <th className="text-left px-5 py-3 hidden lg:table-cell">Horario</th>
                    <th className="text-center px-5 py-3">Estado</th>
                    <th className="text-right px-5 py-3">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((f) => (
                    <tr key={f.id} className={`hover:bg-gray-50/60 transition-colors ${!f.activo ? "opacity-50" : ""}`}>
                      <td className="px-5 py-4">
                        <p className="font-medium text-gray-900">{f.nombre}</p>
                        <p className="text-gray-400 text-xs flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3" />{f.direccion}
                        </p>
                      </td>
                      <td className="px-5 py-4 hidden md:table-cell">
                        <p className="text-gray-600 flex items-center gap-1">
                          <Mail className="w-3 h-3 text-gray-400" />{f.email}
                        </p>
                        {f.telefono && (
                          <p className="text-gray-500 text-xs flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3 text-gray-400" />{f.telefono}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-4 hidden lg:table-cell">
                        {f.horario ? (
                          <span className="text-gray-500 text-xs flex items-center gap-1">
                            <Clock className="w-3 h-3" />{f.horario}
                          </span>
                        ) : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                          f.activo
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-600"
                        }`}>
                          {f.activo ? "Activa" : "Inactiva"}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEdit(f)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-violet-600 hover:bg-violet-50 transition-colors"
                            title="Editar"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleToggleActivo(f)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              f.activo
                                ? "text-gray-400 hover:text-red-600 hover:bg-red-50"
                                : "text-gray-400 hover:text-green-600 hover:bg-green-50"
                            }`}
                            title={f.activo ? "Desactivar" : "Activar"}
                          >
                            {f.activo ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Dialog */}
      {dialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800">
                {editTarget ? "Editar Farmacia" : "Nueva Farmacia"}
              </h2>
              <button onClick={() => setDialogOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {formError && (
                <div className="bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl p-3">
                  {formError}
                </div>
              )}
              {[
                { label: "Nombre *", key: "nombre", placeholder: "Farmacia Central" },
                { label: "Dirección *", key: "direccion", placeholder: "Av. Libertador, Caracas" },
                { label: "Email *", key: "email", placeholder: "farmacia@ejemplo.com", type: "email" },
                { label: editTarget ? "Nueva Contraseña (dejar vacío para no cambiar)" : "Contraseña *", key: "password", type: "password", placeholder: "••••••••" },
                { label: "Teléfono", key: "telefono", placeholder: "0212-5551234" },
                { label: "Horario", key: "horario", placeholder: "Lun-Sáb 8AM-8PM" },
                { label: "Latitud", key: "latitude", placeholder: "10.4806", type: "number" },
                { label: "Longitud", key: "longitude", placeholder: "-66.9036", type: "number" },
              ].map((field) => (
                <div key={field.key} className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-600">{field.label}</label>
                  <input
                    type={field.type || "text"}
                    value={(form as any)[field.key]}
                    onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                    placeholder={field.placeholder}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400"
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
              <button
                onClick={() => setDialogOpen(false)}
                className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 rounded-xl hover:bg-gray-100"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-xl font-medium shadow-md disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {editTarget ? "Guardar cambios" : "Crear farmacia"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
