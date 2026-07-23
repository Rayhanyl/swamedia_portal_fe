import { fetchBackend } from "@/lib/auth/fetch-backend";
import { getSessionCookies } from "@/lib/auth/session-cookies";
import type { ApiResponse, Pagination } from "@/types/api";

// Bentuk item GET /api/v1/master/industries — lihat
// documentation/note/api/03-master-data.md#modul-industri.
export interface Industri {
  id: number;
  kode: string;
  nama: string;
}

export async function getIndustriList(): Promise<Industri[]> {
  const { accessToken } = await getSessionCookies();
  if (!accessToken) return [];

  try {
    const res = await fetchBackend("/api/v1/master/industries?limit=100");
    const body: ApiResponse<Industri[]> = await res.json();
    if (!res.ok || !body.success) return [];
    return body.data ?? [];
  } catch {
    return [];
  }
}

export interface IndustriFilter {
  search?: string;
  page?: number;
  limit?: number;
}

export interface IndustriPage {
  items: Industri[];
  pagination: Pagination | null;
}

function buildIndustriQuery(filter: IndustriFilter): string {
  const params = new URLSearchParams();
  if (filter.search) params.set("search", filter.search);
  params.set("page", String(filter.page ?? 1));
  params.set("limit", String(filter.limit ?? 20));
  return params.toString();
}

// Server-to-server, dipanggil dari Server Component (halaman Industri)
// untuk initial render. Best-effort: kegagalan mengembalikan halaman kosong.
export async function getIndustriPage(
  filter: IndustriFilter = {},
): Promise<IndustriPage> {
  const { accessToken } = await getSessionCookies();
  if (!accessToken) return { items: [], pagination: null };

  try {
    const res = await fetchBackend(
      `/api/v1/master/industries?${buildIndustriQuery(filter)}`,
    );
    const body: ApiResponse<Industri[]> = await res.json();
    if (!res.ok || !body.success) return { items: [], pagination: null };
    return { items: body.data ?? [], pagination: body.meta.pagination ?? null };
  } catch {
    return { items: [], pagination: null };
  }
}
