"use client";

import { useState } from "react";
import {
  User,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  Info,
  TriangleAlert,
} from "lucide-react";

import { useAuth } from "@/context/auth-context";
import { LoginError } from "@/lib/auth/login-error";

// Hanya area yang butuh interaktivitas (state form + toggle password) yang
// dijadikan Client Component; panel brand di kiri tetap Server Component.
export function LoginForm() {
  const { login } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setErrorCode(undefined);
    setLoading(true);
    try {
      await login(username, password);

      // Kembalikan user ke halaman asal (jika aman & internal), default dashboard.
      const from = new URLSearchParams(window.location.search).get("from");
      const dest =
        from && from.startsWith("/") && !from.startsWith("//")
          ? from
          : "/dashboard";
      // Hard navigation (bukan router.replace/refresh) dengan sengaja: login
      // lewat Route Handler mengubah cookie sesi tanpa sepengetahuan Next.js
      // router cache, dan soft navigation sempat menghasilkan render pertama
      // dengan data yang belum lengkap (mis. sidebar menu kosong) sebelum
      // membaik sendiri setelah refresh manual. Full page load menyamakan
      // perilakunya dengan refresh manual itu: satu request bersih dengan
      // cookie yang sudah pasti ter-commit.
      window.location.assign(dest);
    } catch (err) {
      if (err instanceof LoginError) {
        setError(err.message);
        setErrorCode(err.code);
      } else {
        setError(
          err instanceof Error ? err.message : "Gagal masuk. Coba lagi.",
        );
      }
    } finally {
      setLoading(false);
    }
  }

  // FORBIDDEN = kredensial valid tapi akun belum jadi member portal ini —
  // beda kasus dari salah password, jangan ditampilkan sebagai alert merah
  // yang sama (lihat Frontend-Auth-Middleware.md §1.4).
  const isForbidden = errorCode === "FORBIDDEN";

  return (
    <form onSubmit={handleSubmit} className="my-auto w-full max-w-[380px]">
      {/* Titles */}
      <h2 className="flex items-center gap-2 text-3xl font-bold tracking-tight text-slate-900">
        Selamat Datang{" "}
        <span className="origin-bottom-right animate-pulse">👋</span>
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-slate-500">
        Masuk ke akun Anda untuk mengakses portal manajemen proyek &amp;
        revenue.
      </p>

      {error &&
        (isForbidden ? (
          <div
            role="alert"
            className="mt-6 flex items-start gap-2 rounded-xl border border-blue-100 bg-blue-50 p-3 text-xs font-medium text-blue-700"
          >
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : (
          <div
            role="alert"
            className="mt-6 flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-3 text-xs font-medium text-red-700"
          >
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        ))}

      <div className="mt-8 space-y-4">
        {/* USERNAME */}
        <div className="space-y-2">
          <label
            htmlFor="username"
            className="text-xs font-bold text-slate-700"
          >
            Username
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
              <User className="h-4 w-4" />
            </span>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Masukkan username"
              className="w-full rounded-xl border border-slate-200 bg-white py-3 pr-4 pl-10 text-sm font-medium text-slate-800 placeholder-slate-400 transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
            />
          </div>
        </div>

        {/* PASSWORD */}
        <div className="space-y-2">
          <label
            htmlFor="password"
            className="text-xs font-bold text-slate-700"
          >
            Password
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
              <Lock className="h-4 w-4" />
            </span>
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-slate-200 bg-white py-3 pr-10 pl-10 text-sm font-medium text-slate-800 placeholder-slate-400 transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={
                showPassword ? "Sembunyikan password" : "Tampilkan password"
              }
              className="absolute inset-y-0 right-0 flex cursor-pointer items-center pr-3.5 text-slate-400 transition-colors hover:text-slate-600"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="mt-8 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#1d3557] px-4 py-3.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-[#152842] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <LogIn className="h-4 w-4" />
        {loading ? "Memproses…" : "Masuk"}
      </button>

      {/* Divider */}
      <div className="relative my-8 flex items-center justify-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200" />
        </div>
        <span className="relative bg-white px-4 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
          Single Sign-On (SSO)
        </span>
      </div>

      {/* Info box */}
      <div className="flex gap-3 rounded-xl border border-blue-100 bg-[#f0f7ff] p-4">
        <span className="mt-0.5 shrink-0 text-blue-600">
          <Info className="h-4 w-4" />
        </span>
        <p className="text-[11px] leading-relaxed font-medium text-slate-600">
          Autentikasi dilakukan sepenuhnya melalui{" "}
          <span className="font-bold text-blue-700">WSO2 Identity Server</span>{" "}
          milik perusahaan. Kredensial Anda tidak disimpan di portal ini.
        </p>
      </div>
    </form>
  );
}
