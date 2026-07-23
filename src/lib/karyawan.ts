import { fetchBackend } from "@/lib/auth/fetch-backend";
import { getSessionCookies } from "@/lib/auth/session-cookies";
import type { ApiResponse, Pagination } from "@/types/api";

// Proyeksi ringan dari GET /api/v1/master/karyawan/dropdown — lihat
// documentation/note/api/03-master-data.md#modul-karyawan. Dipakai untuk
// field PIC Sales Eksekutif / PMO di form Proyek.
export interface KaryawanDropdownItem {
  id: number;
  nama: string;
  unitNama: string | null;
}

export async function getKaryawanDropdown(): Promise<KaryawanDropdownItem[]> {
  const { accessToken } = await getSessionCookies();
  if (!accessToken) return [];

  try {
    const res = await fetchBackend(
      "/api/v1/master/karyawan/dropdown?status=AKTIF",
    );
    const body: ApiResponse<KaryawanDropdownItem[]> = await res.json();
    if (!res.ok || !body.success) return [];
    return body.data ?? [];
  } catch {
    return [];
  }
}

// Bentuk item GET /api/v1/master/karyawan — lihat
// documentation/note/api/03-master-data.md#modul-karyawan.
export type KaryawanStatus = "AKTIF" | "TIDAK_AKTIF";

// Objek hasil join — request memakai `jabatanId` (int), response memberi
// objek ini. Selalu ada karena jabatanId wajib.
export interface KaryawanJabatan {
  id: number;
  namaJabatan: string;
  kategori: string;
}

// "P" Pegawai Tetap / "C" Kontrak — juga tertanam di `nik` untuk karyawan
// non-pendiri, lihat documentation/note/api/03-master-data.md#modul-karyawan.
export type TipeKaryawan = "P" | "C";

export interface Karyawan {
  id: number;
  nik: string;
  nama: string;
  jabatan: KaryawanJabatan;
  unitId: number;
  tipeKaryawan: TipeKaryawan;
  email: string | null;
  noHp: string | null;
  tanggalMasuk: string | null;
  status: KaryawanStatus;
}

export interface KaryawanFilter {
  search?: string;
  unitId?: number;
  status?: KaryawanStatus;
  page?: number;
  limit?: number;
}

export interface KaryawanPage {
  items: Karyawan[];
  pagination: Pagination | null;
}

function buildKaryawanQuery(filter: KaryawanFilter): string {
  const params = new URLSearchParams();
  if (filter.search) params.set("search", filter.search);
  if (filter.unitId) params.set("unit_id", String(filter.unitId));
  if (filter.status) params.set("status", filter.status);
  params.set("page", String(filter.page ?? 1));
  params.set("limit", String(filter.limit ?? 20));
  return params.toString();
}

// Server-to-server, dipanggil dari Server Component (halaman Karyawan)
// untuk initial render. Best-effort: kegagalan mengembalikan halaman kosong.
export async function getKaryawanPage(
  filter: KaryawanFilter = {},
): Promise<KaryawanPage> {
  const { accessToken } = await getSessionCookies();
  if (!accessToken) return { items: [], pagination: null };

  try {
    const res = await fetchBackend(
      `/api/v1/master/karyawan?${buildKaryawanQuery(filter)}`,
    );
    const body: ApiResponse<Karyawan[]> = await res.json();
    if (!res.ok || !body.success) return { items: [], pagination: null };
    return { items: body.data ?? [], pagination: body.meta.pagination ?? null };
  } catch {
    return { items: [], pagination: null };
  }
}

// Bentuk GET /api/v1/master/karyawan/{id} — sama dengan item list, ditambah
// `subjectId` (tidak pernah ada di list/dropdown, hanya di detail — lihat
// catatan privasi di dokumentasi) dan field audit.
export interface KaryawanDetail extends Karyawan {
  subjectId: string | null;
  createdAt: string;
  updatedAt: string | null;
  createdBy: string;
  updatedBy: string | null;
}

// Bentuk GET /api/v1/master/karyawan/preview-nik — read-only, tidak me-reserve
// apa pun (nilai bisa berubah jika ada create lain lebih dulu). Butuh query
// param `unit_id` dan `tipe_karyawan` (keduanya wajib — dipakai menyusun huruf
// unit/tipe di NIK), `tahun` opsional (default tahun kalender saat ini).
// Dipakai untuk mengisi saran NIK otomatis di dialog Tambah Karyawan; field
// tetap bisa diedit manual — lihat
// documentation/note/api/03-master-data.md#modul-karyawan.
export interface KaryawanNikPreview {
  nikPreview: string;
}
