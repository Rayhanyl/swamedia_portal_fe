import { fetchBackend } from "@/lib/auth/fetch-backend";
import { getSessionCookies } from "@/lib/auth/session-cookies";
import type { ApiResponse } from "@/types/api";
import type {
  LaporanUnitChartData,
  LaporanUnitRow,
  LaporanUnitTwRow,
} from "@/lib/laporan-unit";

// Fetcher server-to-server untuk laporan Revenue Unit — lihat
// documentation/note/api/05-sales-unit.md#modul-revenue-unit-laporan.
// Realisasi berbasis kas (pencairan PARSIAL/FINAL per unit & triwulan).
// Semua best-effort: kegagalan mengembalikan bentuk kosong yang aman.

export interface RevenueUnitQuery {
  tahun?: number;
  unitId?: number;
}

function buildQuery(query: RevenueUnitQuery): string {
  const params = new URLSearchParams();
  if (query.tahun) params.set("tahun", String(query.tahun));
  if (query.unitId) params.set("unit_id", String(query.unitId));
  return params.toString();
}

// GET /api/v1/business/revenue-unit — laporan lengkap per unit (semua triwulan).
export async function getRevenueUnitReport(
  query: RevenueUnitQuery = {},
): Promise<LaporanUnitRow[]> {
  const { accessToken } = await getSessionCookies();
  if (!accessToken) return [];

  try {
    const res = await fetchBackend(
      `/api/v1/business/revenue-unit?${buildQuery(query)}`,
    );
    const body: ApiResponse<LaporanUnitRow[]> = await res.json();
    if (!res.ok || !body.success) return [];
    return body.data ?? [];
  } catch {
    return [];
  }
}

// GET /api/v1/business/revenue-unit/tw — laporan satu triwulan (triwulan wajib).
export async function getRevenueUnitTwReport(
  triwulan: number,
  query: RevenueUnitQuery = {},
): Promise<LaporanUnitTwRow[]> {
  const { accessToken } = await getSessionCookies();
  if (!accessToken) return [];

  try {
    const params = new URLSearchParams(buildQuery(query));
    params.set("triwulan", String(triwulan));
    const res = await fetchBackend(
      `/api/v1/business/revenue-unit/tw?${params.toString()}`,
    );
    const body: ApiResponse<LaporanUnitTwRow[]> = await res.json();
    if (!res.ok || !body.success) return [];
    return body.data ?? [];
  } catch {
    return [];
  }
}

// GET /api/v1/business/revenue-unit/chart — empat titik triwulan (target vs
// realisasi), satu unit atau agregat semua unit.
export async function getRevenueUnitChart(
  query: RevenueUnitQuery = {},
): Promise<LaporanUnitChartData | null> {
  const { accessToken } = await getSessionCookies();
  if (!accessToken) return null;

  try {
    const res = await fetchBackend(
      `/api/v1/business/revenue-unit/chart?${buildQuery(query)}`,
    );
    const body: ApiResponse<LaporanUnitChartData> = await res.json();
    if (!res.ok || !body.success || !body.data) return null;
    return body.data;
  } catch {
    return null;
  }
}
