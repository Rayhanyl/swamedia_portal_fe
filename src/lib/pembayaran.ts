import { fetchBackend } from "@/lib/auth/fetch-backend";
import { getSessionCookies } from "@/lib/auth/session-cookies";
import type { ApprovalStatus } from "@/lib/approval-status";
import type { ApiResponse, Pagination } from "@/types/api";

// Bentuk item GET /api/v1/finance/pembayaran — lihat
// documentation/note/api/06-finansial.md#modul-pembayaran. Cash-out
// terkait proyek, melalui alur approval (lihat lib/approval-status.ts).
export type { ApprovalStatus };

export interface Pembayaran {
  id: number;
  proyekId: number;
  proyekKode: string | null;
  proyekNama: string | null;
  kategoriId: number;
  kategoriNama: string | null;
  nilai: number;
  tanggalPengajuan: string;
  tanggalRealisasi: string | null;
  keterangan: string | null;
  status: ApprovalStatus;
  approvedBy: string | null;
  approvedAt: string | null;
  catatanApproval: string | null;
}

export interface PembayaranFilter {
  search?: string;
  proyekId?: number;
  kategoriId?: number;
  status?: ApprovalStatus;
  page?: number;
  limit?: number;
}

export interface PembayaranPage {
  items: Pembayaran[];
  pagination: Pagination | null;
}

function buildPembayaranQuery(filter: PembayaranFilter): string {
  const params = new URLSearchParams();
  if (filter.search) params.set("search", filter.search);
  if (filter.proyekId) params.set("proyek_id", String(filter.proyekId));
  if (filter.kategoriId) params.set("kategori_id", String(filter.kategoriId));
  if (filter.status) params.set("status", filter.status);
  params.set("page", String(filter.page ?? 1));
  params.set("limit", String(filter.limit ?? 20));
  return params.toString();
}

// Server-to-server, dipanggil dari Server Component (halaman Pembayaran)
// untuk initial render. Best-effort: kegagalan mengembalikan halaman kosong.
export async function getPembayaranPage(
  filter: PembayaranFilter = {},
): Promise<PembayaranPage> {
  const { accessToken } = await getSessionCookies();
  if (!accessToken) return { items: [], pagination: null };

  try {
    const res = await fetchBackend(
      `/api/v1/finance/pembayaran?${buildPembayaranQuery(filter)}`,
    );
    const body: ApiResponse<Pembayaran[]> = await res.json();
    if (!res.ok || !body.success) return { items: [], pagination: null };
    return { items: body.data ?? [], pagination: body.meta.pagination ?? null };
  } catch {
    return { items: [], pagination: null };
  }
}
