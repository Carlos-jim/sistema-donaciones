"use client";

import { usePathname } from "next/navigation";
import {
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";
import { PharmacySidebar } from "@/components/pharmacy-sidebar";

export default function PharmacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  if (pathname === "/pharmacy/login") {
    return children;
  }

  const pageTitle: Record<string, string> = {
    "/pharmacy": "Dashboard",
    "/pharmacy/reception": "Procesar Recepción",
    "/pharmacy/inventory": "Inventario",
    "/pharmacy/requests": "Solicitudes",
  };

  const title = pageTitle[pathname] ?? "Portal de Farmacia";

  return (
    <SidebarProvider>
      <PharmacySidebar />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-3 border-b px-4 bg-white sticky top-0 z-10 shadow-sm">
          <SidebarTrigger className="-ml-1 text-gray-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors" />
          <div className="h-4 w-px bg-gray-200" />
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-teal-500" />
            <h1 className="text-sm font-semibold text-gray-700">{title}</h1>
          </div>
        </header>
        <main className="flex-1 p-6 md:p-8 bg-gray-50/40 min-h-[calc(100vh-3.5rem)]">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
