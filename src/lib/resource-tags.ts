import { fetchBackend } from "@/lib/auth/fetch-backend";
import { getSessionCookies } from "@/lib/auth/session-cookies";
import type { ApiResponse, Pagination } from "@/types/api";

// Bentuk item GET /api/v1/master/resource-tags — lihat
// documentation/note/api/03-master-data.md#modul-resource-tags.
// Label untuk Resource Unit — sama seperti Tags, ditambah deskripsi & status.
export type ResourceTagStatus = "AKTIF" | "TIDAK_AKTIF";

export interface ResourceTag {
  id: number;
  kode: string;
  nama: string;
  unitId: number | null;
  deskripsi: string | null;
  status: ResourceTagStatus;
}

export interface ResourceTagFilter {
  search?: string;
  unitId?: number;
  status?: ResourceTagStatus;
  page?: number;
  limit?: number;
}

export interface ResourceTagPage {
  items: ResourceTag[];
  pagination: Pagination | null;
}

function buildResourceTagQuery(filter: ResourceTagFilter): string {
  const params = new URLSearchParams();
  if (filter.search) params.set("search", filter.search);
  if (filter.unitId) params.set("unit_id", String(filter.unitId));
  if (filter.status) params.set("status", filter.status);
  params.set("page", String(filter.page ?? 1));
  params.set("limit", String(filter.limit ?? 20));
  return params.toString();
}

// Server-to-server, dipanggil dari Server Component (halaman Resource Tags)
// untuk initial render. Best-effort: kegagalan mengembalikan halaman kosong.
export async function getResourceTagPage(
  filter: ResourceTagFilter = {},
): Promise<ResourceTagPage> {
  const { accessToken } = await getSessionCookies();
  if (!accessToken) return { items: [], pagination: null };

  try {
    const res = await fetchBackend(
      `/api/v1/master/resource-tags?${buildResourceTagQuery(filter)}`,
    );
    const body: ApiResponse<ResourceTag[]> = await res.json();
    if (!res.ok || !body.success) return { items: [], pagination: null };
    return { items: body.data ?? [], pagination: body.meta.pagination ?? null };
  } catch {
    return { items: [], pagination: null };
  }
}
