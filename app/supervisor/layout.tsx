"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList } from "lucide-react";
import { RoleLogoutButton } from "@/components/role-logout-button";

export default function SupervisorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  if (pathname === "/supervisor/login") {
    return children;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-gradient-to-r from-teal-700 to-cyan-700 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/supervisor" className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-none">Panel Supervisor</h1>
              <p className="text-teal-200 text-xs">Sistema de Donaciones</p>
            </div>
          </Link>
          <RoleLogoutButton
            logoutUrl="/api/supervisor/auth/logout"
            redirectTo="/supervisor/login"
            label="Cerrar sesion"
            className="rounded-xl text-sm text-teal-100 border border-white/25 bg-transparent hover:bg-white/15 hover:text-white hover:border-white/40 transition-colors"
          />
        </div>
      </header>
      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-8">{children}</main>
    </div>
  );
}
