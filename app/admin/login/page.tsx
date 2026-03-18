"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Mail, Lock, Loader2 } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      router.push("/admin/farmacias");
    } catch {
      setError("Error de conexión");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-500 shadow-lg shadow-violet-500/30 mb-4">
            <Shield className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Panel de Administración</h1>
          <p className="text-gray-400 text-sm mt-1">Acceso restringido al personal autorizado</p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-sm text-red-400">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <label className="text-sm text-gray-300 flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-violet-400" /> Correo electrónico
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50"
                  placeholder="admin@medishare.com"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-300 flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-violet-400" /> Contraseña
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-medium transition-all shadow-lg shadow-violet-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Iniciar sesión"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
