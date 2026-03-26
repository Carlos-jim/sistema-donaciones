"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface RoleLogoutButtonProps {
  logoutUrl: string;
  redirectTo: string;
  label: string;
  className?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
}

export function RoleLogoutButton({
  logoutUrl,
  redirectTo,
  label,
  className,
  variant = "ghost",
}: RoleLogoutButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);

    try {
      await fetch(logoutUrl, { method: "POST" });
    } finally {
      router.push(redirectTo);
      router.refresh();
      setIsLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant={variant}
      onClick={handleLogout}
      disabled={isLoading}
      className={cn(className)}
    >
      {isLoading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <LogOut className="mr-2 h-4 w-4" />
      )}
      <span>{label}</span>
    </Button>
  );
}
