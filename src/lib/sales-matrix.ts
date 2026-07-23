import { fetchBackend } from "@/lib/auth/fetch-backend";
import { getSessionCookies } from "@/lib/auth/session-cookies";
import type { ApiResponse } from "@/types/api";
import type { LaporanUnitRow, LaporanUnitTwRow } from "@/lib/laporan-unit";

// Fetcher server-to-server untuk laporan Sales Matrix — lihat
// documentation/note/api/05-sales-unit.md#modul-sales-matrix-laporan.
// Kembaran Revenue Unit (bentuk response identik, lihat lib/laporan-unit.ts),
// tetapi realisasi berbasis DEAL (nilaiBersih proyek DEAL_KONTRAK per unit &
// triwulan deal), bukan kas. Fetcher dipisah dari revenue-unit karena
// endpoint & konteksnya beda — hanya tipe barisnya yang dibagi.

export interface SalesMatrixQuery {
  tahun?: number;
  unitId?: number;
}

function buildQuery(query: SalesMatrixQuery): string {
  const params = new URLSearchParams();
  if (query.tahun) params.set("tahun", String(query.tahun));
  if (query.unitId) params.set("unit_id", String(query.unitId));
  return params.toString();
}

// GET /api/v1/business/sales-matrix — laporan lengkap per unit (semua triwulan).
export async function getSalesMatrixReport(
  query: SalesMatrixQuery = {},
): Promise<LaporanUnitRow[]> {
  const { accessToken } = await getSessionCookies();
  if (!accessToken) return [];

  try {
    const res = await fetchBackend(
      `/api/v1/business/sales-matrix?${buildQuery(query)}`,
    );
    const body: ApiResponse<LaporanUnitRow[]> = await res.json();
    if (!res.ok || !body.success) return [];
    return body.data ?? [];
  } catch {
    return [];
  }
}

// GET /api/v1/business/sales-matrix/tw — laporan satu triwulan (triwulan wajib).
// Menjadi sumber halaman /pencapaian-sales-unit (kembaran /revenue-unit-tw).
export async function getSalesMatrixTwReport(
  triwulan: number,
  query: SalesMatrixQuery = {},
): Promise<LaporanUnitTwRow[]> {
  const { accessToken } = await getSessionCookies();
  if (!accessToken) return [];

  try {
    const params = new URLSearchParams(buildQuery(query));
    params.set("triwulan", String(triwulan));
    const res = await fetchBackend(
      `/api/v1/business/sales-matrix/tw?${params.toString()}`,
    );
    const body: ApiResponse<LaporanUnitTwRow[]> = await res.json();
    if (!res.ok || !body.success) return [];
    return body.data ?? [];
  } catch {
    return [];
  }
}
