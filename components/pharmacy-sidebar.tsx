"use client";

import { Package, Home, Gift, ClipboardList, Heart } from "lucide-react";
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
import { RoleLogoutButton } from "@/components/role-logout-button";

const items = [
  { title: "Dashboard", url: "/pharmacy", icon: Home },
  { title: "Recepcion", url: "/pharmacy/reception", icon: Gift },
  { title: "Inventario", url: "/pharmacy/inventory", icon: Package },
  { title: "Solicitudes", url: "/pharmacy/requests", icon: ClipboardList },
];

export function PharmacySidebar() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-0 border-b">
        <div className="bg-teal-600 px-4 py-5 flex items-center gap-3">
          <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <Heart className="w-4 h-4 text-white" />
          </div>
          <div className="overflow-hidden">
            <p className="font-bold text-white leading-none text-sm truncate">MediShareNE</p>
            <p className="text-teal-200 text-xs mt-0.5 truncate">Portal Farmacia</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="pt-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-4">
            Gestión
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const isActive = pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                      className={
                        isActive
                          ? "bg-teal-50 text-teal-700 font-medium hover:bg-teal-50 hover:text-teal-700"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      }
                    >
                      <Link href={item.url} className="flex items-center gap-3 px-3 py-2 rounded-lg">
                        <item.icon
                          className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-teal-600" : "text-gray-400"}`}
                        />
                        <span>{item.title}</span>
                        {isActive && (
                          <span className="ml-auto w-1.5 h-1.5 rounded-full bg-teal-500" />
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t bg-gray-50/50">
        <RoleLogoutButton
          logoutUrl="/api/pharmacy/auth/logout"
          redirectTo="/pharmacy/login"
          label="Cerrar sesion"
          className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 text-sm"
        />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
