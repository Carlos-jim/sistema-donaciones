"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { MapView } from "@/components/map-view";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  User,
  Mail,
  Phone,
  CreditCard,
  Lock,
  MapPin,
  Save,
  CheckCircle2,
  Eye,
  EyeOff,
  Calendar,
  AlertTriangle,
} from "lucide-react";

interface UserProfile {
  id: string;
  nombre: string;
  email: string;
  telefono: string | null;
  cedula: string | null;
  direccion: { lat: number; lng: number; address?: string } | null;
  createdAt: string;
}

export default function ProfilePage() {
  const { toast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingInfo, setIsSavingInfo] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isSavingLocation, setIsSavingLocation] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  // Account deactivation
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);
  const [deactivatePassword, setDeactivatePassword] = useState("");
  const [isDeactivating, setIsDeactivating] = useState(false);

  // Form state — personal info
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [cedulaTipo, setCedulaTipo] = useState("V");
  const [cedulaNumero, setCedulaNumero] = useState("");

  // Password form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Location
  const [locationData, setLocationData] = useState<{ lat: number; lng: number; address?: string } | null>(null);
  const [hasNewLocation, setHasNewLocation] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch("/api/user/profile");
        if (res.ok) {
          const data: UserProfile = await res.json();
          setProfile(data);
          // Populate form fields
          const [tipo, ...numParts] = (data.cedula || "V-").split("-");
          setNombre(data.nombre || "");
          setEmail(data.email || "");
          setTelefono(data.telefono || "");
          setCedulaTipo(tipo || "V");
          setCedulaNumero(numParts.join("-") || "");
          if (data.direccion) setLocationData(data.direccion);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchProfile();
  }, []);

  const handleLocationChange = async (pos: { lat: number; lng: number }) => {
    let address = "";
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.lat}&lon=${pos.lng}`
      );
      const data = await res.json();
      address = data.display_name || "";
    } catch {}
    setLocationData({ ...pos, address });
    setHasNewLocation(true);
  };

  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingInfo(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre,
          email,
          telefono,
          cedula: cedulaNumero ? `${cedulaTipo}-${cedulaNumero}` : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "Error", description: data.error, variant: "destructive" });
        return;
      }
      setProfile((p) => p ? { ...p, ...data.user } : p);
      toast({ title: "Perfil actualizado", description: "Tu información ha sido guardada." });
    } catch {
      toast({ title: "Error de conexión", variant: "destructive" });
    } finally {
      setIsSavingInfo(false);
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({ title: "Las contraseñas no coinciden", variant: "destructive" });
      return;
    }
    setIsSavingPassword(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "Error", description: data.error, variant: "destructive" });
        return;
      }
      toast({ title: "Contraseña actualizada", description: "Tu contraseña ha sido cambiada exitosamente." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      toast({ title: "Error de conexión", variant: "destructive" });
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleSaveLocation = async () => {
    if (!locationData) return;
    setIsSavingLocation(true);
    try {
      const res = await fetch("/api/user/location", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat: locationData.lat, lng: locationData.lng, address: locationData.address }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "Error", description: data.error, variant: "destructive" });
        return;
      }
      setHasNewLocation(false);
      setProfile((p) => p ? { ...p, direccion: locationData } : p);
      toast({ title: "Ubicación actualizada", description: "Tu dirección ha sido guardada." });
    } catch {
      toast({ title: "Error de conexión", variant: "destructive" });
    } finally {
      setIsSavingLocation(false);
    }
  };

  const handleDeactivateAccount = async () => {
    if (!deactivatePassword.trim()) return;
    setIsDeactivating(true);
    try {
      const res = await fetch("/api/user/deactivate", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: deactivatePassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "Error", description: data.error, variant: "destructive" });
        return;
      }
      toast({ title: "Cuenta desactivada", description: "Tu cuenta ha sido desactivada." });
      // Redirect to login (cookie cleared by API)
      window.location.href = "/login";
    } catch {
      toast({ title: "Error de conexión", variant: "destructive" });
    } finally {
      setIsDeactivating(false);
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });

  if (isLoading) {
    return (
      <div className="space-y-8 max-w-3xl mx-auto">
        <Skeleton className="h-10 w-64" />
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 w-full rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Mi Perfil</h1>
        <p className="text-gray-500 mt-1">Gestiona tu información personal y preferencias.</p>
      </div>

      {/* Profile summary card */}
      <div className="bg-gradient-to-br from-teal-600 to-cyan-600 rounded-3xl p-6 text-white shadow-xl shadow-teal-600/20">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-2xl font-bold">
            {profile?.nombre?.charAt(0).toUpperCase() ?? "?"}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold truncate">{profile?.nombre}</h2>
            <p className="text-teal-100 text-sm">{profile?.email}</p>
            {profile?.createdAt && (
              <p className="text-teal-200 text-xs mt-1 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Miembro desde {formatDate(profile.createdAt)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Personal Info Form */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-lg shadow-gray-200/50 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <User className="w-4 h-4 text-teal-600" />
            Información Personal
          </h3>
        </div>
        <form onSubmit={handleSaveInfo} className="p-6 space-y-5">
          <div className="grid sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label htmlFor="nombre" className="text-gray-700 flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-teal-600" />
                Nombre completo
              </Label>
              <Input
                id="nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="rounded-xl border-gray-200 focus:border-teal-500 focus:ring-teal-500/20"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700 flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-teal-600" />
                Correo electrónico
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-xl border-gray-200 focus:border-teal-500 focus:ring-teal-500/20"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefono" className="text-gray-700 flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-teal-600" />
                Teléfono
              </Label>
              <Input
                id="telefono"
                type="tel"
                placeholder="0414-1234567"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                className="rounded-xl border-gray-200 focus:border-teal-500 focus:ring-teal-500/20"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-700 flex items-center gap-2">
                <CreditCard className="w-3.5 h-3.5 text-teal-600" />
                Cédula de identidad
              </Label>
              <div className="flex gap-2">
                <select
                  value={cedulaTipo}
                  onChange={(e) => setCedulaTipo(e.target.value)}
                  className="w-[70px] rounded-xl border border-gray-200 px-2 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20 bg-white"
                >
                  <option value="V">V-</option>
                  <option value="E">E-</option>
                </select>
                <Input
                  placeholder="12345678"
                  value={cedulaNumero}
                  onChange={(e) => setCedulaNumero(e.target.value)}
                  className="flex-1 rounded-xl border-gray-200 focus:border-teal-500 focus:ring-teal-500/20"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              disabled={isSavingInfo}
              className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white rounded-xl shadow-lg shadow-teal-500/20"
            >
              {isSavingInfo ? (
                "Guardando..."
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Guardar información
                </>
              )}
            </Button>
          </div>
        </form>
      </div>

      {/* Location Section */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-lg shadow-gray-200/50 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-teal-600" />
            Mi Ubicación
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">Se usa para sugerirte farmacias y donaciones cercanas.</p>
        </div>
        <div className="p-6 space-y-4">
          <div className="h-[280px] w-full rounded-2xl overflow-hidden border-2 border-dashed border-teal-200 relative">
            <MapView
              onUserLocationChange={handleLocationChange}
              showUserMarker={true}
              initialUserLocation={
                profile?.direccion
                  ? { lat: profile.direccion.lat, lng: profile.direccion.lng }
                  : null
              }
            />
          </div>

          {locationData && (
            <div className="bg-teal-50 border border-teal-100 rounded-xl p-3 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-teal-800 uppercase tracking-wide">Ubicación marcada</p>
                <p className="text-sm text-teal-700 mt-0.5 truncate">
                  {locationData.address || `${locationData.lat.toFixed(4)}, ${locationData.lng.toFixed(4)}`}
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <Button
              onClick={handleSaveLocation}
              disabled={isSavingLocation || !hasNewLocation}
              className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white rounded-xl shadow-lg shadow-teal-500/20 disabled:opacity-40"
            >
              {isSavingLocation ? (
                "Guardando..."
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Guardar ubicación
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Password & Danger Sections wrapper */}
      {/* Password Section */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-lg shadow-gray-200/50 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <Lock className="w-4 h-4 text-teal-600" />
            Cambiar Contraseña
          </h3>
        </div>
        <form onSubmit={handleSavePassword} className="p-6 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="currentPassword" className="text-gray-700">
              Contraseña actual
            </Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showCurrentPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="rounded-xl border-gray-200 focus:border-teal-500 focus:ring-teal-500/20 pr-10"
                required
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-gray-700">
                Nueva contraseña
              </Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="rounded-xl border-gray-200 focus:border-teal-500 focus:ring-teal-500/20 pr-10"
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-gray-400">Mínimo 8 caracteres</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-gray-700">
                Confirmar nueva contraseña
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`rounded-xl border-gray-200 focus:border-teal-500 focus:ring-teal-500/20 ${
                  confirmPassword && newPassword !== confirmPassword ? "border-red-300 focus:border-red-400" : ""
                }`}
                required
              />
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-xs text-red-500">Las contraseñas no coinciden</p>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              disabled={isSavingPassword || (!!confirmPassword && newPassword !== confirmPassword)}
              className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white rounded-xl shadow-lg shadow-teal-500/20"
            >
              {isSavingPassword ? (
                "Actualizando..."
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  Cambiar contraseña
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
      {/* Danger Zone */}
      <div className="bg-white rounded-3xl border border-red-100 shadow-lg shadow-gray-200/50 overflow-hidden">
        <div className="px-6 py-4 border-b border-red-100 bg-red-50/50">
          <h3 className="font-semibold text-red-700 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Zona de peligro
          </h3>
          <p className="text-xs text-red-500 mt-0.5">Acciones irreversibles sobre tu cuenta.</p>
        </div>
        <div className="p-6 flex items-center justify-between gap-4">
          <div>
            <p className="font-medium text-gray-800 text-sm">Desactivar cuenta</p>
            <p className="text-xs text-gray-500 mt-0.5">
              Tu cuenta será desactivada y no podrás iniciar sesión. Contacta soporte para reactivarla.
            </p>
          </div>
          <Button
            variant="outline"
            className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 shrink-0"
            onClick={() => setShowDeactivateDialog(true)}
          >
            <AlertTriangle className="w-4 h-4 mr-2" />
            Desactivar cuenta
          </Button>
        </div>
      </div>

      {/* Deactivate Confirmation Dialog */}
      <Dialog open={showDeactivateDialog} onOpenChange={(open) => { if (!open) { setShowDeactivateDialog(false); setDeactivatePassword(""); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="w-5 h-5" />
              ¿Desactivar tu cuenta?
            </DialogTitle>
            <DialogDescription>
              Esta acción desactivará tu cuenta. No podrás iniciar sesión hasta que contactes al soporte.
              Confirma tu contraseña para continuar.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="deactivatePassword" className="text-gray-700">Contraseña actual</Label>
            <Input
              id="deactivatePassword"
              type="password"
              value={deactivatePassword}
              onChange={(e) => setDeactivatePassword(e.target.value)}
              placeholder="••••••••"
              className="rounded-xl border-gray-200"
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => { setShowDeactivateDialog(false); setDeactivatePassword(""); }} disabled={isDeactivating}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeactivateAccount}
              disabled={isDeactivating || !deactivatePassword.trim()}
            >
              {isDeactivating ? "Desactivando..." : "Sí, desactivar cuenta"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
