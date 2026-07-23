"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import type { AuthUser } from "@/types/auth";
import { toast } from "@/lib/toast-manager";
import { LoginError } from "@/lib/auth/login-error";

interface AuthState {
  user: AuthUser | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

// Endpoints yang SENGAJA dikecualikan dari redirect-otomatis-ke-login: 401 di
// sini berarti "kredensial salah" (login) atau tidak relevan (logout selalu
// 200), bukan "sesi habis" — meredirect di sini justru akan membuang pesan
// error login yang sudah benar sebelum sempat dibaca user.
const SESSION_401_EXEMPT_PREFIXES = ["/api/login", "/api/logout"];

function isSessionScopedApiPath(url: string): boolean {
  let pathname: string;
  try {
    pathname = url.startsWith("/") ? url : new URL(url).pathname;
  } catch {
    return false;
  }
  return (
    pathname.startsWith("/api/") &&
    !SESSION_401_EXEMPT_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  );
}

export function AuthProvider({
  children,
  initialUser,
}: {
  children: ReactNode;
  initialUser: AuthUser | null;
}) {
  const [user, setUser] = useState<AuthUser | null>(initialUser);

  // Gerbang tunggal untuk SEMUA fetch browser (lewat semua komponen client —
  // table, dialog, sidebar, dst): kalau backend/BFF membalas 401 pada
  // endpoint yang butuh sesi (bukan /api/login atau /api/logout), token
  // sudah pasti tidak valid lagi (expired/revoked) — proxy.ts sudah menjaga
  // access token tetap fresh di setiap navigasi halaman, jadi 401 yang lolos
  // sampai ke sini berarti refresh token-nya sendiri sudah mati. Dipasang di
  // sini (bukan diulang di tiap komponen) karena banyak komponen masih
  // fetch("/api/proxy/...") langsung tanpa lewat lib/api-client.ts.
  useEffect(() => {
    const originalFetch = window.fetch;
    let redirecting = false;

    window.fetch = async (
      input: RequestInfo | URL,
      init?: RequestInit,
    ): Promise<Response> => {
      const res = await originalFetch(input, init);
      if (res.status === 401 && !redirecting && window.location.pathname !== "/login") {
        const url =
          typeof input === "string"
            ? input
            : input instanceof URL
              ? input.toString()
              : input.url;
        if (isSessionScopedApiPath(url)) {
          redirecting = true;
          originalFetch("/api/logout", { method: "POST" }).catch(() => {});
          setUser(null);
          window.location.href = "/login";
        }
      }
      return res;
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

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
