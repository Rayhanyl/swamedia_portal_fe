import { fetchBackend } from "@/lib/auth/fetch-backend";
import { getSessionCookies } from "@/lib/auth/session-cookies";
import type { ApiResponse } from "@/types/api";

// Bentuk item GET /api/v1/master/kategori-surat — lihat
// documentation/note/api/03-master-data.md#modul-kategori-surat.
export type KategoriSuratStatus = "AKTIF" | "TIDAK_AKTIF";

export interface KategoriSurat {
  id: number;
  kode: string;
  nama: string;
  status: KategoriSuratStatus;
  isDefault: boolean;
}

export interface KategoriSuratWithCount extends KategoriSurat {
  jumlahSurat: number;
}

// Server-to-server, dipanggil dari Server Component (halaman Kategori
// Surat). Limit besar karena master ini kecil (9 default + tambahan admin),
// tidak perlu paginasi UI. Best-effort: kegagalan mengembalikan array kosong.
export async function getKategoriSuratList(): Promise<KategoriSurat[]> {
  const { accessToken } = await getSessionCookies();
  if (!accessToken) return [];

  try {
    const res = await fetchBackend("/api/v1/master/kategori-surat?limit=100");
    const body: ApiResponse<KategoriSurat[]> = await res.json();
    if (!res.ok || !body.success) return [];
    return body.data ?? [];
  } catch {
    return [];
  }
}

// "Jumlah Surat" TIDAK ada di response kategori-surat — satu-satunya sumber
// nyatanya adalah menghitung lewat modul Daftar Surat (limit=1 supaya cuma
// meta.pagination yang dipakai, bukan datanya). Default `tahun` di endpoint
// itu adalah TAHUN BERJALAN, jadi angka ini merepresentasikan surat tahun
// ini per kategori, bukan all-time.
export async function getJumlahSuratByKategori(
  kategoriId: number,
): Promise<number> {
  const { accessToken } = await getSessionCookies();
  if (!accessToken) return 0;

  try {
    const res = await fetchBackend(
      `/api/v1/business/daftar-surat?kategori_surat_id=${kategoriId}&limit=1`,
    );
    const body: ApiResponse<unknown[]> = await res.json();
    if (!res.ok || !body.success) return 0;
    return body.meta.pagination?.totalItems ?? 0;
  } catch {
    return 0;
  }
}

export async function getKategoriSuratWithCount(): Promise<
  KategoriSuratWithCount[]
> {
  const list = await getKategoriSuratList();
  const counts = await Promise.all(
    list.map((k) => getJumlahSuratByKategori(k.id)),
  );
  return list.map((k, i) => ({ ...k, jumlahSurat: counts[i] }));
}
