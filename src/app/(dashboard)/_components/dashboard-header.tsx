"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";

import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function DashboardHeader() {
  const { user, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  const name =
    (typeof user?.name === "string" && user.name) ||
    (typeof user?.email === "string" && user.email) ||
    "Pengguna";

  async function handleLogout() {
    setLoggingOut(true);
    await logout();
  }

  return (
    <header className="flex items-center justify-between border-b border-slate-200 px-6 py-3">
      <div className="flex items-center gap-3">
        <Avatar>
          <AvatarFallback>{name.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <span className="text-sm font-medium text-slate-700">{name}</span>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={handleLogout}
        disabled={loggingOut}
      >
        <LogOut className="size-4" />
        {loggingOut ? "Keluar…" : "Keluar"}
      </Button>
    </header>
  );
}
