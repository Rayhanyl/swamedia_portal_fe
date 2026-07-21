import { fetchBackend } from "@/lib/auth/fetch-backend";
import { getSessionCookies } from "@/lib/auth/session-cookies";
import type { ApiResponse, Pagination } from "@/types/api";

// Bentuk item GET /api/v1/notifikasi — lihat
// documentation/note/api/02-dashboard-dan-self-service.md#modul-notifikasi.
export type NotifikasiKategori = "PENUGASAN" | "STATUS" | "SISTEM";

export interface Notifikasi {
  id: number;
  kategori: NotifikasiKategori;
  judul: string;
  pesan: string;
  refTable: string | null;
  refId: number | null;
  linkLabel: string | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface NotifikasiFilter {
  kategori?: NotifikasiKategori;
  isRead?: boolean;
  page?: number;
  limit?: number;
}

export interface NotifikasiPage {
  items: Notifikasi[];
  pagination: Pagination | null;
}

const EMPTY_PAGE: NotifikasiPage = { items: [], pagination: null };

// Dipanggil dari Server Component (halaman Notifikasi) untuk render awal.
// Server-to-server lewat fetchBackend, sama seperti getAkunSaya/getMenuSaya.
// Best-effort: kegagalan mengembalikan list kosong, bukan melempar error.
export async function getNotifikasi(
  filter: NotifikasiFilter = {},
): Promise<NotifikasiPage> {
  const { accessToken } = await getSessionCookies();
  if (!accessToken) return EMPTY_PAGE;

  const params = new URLSearchParams();
  if (filter.kategori) params.set("kategori", filter.kategori);
  if (filter.isRead !== undefined) params.set("is_read", String(filter.isRead));
  params.set("page", String(filter.page ?? 1));
  params.set("limit", String(filter.limit ?? 8));

  try {
    const res = await fetchBackend(`/api/v1/notifikasi?${params.toString()}`);
    const body: ApiResponse<Notifikasi[]> = await res.json();
    if (!res.ok || !body.success) return EMPTY_PAGE;
    return {
      items: body.data ?? [],
      pagination: body.meta.pagination ?? null,
    };
  } catch {
    return EMPTY_PAGE;
  }
}

export async function getUnreadCount(): Promise<number> {
  const { accessToken } = await getSessionCookies();
  if (!accessToken) return 0;

  try {
    const res = await fetchBackend("/api/v1/notifikasi/unread-count");
    const body: ApiResponse<{ unreadCount: number }> = await res.json();
    if (!res.ok || !body.success) return 0;
    return body.data?.unreadCount ?? 0;
  } catch {
    return 0;
  }
}
