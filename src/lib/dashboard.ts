import { BACKEND_BASE_URL } from "@/lib/config";
import type { ApiResponse } from "@/types/api";
import type { DashboardSummary } from "@/types/dashboard";

// Dipanggil dari halaman login (Server Component, belum ada sesi) untuk
// menampilkan KPI ringkas. Endpoint ini public (security: [] di kontrak
// OpenAPI) sehingga tidak perlu access token. Best-effort: kegagalan backend
// mengembalikan fallback nol, bukan melempar error, supaya halaman login
// tetap bisa dirender.
const FALLBACK: DashboardSummary = {
  totalProyek: 0,
  revenueBulanIni: 0,
  proyekSedangDikerjakan: 0,
};

export async function getDashboardSummary(): Promise<DashboardSummary> {
  try {
    const res = await fetch(`${BACKEND_BASE_URL}/api/v1/dashboard/summary`, {
      cache: "no-store",
    });
    const body: ApiResponse<DashboardSummary> = await res.json();
    if (!res.ok || !body.success || !body.data) return FALLBACK;
    return body.data;
  } catch {
    return FALLBACK;
  }
}
