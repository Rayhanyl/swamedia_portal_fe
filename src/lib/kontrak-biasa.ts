import { fetchBackend } from "@/lib/auth/fetch-backend";
import { getSessionCookies } from "@/lib/auth/session-cookies";
import type { ApiResponse } from "@/types/api";

// Proyeksi ringan dari GET /api/v1/business/kontrak-biasa/dropdown — lihat
// documentation/note/api/05-sales-unit.md#modul-kontrak-biasa. Dipakai untuk
// field "Kontrak Biasa" (opsional) di form Proyek.
export interface KontrakBiasaDropdownItem {
  id: number;
  noKontrakBiasa: string;
  namaKontrak: string;
}

export async function getKontrakBiasaDropdown(): Promise<
  KontrakBiasaDropdownItem[]
> {
  const { accessToken } = await getSessionCookies();
  if (!accessToken) return [];

  try {
    const res = await fetchBackend("/api/v1/business/kontrak-biasa/dropdown");
    const body: ApiResponse<KontrakBiasaDropdownItem[]> = await res.json();
    if (!res.ok || !body.success) return [];
    return body.data ?? [];
  } catch {
    return [];
  }
}
