import { fetchBackend } from "@/lib/auth/fetch-backend";
import { getSessionCookies } from "@/lib/auth/session-cookies";
import type { ApiResponse, Pagination } from "@/types/api";

// Bentuk item GET /api/v1/master/kategori-finansial-keluar — lihat
// documentation/note/api/03-master-data.md#modul-kategori-finansial-keluar.
// Dipakai sebagai dropdown `kategoriId` di form Pembayaran & Pengeluaran
// Perusahaan, dan dikelola lewat halaman Kategori Finansial
// (RBAC: `KATEGORI_FINANSIAL_KELUAR` — hanya SUPER_ADMIN/FINANCE yang boleh
// create/update/delete, role lain read-only).
export type KategoriFinansialKeluarStatus = "AKTIF" | "TIDAK_AKTIF";

export interface KategoriFinansialKeluar {
  id: number;
  kode: string;
  nama: string;
  status: KategoriFinansialKeluarStatus;
  createdAt?: string;
  createdBy?: string;
}

export async function getKategoriFinansialKeluarList(): Promise<
  KategoriFinansialKeluar[]
> {
  const { accessToken } = await getSessionCookies();
  if (!accessToken) return [];

  try {
    const res = await fetchBackend(
      "/api/v1/master/kategori-finansial-keluar?limit=100",
    );
    const body: ApiResponse<KategoriFinansialKeluar[]> = await res.json();
    if (!res.ok || !body.success) return [];
    return body.data ?? [];
  } catch {
    return [];
  }
}

export interface KategoriFinansialKeluarFilter {
  search?: string;
  status?: KategoriFinansialKeluarStatus;
  page?: number;
  limit?: number;
}

export interface KategoriFinansialKeluarPage {
  items: KategoriFinansialKeluar[];
  pagination: Pagination | null;
}

function buildKategoriFinansialKeluarQuery(
  filter: KategoriFinansialKeluarFilter,
): string {
  const params = new URLSearchParams();
  if (filter.search) params.set("search", filter.search);
  if (filter.status) params.set("status", filter.status);
  params.set("page", String(filter.page ?? 1));
  params.set("limit", String(filter.limit ?? 20));
  return params.toString();
}

// Server-to-server, dipanggil dari Server Component (halaman Kategori
// Finansial) untuk initial render. Best-effort: kegagalan mengembalikan
// halaman kosong.
export async function getKategoriFinansialKeluarPage(
  filter: KategoriFinansialKeluarFilter = {},
): Promise<KategoriFinansialKeluarPage> {
  const { accessToken } = await getSessionCookies();
  if (!accessToken) return { items: [], pagination: null };

  try {
    const res = await fetchBackend(
      `/api/v1/master/kategori-finansial-keluar?${buildKategoriFinansialKeluarQuery(filter)}`,
    );
    const body: ApiResponse<KategoriFinansialKeluar[]> = await res.json();
    if (!res.ok || !body.success) return { items: [], pagination: null };
    return {
      items: body.data ?? [],
      pagination: body.meta.pagination ?? null,
    };
  } catch {
    return { items: [], pagination: null };
  }
}
