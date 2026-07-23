import { fetchBackend } from "@/lib/auth/fetch-backend";
import { getSessionCookies } from "@/lib/auth/session-cookies";
import type { ApiResponse } from "@/types/api";

// Bentuk item GET /api/v1/konfigurasi-sistem — lihat
// documentation/note/api/08-administrasi.md#modul-konfigurasi-sistem.
// Registry key-value global (sys_config) hasil seeding. HANYA `value` yang
// bisa diubah (via PUT /{key}); tidak ada create/delete karena kumpulan key
// sudah tetap sejak build skema. Kunci = `key` (string), bukan id numerik.
export interface SysConfig {
  key: string;
  // Bisa null — beberapa key (mis. last_sync_at) memang mulai kosong.
  value: string | null;
  deskripsi: string | null;
  updatedAt: string | null;
  updatedBy: string | null;
}

// Tanpa paginasi — endpoint mengembalikan seluruh setting sekaligus.
export async function getKonfigurasiList(search?: string): Promise<SysConfig[]> {
  const { accessToken } = await getSessionCookies();
  if (!accessToken) return [];

  try {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    const res = await fetchBackend(
      `/api/v1/konfigurasi-sistem?${params.toString()}`,
    );
    const body: ApiResponse<SysConfig[]> = await res.json();
    if (!res.ok || !body.success) return [];
    return body.data ?? [];
  } catch {
    return [];
  }
}
