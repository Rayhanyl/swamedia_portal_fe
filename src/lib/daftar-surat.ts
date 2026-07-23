import { fetchBackend } from "@/lib/auth/fetch-backend";
import { getSessionCookies } from "@/lib/auth/session-cookies";
import type { ApiResponse, Pagination } from "@/types/api";

// Bentuk item GET /api/v1/business/daftar-surat — lihat
// documentation/note/api/07-e-office.md. `nomor`/`tahun`/`urutan` di-generate
// backend dan read-only; `kategoriSuratId` immutable setelah dibuat.
export interface DaftarSurat {
  id: number;
  kategoriSuratId: number;
  kategoriKode: string;
  kategoriNama: string;
  proyekId: number | null;
  kodeProyek: string | null;
  namaProyek: string | null;
  tanggal: string;
  tahun: number;
  urutan: number;
  nomor: string;
  tujuan: string;
  perihal: string;
  keterangan: string | null;
  alasanPembatalan: string | null;
  isDibatalkan: boolean;
}

export interface DaftarSuratFilter {
  search?: string;
  tahun?: number;
  page?: number;
  limit?: number;
}

export interface DaftarSuratPage {
  items: DaftarSurat[];
  pagination: Pagination | null;
}

export function buildDaftarSuratQuery(filter: DaftarSuratFilter): string {
  const params = new URLSearchParams();
  if (filter.search) params.set("search", filter.search);
  if (filter.tahun) params.set("tahun", String(filter.tahun));
  params.set("page", String(filter.page ?? 1));
  params.set("limit", String(filter.limit ?? 20));
  return params.toString();
}

// Server-to-server, dipanggil dari Server Component (halaman Daftar Surat)
// untuk initial render. Best-effort: kegagalan mengembalikan halaman kosong.
export async function getDaftarSurat(
  filter: DaftarSuratFilter = {},
): Promise<DaftarSuratPage> {
  const { accessToken } = await getSessionCookies();
  if (!accessToken) return { items: [], pagination: null };

  try {
    const res = await fetchBackend(
      `/api/v1/business/daftar-surat?${buildDaftarSuratQuery(filter)}`,
    );
    const body: ApiResponse<DaftarSurat[]> = await res.json();
    if (!res.ok || !body.success) return { items: [], pagination: null };
    return { items: body.data ?? [], pagination: body.meta.pagination ?? null };
  } catch {
    return { items: [], pagination: null };
  }
}
