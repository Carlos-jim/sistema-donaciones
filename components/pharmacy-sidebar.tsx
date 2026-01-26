"use client";

import { Package, Home, LogOut, Gift, ClipboardList } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const items = [
  {
    title: "Dashboard",
    url: "/pharmacy",
    icon: Home,
  },
  {
    title: "Recepción",
    url: "/pharmacy/reception",
    icon: Gift,
  },
  {
    title: "Inventario",
    url: "/pharmacy/inventory",
    icon: Package,
  },
  {
    title: "Solicitudes",
    url: "/pharmacy/requests",
    icon: ClipboardList,
  },
];

export function PharmacySidebar() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4 border-b">
        <h2 className="text-xl font-bold text-teal-600 truncate px-2">
          Farmacia
        </h2>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Gestión</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url}
                    tooltip={item.title}
                  >
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4 border-t">
        <Button
          variant="ghost"
          className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50"
          asChild
        >
          <Link href="/api/auth/logout">
            <LogOut className="mr-2 h-4 w-4" />
            <span>Cerrar Sesión</span>
          </Link>
        </Button>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
