import { fetchBackend } from "@/lib/auth/fetch-backend";
import { getSessionCookies } from "@/lib/auth/session-cookies";
import type { ApiResponse, Pagination } from "@/types/api";

// Bentuk item GET /api/v1/master/resource-unit — lihat
// documentation/note/api/03-master-data.md#modul-resource-unit.
// Satu baris per unit (unik) — informasi kapasitas/headcount.
export type ResourceUnitStatus = "AKTIF" | "TIDAK_AKTIF";

export interface ResourceUnit {
  id: number;
  unitId: number;
  unitNama: string | null;
  leadId: number | null;
  leadNama: string | null;
  jumlah: number;
  kapasitasTerpakai: number;
  status: ResourceUnitStatus;
}

export interface ResourceUnitFilter {
  search?: string;
  unitId?: number;
  status?: ResourceUnitStatus;
  page?: number;
  limit?: number;
}

export interface ResourceUnitPage {
  items: ResourceUnit[];
  pagination: Pagination | null;
}

function buildResourceUnitQuery(filter: ResourceUnitFilter): string {
  const params = new URLSearchParams();
  if (filter.search) params.set("search", filter.search);
  if (filter.unitId) params.set("unit_id", String(filter.unitId));
  if (filter.status) params.set("status", filter.status);
  params.set("page", String(filter.page ?? 1));
  params.set("limit", String(filter.limit ?? 20));
  return params.toString();
}

// Server-to-server, dipanggil dari Server Component (halaman Resource Unit)
// untuk initial render. Best-effort: kegagalan mengembalikan halaman kosong.
export async function getResourceUnitPage(
  filter: ResourceUnitFilter = {},
): Promise<ResourceUnitPage> {
  const { accessToken } = await getSessionCookies();
  if (!accessToken) return { items: [], pagination: null };

  try {
    const res = await fetchBackend(
      `/api/v1/master/resource-unit?${buildResourceUnitQuery(filter)}`,
    );
    const body: ApiResponse<ResourceUnit[]> = await res.json();
    if (!res.ok || !body.success) return { items: [], pagination: null };
    return { items: body.data ?? [], pagination: body.meta.pagination ?? null };
  } catch {
    return { items: [], pagination: null };
  }
}
