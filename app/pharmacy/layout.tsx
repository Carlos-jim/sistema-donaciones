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
  return (
    <SidebarProvider>
      <PharmacySidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-white/50 backdrop-blur-sm sticky top-0 z-10">
          <SidebarTrigger className="-ml-1" />
          <div className="h-4 w-px bg-gray-200 mx-2" />
          <h1 className="text-sm font-medium text-gray-500">
            Portal de Farmacia
          </h1>
        </header>
        <main className="flex-1 p-4 md:p-8 pt-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
