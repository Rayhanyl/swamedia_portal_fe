import { fetchBackend } from "@/lib/auth/fetch-backend";
import { getSessionCookies } from "@/lib/auth/session-cookies";
import type { ApiResponse, Pagination } from "@/types/api";

// Bentuk item GET /api/v1/business/target-sales-unit — lihat
// documentation/note/api/05-sales-unit.md#modul-target-sales-unit.
// Target sales (deal) per unit per tahun, dipecah empat triwulan. Kembaran
// Target Revenue Unit (bentuk & aturan identik). Catatan penting: modul ini
// pakai DELETE FISIK (tabel tanpa is_deleted) — baris yang dihapus hilang
// permanen, bukan soft delete seperti mayoritas modul lain.
export interface TargetSalesUnit {
  id: number;
  unitId: number;
  unitNama: string | null;
  tahun: number;
  targetTw1: number;
  targetTw2: number;
  targetTw3: number;
  targetTw4: number;
  // Terhitung DB = jumlah keempat triwulan. Read-only (tidak dikirim di body).
  targetTotal: number;
}

export interface TargetSalesUnitFilter {
  search?: string;
  unitId?: number;
  tahun?: number;
  page?: number;
  limit?: number;
}

export interface TargetSalesUnitPage {
  items: TargetSalesUnit[];
  pagination: Pagination | null;
}

function buildQuery(filter: TargetSalesUnitFilter): string {
  const params = new URLSearchParams();
  if (filter.search) params.set("search", filter.search);
  if (filter.unitId) params.set("unit_id", String(filter.unitId));
  if (filter.tahun) params.set("tahun", String(filter.tahun));
  params.set("page", String(filter.page ?? 1));
  params.set("limit", String(filter.limit ?? 20));
  return params.toString();
}

// Server-to-server, dipanggil dari Server Component (halaman Target Sales
// Unit) untuk initial render. Best-effort: kegagalan mengembalikan halaman
// kosong.
export async function getTargetSalesUnitPage(
  filter: TargetSalesUnitFilter = {},
): Promise<TargetSalesUnitPage> {
  const { accessToken } = await getSessionCookies();
  if (!accessToken) return { items: [], pagination: null };

  try {
    const res = await fetchBackend(
      `/api/v1/business/target-sales-unit?${buildQuery(filter)}`,
    );
    const body: ApiResponse<TargetSalesUnit[]> = await res.json();
    if (!res.ok || !body.success) return { items: [], pagination: null };
    return { items: body.data ?? [], pagination: body.meta.pagination ?? null };
  } catch {
    return { items: [], pagination: null };
  }
}
