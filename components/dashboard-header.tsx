"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Heart, Bell, User, LogOut, Check } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Listado de Solicitudes" },
  { href: "/dashboard/requests", label: "Mis Solicitudes" },
  { href: "/dashboard/donations", label: "Mis Donaciones" },
];

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  link?: string;
  createdAt: string;
}

export function DashboardHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
        setUnreadCount(data.filter((n: Notification) => !n.read).length);
      }
    } catch (error) {
      console.error("Error fetching notifications", error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      // Update local state
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking as read", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
      toast({ description: "Todas las notificaciones marcadas como leídas" });
    } catch (error) {
      console.error("Error marking all as read", error);
    }
  };

  const handleNotificationClick = async (n: Notification) => {
    if (!n.read) {
      await markAsRead(n.id);
    }
    if (n.link) {
      router.push(n.link);
      setIsOpen(false);
    }
  };

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
            MediShareNE
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
          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative hover:bg-teal-50 transition-colors duration-300"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
              <div className="flex items-center justify-between p-4 border-b">
                <h4 className="font-semibold text-sm">Notificaciones</h4>
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-teal-600 hover:text-teal-700 h-auto p-0"
                    onClick={markAllAsRead}
                  >
                    Marcar leídas
                  </Button>
                )}
              </div>
              <ScrollArea className="h-[300px]">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full py-8 text-gray-500">
                    <Bell className="h-8 w-8 mb-2 opacity-20" />
                    <p className="text-sm">Sin notificaciones</p>
                  </div>
                ) : (
                  <div className="flex flex-col">
                    {notifications.map((notification) => (
                      <button
                        key={notification.id}
                        className={cn(
                          "flex flex-col items-start gap-1 p-4 text-left transition-colors hover:bg-gray-50 border-b last:border-0",
                          !notification.read && "bg-teal-50/50",
                        )}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span
                            className={cn(
                              "text-sm font-medium",
                              !notification.read && "text-teal-800",
                            )}
                          >
                            {notification.title}
                          </span>
                          {!notification.read && (
                            <span className="h-2 w-2 rounded-full bg-teal-500" />
                          )}
                        </div>
                        <p className="text-xs text-gray-500 line-clamp-2">
                          {notification.message}
                        </p>
                        <span className="text-[10px] text-gray-400 mt-1">
                          {new Date(
                            notification.createdAt,
                          ).toLocaleDateString()}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </PopoverContent>
          </Popover>

          <Link href="/dashboard/profile">
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-teal-50 transition-colors duration-300"
            >
              <User className="h-5 w-5" />
            </Button>
          </Link>
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
