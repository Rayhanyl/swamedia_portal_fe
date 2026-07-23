import { fetchBackend } from "@/lib/auth/fetch-backend";
import { getSessionCookies } from "@/lib/auth/session-cookies";
import type { ApiResponse, Pagination } from "@/types/api";
import type { ProyekStatus } from "./proyek-status";

// Proyeksi ringan dari GET /api/v1/business/proyek/dropdown — lihat
// documentation/note/api/05-sales-unit.md#get-apiv1businessproyekdropdown.
// Dipakai sebagai opsi field "Tujuan/Proyek" di form Tambah/Edit Surat.
export interface ProyekDropdownItem {
  id: number;
  kodeProyek: string;
  namaProyek: string;
}

export async function getProyekDropdown(): Promise<ProyekDropdownItem[]> {
  const { accessToken } = await getSessionCookies();
  if (!accessToken) return [];

  try {
    const res = await fetchBackend("/api/v1/business/proyek/dropdown");
    const body: ApiResponse<ProyekDropdownItem[]> = await res.json();
    if (!res.ok || !body.success) return [];
    return body.data ?? [];
  } catch {
    return [];
  }
}

// Bentuk item GET /api/v1/business/proyek/units — daftar tetap unit yang
// BERHAK memiliki proyek (Service Delivery, Strategic Enablement, Billing
// System Solutions, Digital Ecosystem Solutions, Product Operational
// Support — kode_unit IN ('SD','SE','BILL','DES','POS') di backend).
// Endpoint ini KHUSUS untuk field "Unit Organisasi" di form Tambah Proyek —
// beda dari getUnitList() yang mengembalikan SEMUA unit master (termasuk
// unit struktural/induk seperti "Direktur Utama" yang akan ditolak backend
// dengan 400 VALIDATION_ERROR bila dipilih). Lihat
// documentation/note/api/05-sales-unit.md#get-apiv1businessproyekunits.
export interface ProyekEligibleUnit {
  id: number;
  namaUnit: string;
  kodeUnit: string;
}

export async function getProyekEligibleUnits(): Promise<ProyekEligibleUnit[]> {
  const { accessToken } = await getSessionCookies();
  if (!accessToken) return [];

  try {
    const res = await fetchBackend("/api/v1/business/proyek/units");
    const body: ApiResponse<ProyekEligibleUnit[]> = await res.json();
    if (!res.ok || !body.success) return [];
    return body.data ?? [];
  } catch {
    return [];
  }
}

// Bentuk item GET /api/v1/business/proyek — lihat
// documentation/note/api/05-sales-unit.md. `kodeProyek`/`nilaiBersih`/
// `tanggalDeal` di-generate/dihitung backend, read-only. `unitId`/`tahun`
// immutable setelah dibuat (ikut menyusun `kodeProyek`).
export interface Proyek {
  id: number;
  kodeProyek: string;
  customerId: number;
  customerNama: string | null;
  industriId: number;
  industriNama: string | null;
  unitId: number;
  unitNama: string | null;
  kontrakPayungId: number | null;
  noKontrakPayung: string | null;
  kontrakBiasaId: number | null;
  noKontrakBiasa: string | null;
  namaProyek: string;
  departemen: string | null;
  nilaiProyek: number;
  subkon: number;
  nilaiBersih: number;
  picSalesId: number;
  picSalesNama: string | null;
  pmoId: number | null;
  pmoNama: string | null;
  noKontrak: string | null;
  tanggalKontrak: string | null;
  tanggalBast: string | null;
  tanggalMulai: string | null;
  tanggalDeal: string | null;
  targetSelesai: string | null;
  keteranganPembayaran: string | null;
  status: ProyekStatus;
  tahun: number;
}

export interface ProyekFilter {
  search?: string;
  tahun?: number;
  unitId?: number;
  status?: ProyekStatus;
  page?: number;
  limit?: number;
}

export interface ProyekPage {
  items: Proyek[];
  pagination: Pagination | null;
}

function buildProyekQuery(filter: ProyekFilter): string {
  const params = new URLSearchParams();
  if (filter.search) params.set("search", filter.search);
  if (filter.tahun) params.set("tahun", String(filter.tahun));
  if (filter.unitId) params.set("unit_id", String(filter.unitId));
  if (filter.status) params.set("status", filter.status);
  params.set("page", String(filter.page ?? 1));
  // Tabel Daftar Sales Unit mengelompokkan semua proyek per unit dalam satu
  // tampilan tanpa kontrol paginasi (mengikuti desain) — limit besar dipakai
  // supaya satu tahun penuh biasanya tertampung dalam satu request.
  params.set("limit", String(filter.limit ?? 100));
  return params.toString();
}

// Server-to-server, dipanggil dari Server Component (halaman Sales Unit)
// untuk initial render. Best-effort: kegagalan mengembalikan halaman kosong.
export async function getProyekList(
  filter: ProyekFilter = {},
): Promise<ProyekPage> {
  const { accessToken } = await getSessionCookies();
  if (!accessToken) return { items: [], pagination: null };

  try {
    const res = await fetchBackend(
      `/api/v1/business/proyek?${buildProyekQuery(filter)}`,
    );
    const body: ApiResponse<Proyek[]> = await res.json();
    if (!res.ok || !body.success) return { items: [], pagination: null };
    return { items: body.data ?? [], pagination: body.meta.pagination ?? null };
  } catch {
    return { items: [], pagination: null };
  }
}

// Bentuk GET /api/v1/business/proyek/{id} — sama dengan item list, ditambah
// field audit (hanya ada di response detail).
export interface ProyekDetail extends Proyek {
  createdAt: string;
  updatedAt: string | null;
  createdBy: string;
  updatedBy: string | null;
}

export async function getProyekDetail(
  id: number,
): Promise<ProyekDetail | null> {
  const { accessToken } = await getSessionCookies();
  if (!accessToken) return null;

  try {
    const res = await fetchBackend(`/api/v1/business/proyek/${id}`);
    const body: ApiResponse<ProyekDetail> = await res.json();
    if (!res.ok || !body.success) return null;
    return body.data ?? null;
  } catch {
    return null;
  }
}
