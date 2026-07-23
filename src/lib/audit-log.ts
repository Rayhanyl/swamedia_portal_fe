import { fetchBackend } from "@/lib/auth/fetch-backend";
import { getSessionCookies } from "@/lib/auth/session-cookies";
import type { ApiResponse, Pagination } from "@/types/api";

// Bentuk item GET /api/v1/audit-log — lihat
// documentation/note/api/08-administrasi.md#modul-audit-log.
// Read-only: baris ditulis otomatis oleh backend, tidak ada create/update/delete di sini.
export type AuditLogAksi = "CREATE" | "UPDATE" | "DELETE";

// `perubahan` biasanya berbentuk { old, new }, tapi beberapa aksi khusus (mis. reset
// password) mengisi ringkasan aksi alih-alih rekaman penuh — lihat catatan di dokumentasi.
// Ditangani secara defensif (unknown), bukan diasumsikan selalu punya old/new.
export interface AuditLogChange {
  old?: unknown;
  new?: unknown;
  [key: string]: unknown;
}

export interface AuditLog {
  id: number;
  tableName: string;
  recordId: string;
  aksi: AuditLogAksi;
  aktor: string;
  ipAddress: string | null;
  perubahan: AuditLogChange | null;
  waktu: string;
}

export interface AuditLogFilter {
  tableName?: string;
  aksi?: AuditLogAksi;
  aktor?: string;
  recordId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface AuditLogPage {
  items: AuditLog[];
  pagination: Pagination | null;
}

function buildAuditLogQuery(filter: AuditLogFilter): string {
  const params = new URLSearchParams();
  if (filter.tableName) params.set("table_name", filter.tableName);
  if (filter.aksi) params.set("aksi", filter.aksi);
  if (filter.aktor) params.set("aktor", filter.aktor);
  if (filter.recordId) params.set("record_id", filter.recordId);
  if (filter.dateFrom) params.set("date_from", filter.dateFrom);
  if (filter.dateTo) params.set("date_to", filter.dateTo);
  params.set("page", String(filter.page ?? 1));
  params.set("limit", String(filter.limit ?? 20));
  return params.toString();
}

// Server-to-server, dipanggil dari Server Component (halaman Audit Log)
// untuk initial render. Best-effort: kegagalan mengembalikan halaman kosong.
export async function getAuditLogPage(
  filter: AuditLogFilter = {},
): Promise<AuditLogPage> {
  const { accessToken } = await getSessionCookies();
  if (!accessToken) return { items: [], pagination: null };

  try {
    const res = await fetchBackend(
      `/api/v1/audit-log?${buildAuditLogQuery(filter)}`,
    );
    const body: ApiResponse<AuditLog[]> = await res.json();
    if (!res.ok || !body.success) return { items: [], pagination: null };
    return { items: body.data ?? [], pagination: body.meta.pagination ?? null };
  } catch {
    return { items: [], pagination: null };
  }
}
