import { redirect } from "next/navigation";

import { getSessionCookies } from "@/lib/auth/session-cookies";
import { getDashboardSummary } from "@/lib/dashboard";
import { formatCompactNumber } from "@/lib/utils";

import { LoginForm } from "./_components/login-form";

const FEATURES = [
  { label: "Sales Pipeline", dot: "bg-emerald-400" },
  { label: "Revenue Tracking", dot: "bg-sky-400" },
  { label: "Kontrak Payung", dot: "bg-amber-400" },
  { label: "Sales Matrix", dot: "bg-pink-400" },
  { label: "Resource Management", dot: "bg-violet-400" },
];

export default async function LoginPage() {
  // User yang sudah punya sesi tidak perlu melihat halaman login lagi.
  const { accessToken } = await getSessionCookies();
  if (accessToken) redirect("/dashboard");

  const summary = await getDashboardSummary();

  return (
    <div
      className="grid min-h-screen grid-cols-1 bg-white text-slate-900 lg:grid-cols-5"
      style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}
    >
      {/* Left — brand / product panel */}
      <div
        className="relative hidden flex-col justify-between overflow-hidden p-16 text-white lg:col-span-3 lg:flex"
        style={{
          background:
            "linear-gradient(140deg, #0B1D3A 0%, #1F3864 50%, #1E4D8C 100%)",
        }}
      >
        {/* decorative rings */}
        <div className="pointer-events-none absolute -top-32 -right-32 h-[520px] w-[520px] rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -bottom-40 -left-24 h-[420px] w-[420px] rounded-full border border-white/10" />

        {/* header */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-lg font-bold text-[#13285a]">
            S
          </div>
          <div>
            <p className="leading-tight font-semibold">Swamedia Portal</p>
            <p className="text-xs text-white/60">PT Swamedia Informatika</p>
          </div>
        </div>

        {/* hero copy */}
        <div className="relative z-10 flex flex-1 flex-col justify-center gap-6 py-12">
          <h1 className="max-w-md text-4xl leading-[1.15] font-extrabold">
            Platform Manajemen Proyek
          </h1>
          <p className="max-w-md text-white/70">
            Kelola seluruh siklus proyek — dari pipeline sales hingga tagihan
            &amp; revenue — dalam satu platform terintegrasi.
          </p>

          <div className="flex flex-wrap gap-2">
            {FEATURES.map((f) => (
              <span
                key={f.label}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-sm text-white/90"
              >
                <span className={`h-1.5 w-1.5 rounded-full ${f.dot}`} />
                {f.label}
              </span>
            ))}
          </div>

          {/* activity summary card */}
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
            <p className="text-[11px] font-semibold tracking-widest text-white/50 uppercase">
              Ringkasan Aktif ·{" "}
              {new Intl.DateTimeFormat("id-ID", {
                month: "short",
                year: "numeric",
              }).format(new Date())}
            </p>

            <div className="mt-4 grid grid-cols-3 gap-4">
              <div className="rounded-xl bg-white/10 px-4 py-3">
                <p className="text-xs font-medium text-white/50">
                  Total Proyek
                </p>
                <p className="mt-1 text-2xl font-bold text-white">
                  {formatCompactNumber(summary.totalProyek)}
                </p>
              </div>
              <div className="rounded-xl bg-white/10 px-4 py-3">
                <p className="text-xs font-medium text-white/50">
                  Revenue Bulan Ini
                </p>
                <p className="mt-1 text-2xl font-bold text-white">
                  {formatCompactNumber(summary.revenueBulanIni)}
                </p>
              </div>
              <div className="rounded-xl bg-white/10 px-4 py-3">
                <p className="text-xs font-medium text-white/50">
                  Proyek Sedang Dikerjakan
                </p>
                <p className="mt-1 text-2xl font-bold text-emerald-400">
                  {formatCompactNumber(summary.proyekSedangDikerjakan)}
                </p>
              </div>
            </div>

            {/* skeleton bars */}
            <div className="mt-6 grid h-12 grid-cols-6 items-end gap-2">
              <div className="h-5 rounded-sm bg-white/10" />
              <div className="h-6 rounded-sm bg-white/10" />
              <div className="h-7 rounded-sm bg-white/10" />
              <div className="h-9 rounded-sm bg-white/10" />
              <div className="h-7 rounded-sm bg-white/10" />
              <div className="h-12 rounded-sm bg-blue-600" />
            </div>
          </div>
        </div>

        {/* footer */}
        <p className="relative z-10 text-xs text-white/40">
          © 2026 PT Swamedia Informatika. All rights reserved. |{" "}
          <a
            href="https://swamedia.co.id"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-white/70 underline transition-colors hover:text-white"
          >
            swamedia.co.id
          </a>
        </p>
      </div>

      {/* Right — login form */}
      <div className="flex flex-col items-center justify-center bg-white p-8 lg:col-span-2 lg:p-16">
        <LoginForm />
      </div>
    </div>
  );
}
