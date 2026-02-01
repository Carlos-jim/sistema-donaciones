import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export default async function SupervisorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex flex-col">
      <header className="backdrop-blur-sm bg-white/80 border-b px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold bg-gradient-to-r from-teal-600 to-teal-400 bg-clip-text text-transparent">
            Panel Supervisor
          </h1>
          <span className="bg-teal-100 text-teal-800 text-xs px-2.5 py-1 rounded-full font-medium">
            Vista Previa
          </span>
        </div>
      </header>
      <main className="flex-1 container mx-auto p-6 max-w-6xl">{children}</main>
    </div>
  );
}
