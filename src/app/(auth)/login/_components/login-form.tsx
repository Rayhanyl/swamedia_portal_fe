"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { User, Lock, Eye, EyeOff, LogIn, Info, TriangleAlert } from "lucide-react";

import { useAuth } from "@/context/auth-context";

// Hanya area yang butuh interaktivitas (state form + toggle password) yang
// dijadikan Client Component; panel brand di kiri tetap Server Component.
export function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(username, password);

      // Kembalikan user ke halaman asal (jika aman & internal), default dashboard.
      const from = new URLSearchParams(window.location.search).get("from");
      const dest =
        from && from.startsWith("/") && !from.startsWith("//")
          ? from
          : "/dashboard";
      router.replace(dest);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal masuk. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-[380px] my-auto">
      {/* Titles */}
      <h2 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
        Selamat Datang{" "}
        <span className="animate-pulse origin-bottom-right">👋</span>
      </h2>
      <p className="mt-3 text-sm text-slate-500 leading-relaxed">
        Masuk ke akun Anda untuk mengakses portal manajemen proyek &amp; revenue.
      </p>

      {error && (
        <div
          role="alert"
          className="mt-6 flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-3 text-xs font-medium text-red-700"
        >
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="mt-8 space-y-4">
        {/* USERNAME */}
        <div className="space-y-2">
          <label htmlFor="username" className="text-xs font-bold text-slate-700">
            Username
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
              <User className="w-4 h-4" />
            </span>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Masukkan username"
              className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>
        </div>

        {/* PASSWORD */}
        <div className="space-y-2">
          <label htmlFor="password" className="text-xs font-bold text-slate-700">
            Password
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
              <Lock className="w-4 h-4" />
            </span>
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-10 pr-10 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
              className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full mt-8 flex items-center justify-center gap-2 px-4 py-3.5 bg-[#1d3557] hover:bg-[#152842] text-white text-sm font-semibold rounded-xl shadow-md transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
      >
        <LogIn className="w-4 h-4" />
        {loading ? "Memproses…" : "Masuk"}
      </button>

      {/* Divider */}
      <div className="relative my-8 flex items-center justify-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200" />
        </div>
        <span className="relative px-4 bg-white text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Single Sign-On (SSO)
        </span>
      </div>

      {/* Info box */}
      <div className="p-4 rounded-xl bg-[#f0f7ff] border border-blue-100 flex gap-3">
        <span className="text-blue-600 mt-0.5 shrink-0">
          <Info className="w-4 h-4" />
        </span>
        <p className="text-[11px] leading-relaxed text-slate-600 font-medium">
          Autentikasi dilakukan sepenuhnya melalui{" "}
          <span className="font-bold text-blue-700">WSO2 Identity Server</span>{" "}
          milik perusahaan. Kredensial Anda tidak disimpan di portal ini.
        </p>
      </div>
    </form>
  );
}
