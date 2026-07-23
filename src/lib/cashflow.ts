import { fetchBackend } from "@/lib/auth/fetch-backend";
import { getSessionCookies } from "@/lib/auth/session-cookies";
import type { ApiResponse } from "@/types/api";

// Fetcher server-to-server untuk Chart Cashflow — lihat
// documentation/note/api/06-finansial.md#modul-cashflow.
// Laporan arus kas bulanan seluruh perusahaan: inflow (pencairan) vs outflow
// (pembayaran + pengeluaran yang APPROVED & terealisasi). Endpoint /chart
// hanya mengembalikan titik bulanan (tanpa total/posisi kas). Selalu 12 titik
// (Jan–Des), bulan tanpa data diisi 0. Tidak ada modul laporan cashflow
// lengkap yang diminta di sesi ini — hanya chart.

// Satu titik bulanan untuk chart (tanpa field net/posisiKas — itu hanya ada
// di endpoint laporan lengkap /cashflow).
export interface CashflowChartPoint {
  bulan: number;
  label: string;
  inflow: number;
  outflow: number;
}

// GET /api/v1/business/cashflow/chart — 12 titik bulanan inflow vs outflow.
export async function getCashflowChart(
  tahun?: number,
): Promise<CashflowChartPoint[]> {
  const { accessToken } = await getSessionCookies();
  if (!accessToken) return [];

  try {
    const params = new URLSearchParams();
    if (tahun) params.set("tahun", String(tahun));
    const res = await fetchBackend(
      `/api/v1/business/cashflow/chart?${params.toString()}`,
    );
    const body: ApiResponse<CashflowChartPoint[]> = await res.json();
    if (!res.ok || !body.success) return [];
    return body.data ?? [];
  } catch {
    return [];
  }
}
