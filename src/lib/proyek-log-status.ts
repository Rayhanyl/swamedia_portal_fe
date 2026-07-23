import { fetchBackend } from "@/lib/auth/fetch-backend";
import { getSessionCookies } from "@/lib/auth/session-cookies";
import type { ApiResponse } from "@/types/api";
import type { ProyekStatus } from "./proyek-status";

// Bentuk item GET /api/v1/business/proyek/{id}/log-status — read-only,
// ditulis backend otomatis saat proyek dibuat & setiap kali status berubah
// (lewat PUT /api/v1/business/proyek/{id}). Lihat
// documentation/note/api/05-sales-unit.md.
export interface ProyekLogStatus {
  id: number;
  proyekId: number;
  status: ProyekStatus;
  komentar: string | null;
  tanggal: string;
  createdAt: string;
  createdBy: string;
}

export async function getProyekLogStatus(
  proyekId: number,
): Promise<ProyekLogStatus[]> {
  const { accessToken } = await getSessionCookies();
  if (!accessToken) return [];

  try {
    const res = await fetchBackend(
      `/api/v1/business/proyek/${proyekId}/log-status`,
    );
    const body: ApiResponse<ProyekLogStatus[]> = await res.json();
    if (!res.ok || !body.success) return [];
    return body.data ?? [];
  } catch {
    return [];
  }
}
