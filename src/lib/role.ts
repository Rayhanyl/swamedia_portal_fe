import { fetchBackend } from "@/lib/auth/fetch-backend";
import { getSessionCookies } from "@/lib/auth/session-cookies";
import type { ApiResponse, Pagination } from "@/types/api";

// Bentuk item GET /api/v1/master/roles — lihat
// documentation/note/api/04-rbac.md#modul-role.
// `id` role = nilai `swaportal_role_id` di WSO2 IS dan `{roleId}` pada
// endpoint Role Permission / Role Menu. DELETE role bersifat HAPUS FISIK.
export type RoleStatus = "AKTIF" | "TIDAK_AKTIF";

export interface Role {
  id: number;
  kodeRole: string;
  namaRole: string;
  deskripsi: string | null;
  status: RoleStatus;
}

export interface RoleFilter {
  search?: string;
  status?: RoleStatus;
  page?: number;
  limit?: number;
}

export interface RolePage {
  items: Role[];
  pagination: Pagination | null;
}

function buildQuery(filter: RoleFilter): string {
  const params = new URLSearchParams();
  if (filter.search) params.set("search", filter.search);
  if (filter.status) params.set("status", filter.status);
  params.set("page", String(filter.page ?? 1));
  params.set("limit", String(filter.limit ?? 20));
  return params.toString();
}

// Daftar role datar (limit besar) untuk dropdown/selector — dipakai form
// Manajemen User (pilih role) dan selector role di Role & Permission.
export async function getRoleList(): Promise<Role[]> {
  const { accessToken } = await getSessionCookies();
  if (!accessToken) return [];

  try {
    const res = await fetchBackend("/api/v1/master/roles?limit=100");
    const body: ApiResponse<Role[]> = await res.json();
    if (!res.ok || !body.success) return [];
    return body.data ?? [];
  } catch {
    return [];
  }
}

// Server-to-server berpaginasi untuk initial render tabel/selector role.
export async function getRolePage(filter: RoleFilter = {}): Promise<RolePage> {
  const { accessToken } = await getSessionCookies();
  if (!accessToken) return { items: [], pagination: null };

  try {
    const res = await fetchBackend(
      `/api/v1/master/roles?${buildQuery(filter)}`,
    );
    const body: ApiResponse<Role[]> = await res.json();
    if (!res.ok || !body.success) return { items: [], pagination: null };
    return { items: body.data ?? [], pagination: body.meta.pagination ?? null };
  } catch {
    return { items: [], pagination: null };
  }
}
