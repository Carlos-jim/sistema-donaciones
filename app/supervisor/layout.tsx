import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export default async function SupervisorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Logic removed as per user request for "normal view without login"

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm border-b px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-purple-700">
            Panel Supervisor
          </h1>
          <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
            Vista Previa
          </span>
        </div>
      </header>
      <main className="flex-1 container mx-auto p-6 max-w-6xl">{children}</main>
    </div>
  );
}
