import { fetchBackend } from "@/lib/auth/fetch-backend";
import { getSessionCookies } from "@/lib/auth/session-cookies";
import type { ApiResponse } from "@/types/api";
import type { PencairanStatus } from "./tagihan-status";

// Bentuk item GET .../tagihan/{tagihanId}/pencairan — lihat
// documentation/note/api/06-finansial.md#sub-resource-pencairan.
export interface Pencairan {
  id: number;
  tagihanId: number;
  tanggalPencairan: string;
  nilai: number;
  status: PencairanStatus;
  keterangan: string | null;
  createdAt: string;
  createdBy: string;
}

export async function getPencairanList(
  tagihanId: number,
): Promise<Pencairan[]> {
  const { accessToken } = await getSessionCookies();
  if (!accessToken) return [];

  try {
    const res = await fetchBackend(
      `/api/v1/finance/tagihan/${tagihanId}/pencairan`,
    );
    const body: ApiResponse<Pencairan[]> = await res.json();
    if (!res.ok || !body.success) return [];
    return body.data ?? [];
  } catch {
    return [];
  }
}
