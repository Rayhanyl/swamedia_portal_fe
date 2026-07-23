import { fetchBackend } from "@/lib/auth/fetch-backend";
import { getSessionCookies } from "@/lib/auth/session-cookies";
import type { ApiResponse } from "@/types/api";

// Bentuk item GET .../proyek/{proyekId}/tags — lihat
// documentation/note/api/05-sales-unit.md#sub-resource-proyek-tags.
// Perhatikan: id tag di sini bernama `tagsId` (BUKAN `id` seperti di master
// /api/v1/master/tags) — nama field berbeda tergantung endpoint yang dibaca.
export interface ProyekTag {
  tagsId: number;
  kode: string;
  nama: string;
  unitId: number | null;
}

export async function getProyekTags(proyekId: number): Promise<ProyekTag[]> {
  const { accessToken } = await getSessionCookies();
  if (!accessToken) return [];

  try {
    const res = await fetchBackend(`/api/v1/business/proyek/${proyekId}/tags`);
    const body: ApiResponse<ProyekTag[]> = await res.json();
    if (!res.ok || !body.success) return [];
    return body.data ?? [];
  } catch {
    return [];
  }
}
