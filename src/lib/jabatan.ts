import { fetchBackend } from "@/lib/auth/fetch-backend";
import { getSessionCookies } from "@/lib/auth/session-cookies";
import type { ApiResponse } from "@/types/api";

// Bentuk item GET /api/v1/master/jabatan — lihat
// documentation/note/api/03-master-data.md#modul-jabatan. Read-only, tanpa
// paginasi — dipakai sebagai sumber dropdown di form Karyawan.
export type JabatanStatus = "AKTIF" | "TIDAK_AKTIF";

export interface Jabatan {
  id: number;
  namaJabatan: string;
  kategori: string;
  unitTerkaitId: number | null;
  isKombinasiUnit: boolean;
  status: JabatanStatus;
}

// Tanpa parameter status, backend hanya mengembalikan jabatan AKTIF (beda
// dari modul lain yang defaultnya mengembalikan semua status) — perilaku
// ini yang diinginkan untuk dropdown.
export async function getJabatanList(): Promise<Jabatan[]> {
  const { accessToken } = await getSessionCookies();
  if (!accessToken) return [];

  try {
    const res = await fetchBackend("/api/v1/master/jabatan");
    const body: ApiResponse<Jabatan[]> = await res.json();
    if (!res.ok || !body.success) return [];
    return body.data ?? [];
  } catch {
    return [];
  }
}
