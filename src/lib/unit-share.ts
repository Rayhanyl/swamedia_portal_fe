import { fetchBackend } from "@/lib/auth/fetch-backend";
import { getSessionCookies } from "@/lib/auth/session-cookies";
import type { ApiResponse } from "@/types/api";

// Bentuk item GET .../proyek/{proyekId}/unit-share — lihat
// documentation/note/api/05-sales-unit.md#sub-resource-unit-share.
export interface UnitShare {
  id: number;
  proyekId: number;
  unitId: number;
  unitNama: string | null;
  nilaiShare: number;
  persentase: number | null;
  createdAt: string;
  updatedAt: string | null;
  createdBy: string;
  updatedBy: string | null;
}

export async function getUnitShareList(proyekId: number): Promise<UnitShare[]> {
  const { accessToken } = await getSessionCookies();
  if (!accessToken) return [];

  try {
    const res = await fetchBackend(
      `/api/v1/business/proyek/${proyekId}/unit-share`,
    );
    const body: ApiResponse<UnitShare[]> = await res.json();
    if (!res.ok || !body.success) return [];
    return body.data ?? [];
  } catch {
    return [];
  }
}
