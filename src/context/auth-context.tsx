"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

import type { AuthUser } from "@/types/auth";
import { toast } from "@/lib/toast-manager";
import { LoginError } from "@/lib/auth/login-error";

interface AuthState {
  user: AuthUser | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({
  children,
  initialUser,
}: {
  children: ReactNode;
  initialUser: AuthUser | null;
}) {
  const [user, setUser] = useState<AuthUser | null>(initialUser);

  async function login(username: string, password: string) {
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const body = await res.json();
    if (!res.ok) throw new LoginError(body.message ?? "Gagal masuk", body.code);
    setUser(body.user);
    toast.success("Selamat datang kembali!", "Berhasil masuk");
  }

  async function logout() {
    await fetch("/api/logout", { method: "POST" }).catch(() => {});
    setUser(null);
    toast.success("Sampai jumpa lagi!", "Berhasil keluar");
    // Beri jeda supaya toast sempat terlihat sebelum full page reload
    // (window.location.href) membuang seluruh state React, termasuk toast ini.
    setTimeout(() => {
      window.location.href = "/login";
    }, 600);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
