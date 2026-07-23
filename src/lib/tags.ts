import { fetchBackend } from "@/lib/auth/fetch-backend";
import { getSessionCookies } from "@/lib/auth/session-cookies";
import type { ApiResponse, Pagination } from "@/types/api";

// Bentuk item GET /api/v1/master/tags — lihat
// documentation/note/api/03-master-data.md#modul-tags. Tidak ada endpoint
// /dropdown khusus untuk Tags, jadi dipakai list berpaginasi dengan limit
// besar. `unitId` null = tag global.
export interface Tag {
  id: number;
  kode: string;
  nama: string;
  unitId: number | null;
}

export async function getTagList(): Promise<Tag[]> {
  const { accessToken } = await getSessionCookies();
  if (!accessToken) return [];

  try {
    const res = await fetchBackend("/api/v1/master/tags?limit=100");
    const body: ApiResponse<Tag[]> = await res.json();
    if (!res.ok || !body.success) return [];
    return body.data ?? [];
  } catch {
    return [];
  }
}

export interface TagFilter {
  search?: string;
  unitId?: number;
  page?: number;
  limit?: number;
}

export interface TagPage {
  items: Tag[];
  pagination: Pagination | null;
}

function buildTagQuery(filter: TagFilter): string {
  const params = new URLSearchParams();
  if (filter.search) params.set("search", filter.search);
  if (filter.unitId) params.set("unit_id", String(filter.unitId));
  params.set("page", String(filter.page ?? 1));
  params.set("limit", String(filter.limit ?? 20));
  return params.toString();
}

// Server-to-server, dipanggil dari Server Component (halaman Tags) untuk
// initial render. Best-effort: kegagalan mengembalikan halaman kosong.
export async function getTagPage(filter: TagFilter = {}): Promise<TagPage> {
  const { accessToken } = await getSessionCookies();
  if (!accessToken) return { items: [], pagination: null };

  try {
    const res = await fetchBackend(
      `/api/v1/master/tags?${buildTagQuery(filter)}`,
    );
    const body: ApiResponse<Tag[]> = await res.json();
    if (!res.ok || !body.success) return { items: [], pagination: null };
    return { items: body.data ?? [], pagination: body.meta.pagination ?? null };
  } catch {
    return { items: [], pagination: null };
  }
}
