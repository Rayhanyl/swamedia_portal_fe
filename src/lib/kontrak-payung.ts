import { fetchBackend } from "@/lib/auth/fetch-backend";
import { getSessionCookies } from "@/lib/auth/session-cookies";
import type { ApiResponse, Pagination } from "@/types/api";

// Bentuk item GET /api/v1/business/kontrak-payung — lihat
// documentation/note/api/05-sales-unit.md#modul-kontrak-payung.
export interface KontrakPayung {
  id: number;
  customerId: number;
  customerNama: string | null;
  noKontrakPayung: string;
  namaKontrak: string;
  tanggalKontrak: string;
  tanggalMulai: string;
  tanggalSelesai: string;
}

// `roleId` merujuk ke `project_role_master` (peran proyek), BUKAN role RBAC
// — sama seperti Team Member, sampai saat ini tidak ada endpoint master
// terdokumentasi untuk daftar peran proyek ini, jadi field `roleId` di form
// diisi manual sebagai angka (lihat lib/team-member.ts untuk pola yang sama).
export type TipeHargaRole = "PER_BULAN" | "PER_PROJECT";

export interface KontrakPayungHargaRole {
  id: number;
  kontrakPayungId: number;
  roleId: number;
  roleNama: string | null;
  tipeHarga: TipeHargaRole;
  nilai: number;
  keterangan: string | null;
}

// Bentuk GET /api/v1/business/kontrak-payung/{id} — sama dengan item list,
// ditambah `hargaRole[]` (TIDAK ada di list, hanya di detail) dan field audit.
export interface KontrakPayungDetail extends KontrakPayung {
  hargaRole: KontrakPayungHargaRole[];
  createdAt: string;
  updatedAt: string | null;
  createdBy: string;
  updatedBy: string | null;
}

export interface KontrakPayungFilter {
  search?: string;
  customerId?: number;
  page?: number;
  limit?: number;
}

export interface KontrakPayungPage {
  items: KontrakPayung[];
  pagination: Pagination | null;
}

function buildKontrakPayungQuery(filter: KontrakPayungFilter): string {
  const params = new URLSearchParams();
  if (filter.search) params.set("search", filter.search);
  if (filter.customerId) params.set("customer_id", String(filter.customerId));
  params.set("page", String(filter.page ?? 1));
  params.set("limit", String(filter.limit ?? 20));
  return params.toString();
}

// Server-to-server, dipanggil dari Server Component (halaman Kontrak Payung)
// untuk initial render. Best-effort: kegagalan mengembalikan halaman kosong.
export async function getKontrakPayungPage(
  filter: KontrakPayungFilter = {},
): Promise<KontrakPayungPage> {
  const { accessToken } = await getSessionCookies();
  if (!accessToken) return { items: [], pagination: null };

  try {
    const res = await fetchBackend(
      `/api/v1/business/kontrak-payung?${buildKontrakPayungQuery(filter)}`,
    );
    const body: ApiResponse<KontrakPayung[]> = await res.json();
    if (!res.ok || !body.success) return { items: [], pagination: null };
    return { items: body.data ?? [], pagination: body.meta.pagination ?? null };
  } catch {
    return { items: [], pagination: null };
  }
}
