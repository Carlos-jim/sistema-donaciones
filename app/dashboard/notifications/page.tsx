"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Bell, CheckCheck, Trash2, ExternalLink,
  Gift, RefreshCw, AlertCircle,
} from "lucide-react";

interface Notificacion {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  activo: boolean;
  link: string | null;
  createdAt: string;
}

const TYPE_ICON: Record<string, { icon: React.ElementType; color: string }> = {
  MATCH_DONATION: { icon: Gift, color: "text-teal-600 bg-teal-50" },
  MATCH_REQUEST:  { icon: RefreshCw, color: "text-blue-600 bg-blue-50" },
  SYSTEM:         { icon: AlertCircle, color: "text-violet-600 bg-violet-50" },
};

export default function NotificationsPage() {
  const { toast } = useToast();
  const [notifs, setNotifs] = useState<Notificacion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [dismissing, setDismissing] = useState<Set<string>>(new Set());

  async function fetchNotifs() {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) setNotifs(await res.json());
    } catch {}
    finally { setIsLoading(false); }
  }

  useEffect(() => { fetchNotifs(); }, []);

  const handleMarkAllRead = async () => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleMarkRead = async (id: string) => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setNotifs((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  };

  const handleDismiss = async (id: string) => {
    setDismissing((prev) => new Set(prev).add(id));
    try {
      const res = await fetch(`/api/notifications/${id}`, { method: "DELETE" });
      if (res.ok) {
        setNotifs((prev) => prev.filter((n) => n.id !== id));
        toast({ title: "Notificación eliminada" });
      }
    } catch {
      toast({ title: "Error al eliminar", variant: "destructive" });
    } finally {
      setDismissing((prev) => { const s = new Set(prev); s.delete(id); return s; });
    }
  };

  const handleDismissAll = async () => {
    const ids = filtered.map((n) => n.id);
    await Promise.all(ids.map((id) => fetch(`/api/notifications/${id}`, { method: "DELETE" })));
    setNotifs((prev) => prev.filter((n) => !ids.includes(n.id)));
    toast({ title: `${ids.length} notificaciones eliminadas` });
  };

  const formatTime = (d: string) => {
    const diff = Date.now() - new Date(d).getTime();
    if (diff < 60000) return "Ahora";
    if (diff < 3600000) return `Hace ${Math.floor(diff / 60000)} min`;
    if (diff < 86400000) return `Hace ${Math.floor(diff / 3600000)} h`;
    return new Date(d).toLocaleDateString("es-ES", { day: "numeric", month: "short" });
  };

  const filtered = filter === "unread" ? notifs.filter((n) => !n.read) : notifs;
  const unreadCount = notifs.filter((n) => !n.read).length;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-3">
            Notificaciones
            {unreadCount > 0 && (
              <Badge className="bg-teal-100 text-teal-700 border-teal-200 text-sm">
                {unreadCount} nuevas
              </Badge>
            )}
          </h1>
          <p className="text-gray-500 mt-1">Historial de actividad y alertas del sistema.</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
          {(["all", "unread"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                filter === f
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {f === "all" ? "Todas" : "No leídas"}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button size="sm" variant="outline" onClick={handleMarkAllRead}
              className="rounded-xl text-xs border-gray-200 text-gray-600 hover:bg-gray-50">
              <CheckCheck className="w-3.5 h-3.5 mr-1" />
              Marcar todas como leídas
            </Button>
          )}
          {filtered.length > 0 && (
            <Button size="sm" variant="outline" onClick={handleDismissAll}
              className="rounded-xl text-xs border-red-200 text-red-600 hover:bg-red-50">
              <Trash2 className="w-3.5 h-3.5 mr-1" />
              Eliminar visibles
            </Button>
          )}
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
          <div className="w-14 h-14 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-3">
            <Bell className="w-7 h-7 text-teal-400" />
          </div>
          <p className="font-medium text-gray-700">Sin notificaciones</p>
          <p className="text-sm text-gray-400 mt-1">
            {filter === "unread" ? "No tienes notificaciones sin leer." : "Tu bandeja está vacía."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((n) => {
            const cfg = TYPE_ICON[n.type] ?? TYPE_ICON.SYSTEM;
            const Icon = cfg.icon;
            return (
              <div
                key={n.id}
                className={`relative flex gap-4 p-4 rounded-2xl border transition-all group ${
                  n.read
                    ? "bg-white border-gray-100 hover:border-gray-200"
                    : "bg-teal-50/40 border-teal-100 hover:border-teal-200"
                }`}
                onClick={() => { if (!n.read) handleMarkRead(n.id); }}
              >
                {/* Unread dot */}
                {!n.read && (
                  <span className="absolute top-4 right-4 w-2 h-2 bg-teal-500 rounded-full" />
                )}

                {/* Icon */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${cfg.color}`}>
                  <Icon className="w-5 h-5" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm font-semibold leading-snug ${n.read ? "text-gray-700" : "text-gray-900"}`}>
                      {n.title}
                    </p>
                    <span className="text-xs text-gray-400 shrink-0">{formatTime(n.createdAt)}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                  {n.link && (
                    <Link
                      href={n.link}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700 mt-1.5 font-medium"
                    >
                      Ver detalles <ExternalLink className="w-3 h-3" />
                    </Link>
                  )}
                </div>

                {/* Dismiss button */}
                <button
                  onClick={(e) => { e.stopPropagation(); handleDismiss(n.id); }}
                  disabled={dismissing.has(n.id)}
                  className="opacity-0 group-hover:opacity-100 absolute top-3 right-3 w-6 h-6 rounded-lg flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all disabled:opacity-50"
                  title="Eliminar"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
