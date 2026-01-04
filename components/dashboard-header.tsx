"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Heart, Bell, User, LogOut } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/requests", label: "Mis Solicitudes" },
  { href: "/dashboard/donations", label: "Mis Donaciones" },
  { href: "/dashboard/profile", label: "Perfil" },
];

export function DashboardHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (response.ok) {
        toast({
          title: "Sesión cerrada",
          description: "Has cerrado sesión exitosamente.",
        });
        router.push("/login");
      } else {
        throw new Error("Error al cerrar sesión");
      }
    } catch {
      toast({
        title: "Error",
        description: "No se pudo cerrar la sesión.",
        variant: "destructive",
      });
    }
  };

  return (
    <motion.header
      className="border-b backdrop-blur-sm bg-white/80 sticky top-0 z-50"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="container mx-auto px-4 flex h-16 items-center justify-between">
        <motion.div
          className="flex items-center gap-2"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <Heart className="h-6 w-6 text-teal-600" />
          <span className="text-xl font-bold bg-gradient-to-r from-teal-600 to-teal-400 bg-clip-text text-transparent">
            MediShare
          </span>
        </motion.div>
        <motion.nav
          className="hidden md:flex gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm font-medium transition-colors duration-300 relative ${
                  isActive
                    ? "text-teal-600 after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:bg-teal-600"
                    : "text-gray-600 hover:text-teal-600"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </motion.nav>
        <motion.div
          className="flex items-center gap-2"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-teal-50 transition-colors duration-300"
          >
            <Bell className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-teal-50 transition-colors duration-300"
          >
            <User className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-teal-50 transition-colors duration-300"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </motion.div>
      </div>
    </motion.header>
  );
}
