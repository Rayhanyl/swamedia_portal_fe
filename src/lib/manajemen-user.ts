import { fetchBackend } from "@/lib/auth/fetch-backend";
import { getSessionCookies } from "@/lib/auth/session-cookies";
import type { ApiResponse, Pagination } from "@/types/api";

// Bentuk item GET /api/v1/manajemen-user — lihat
// documentation/note/api/04-rbac.md#modul-manajemen-user.
// Baca dari cache lokal (user_cache) hasil sinkronisasi WSO2 IS; tulis
// diteruskan ke WSO2 IS lewat SCIM2. Modul RBAC-nya `USER` (bukan
// `ROLE_PERMISSION`). Identitas utama = `subjectId` (string UUID WSO2 IS),
// BUKAN id numerik — semua path parameter memakai subjectId.
export interface PortalUser {
  subjectId: string;
  nama: string | null;
  email: string | null;
  // Status akun hasil sinkronisasi WSO2 IS (mis. "ACTIVE"). Bisa null bila
  // baris belum pernah tersinkronisasi.
  status: string | null;
  syncSource: string | null;
  lastSyncedAt: string | null;
  // Karyawan yang tertaut; null = "belum tertaut". Tautan dibuat dari sisi
  // modul Karyawan (subjectId), bukan dari modul ini.
  karyawanId: number | null;
  karyawanNama: string | null;
}

// CATATAN: `roleId` TIDAK ada di response list/detail — role tersimpan sebagai
// atribut swaportal_role_id di WSO2 IS dan tidak ikut di-cache. Endpoint
// /role menuliskannya, tapi nilai saat ini tidak terbaca lewat modul ini.

export interface UserFilter {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface UserPage {
  items: PortalUser[];
  pagination: Pagination | null;
}

function buildQuery(filter: UserFilter): string {
  const params = new URLSearchParams();
  if (filter.search) params.set("search", filter.search);
  if (filter.status) params.set("status", filter.status);
  params.set("page", String(filter.page ?? 1));
  params.set("limit", String(filter.limit ?? 20));
  return params.toString();
}

// Server-to-server untuk initial render halaman Manajemen User. Best-effort.
export async function getUserPage(filter: UserFilter = {}): Promise<UserPage> {
  const { accessToken } = await getSessionCookies();
  if (!accessToken) return { items: [], pagination: null };

  try {
    const res = await fetchBackend(
      `/api/v1/manajemen-user?${buildQuery(filter)}`,
    );
    const body: ApiResponse<PortalUser[]> = await res.json();
    if (!res.ok || !body.success) return { items: [], pagination: null };
    return { items: body.data ?? [], pagination: body.meta.pagination ?? null };
  } catch {
    return { items: [], pagination: null };
  }
}
