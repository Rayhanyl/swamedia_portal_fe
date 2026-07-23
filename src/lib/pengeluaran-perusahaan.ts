import { fetchBackend } from "@/lib/auth/fetch-backend";
import { getSessionCookies } from "@/lib/auth/session-cookies";
import type { ApprovalStatus } from "@/lib/approval-status";
import type { ApiResponse, Pagination } from "@/types/api";

// Bentuk item GET /api/v1/finance/pengeluaran-perusahaan — lihat
// documentation/note/api/06-finansial.md#modul-pengeluaran-perusahaan.
// Kembaran Pembayaran, tetapi cash-out internal terkait unit (bukan
// proyek) — alur approval identik, lihat lib/approval-status.ts.
export type { ApprovalStatus };

export interface PengeluaranPerusahaan {
  id: number;
  unitId: number;
  unitNama: string | null;
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

export interface PengeluaranPerusahaanFilter {
  search?: string;
  unitId?: number;
  kategoriId?: number;
  status?: ApprovalStatus;
  page?: number;
  limit?: number;
}

export interface PengeluaranPerusahaanPage {
  items: PengeluaranPerusahaan[];
  pagination: Pagination | null;
}

function buildPengeluaranQuery(filter: PengeluaranPerusahaanFilter): string {
  const params = new URLSearchParams();
  if (filter.search) params.set("search", filter.search);
  if (filter.unitId) params.set("unit_id", String(filter.unitId));
  if (filter.kategoriId) params.set("kategori_id", String(filter.kategoriId));
  if (filter.status) params.set("status", filter.status);
  params.set("page", String(filter.page ?? 1));
  params.set("limit", String(filter.limit ?? 20));
  return params.toString();
}

// Server-to-server, dipanggil dari Server Component (halaman Pengeluaran
// Perusahaan) untuk initial render. Best-effort: kegagalan mengembalikan
// halaman kosong.
export async function getPengeluaranPerusahaanPage(
  filter: PengeluaranPerusahaanFilter = {},
): Promise<PengeluaranPerusahaanPage> {
  const { accessToken } = await getSessionCookies();
  if (!accessToken) return { items: [], pagination: null };

  try {
    const res = await fetchBackend(
      `/api/v1/finance/pengeluaran-perusahaan?${buildPengeluaranQuery(filter)}`,
    );
    const body: ApiResponse<PengeluaranPerusahaan[]> = await res.json();
    if (!res.ok || !body.success) return { items: [], pagination: null };
    return { items: body.data ?? [], pagination: body.meta.pagination ?? null };
  } catch {
    return { items: [], pagination: null };
  }
}
