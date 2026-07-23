import { fetchBackend } from "@/lib/auth/fetch-backend";
import { getSessionCookies } from "@/lib/auth/session-cookies";
import type { ApiResponse, Pagination } from "@/types/api";

// Bentuk item GET /api/v1/master/units — lihat
// documentation/note/api/03-master-data.md#modul-unit-organisasi.
export type UnitStatus = "AKTIF" | "TIDAK_AKTIF";

export interface Unit {
  id: number;
  namaUnit: string;
  kodeUnit: string;
  // Kode 2 huruf legacy yang tertanam di NIK karyawan (mis. "BL" untuk
  // Billing System Solutions) — SENGAJA beda dari kodeUnit (mis. "BILL"),
  // lihat documentation/note/api/03-master-data.md#modul-karyawan.
  kodeNik: string;
  parentUnitId: number | null;
  tipeUnit: "STRUKTURAL" | "OPERASIONAL";
  status: UnitStatus;
}

// Endpoint /tree lebih cocok untuk tree-select; di sini dipakai list biasa
// (limit besar, flat) karena form Proyek hanya butuh dropdown datar.
export async function getUnitList(): Promise<Unit[]> {
  const { accessToken } = await getSessionCookies();
  if (!accessToken) return [];

  try {
    const res = await fetchBackend("/api/v1/master/units?limit=100");
    const body: ApiResponse<Unit[]> = await res.json();
    if (!res.ok || !body.success) return [];
    return body.data ?? [];
  } catch {
    return [];
  }
}

export interface UnitFilter {
  search?: string;
  status?: UnitStatus;
  parentId?: number;
  page?: number;
  limit?: number;
}

export interface UnitPage {
  items: Unit[];
  pagination: Pagination | null;
}

function buildUnitQuery(filter: UnitFilter): string {
  const params = new URLSearchParams();
  if (filter.search) params.set("search", filter.search);
  if (filter.status) params.set("status", filter.status);
  if (filter.parentId) params.set("parent_id", String(filter.parentId));
  params.set("page", String(filter.page ?? 1));
  params.set("limit", String(filter.limit ?? 20));
  return params.toString();
}

// Server-to-server, dipanggil dari Server Component (halaman Unit Organisasi)
// untuk initial render. Best-effort: kegagalan mengembalikan halaman kosong.
export async function getUnitPage(filter: UnitFilter = {}): Promise<UnitPage> {
  const { accessToken } = await getSessionCookies();
  if (!accessToken) return { items: [], pagination: null };

  try {
    const res = await fetchBackend(
      `/api/v1/master/units?${buildUnitQuery(filter)}`,
    );
    const body: ApiResponse<Unit[]> = await res.json();
    if (!res.ok || !body.success) return { items: [], pagination: null };
    return { items: body.data ?? [], pagination: body.meta.pagination ?? null };
  } catch {
    return { items: [], pagination: null };
  }
}
