import Link from "next/link";
import { ClipboardList, LogOut } from "lucide-react";

export default async function SupervisorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-gradient-to-r from-teal-700 to-cyan-700 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-none">Panel Supervisor</h1>
              <p className="text-teal-200 text-xs">Sistema de Donaciones</p>
            </div>
          </div>
          <Link
            href="/supervisor/login"
            className="flex items-center gap-2 text-sm text-teal-200 hover:text-white transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Salir
          </Link>
        </div>
      </header>
      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-8">{children}</main>
    </div>
  );
}
