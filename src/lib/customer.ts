import { fetchBackend } from "@/lib/auth/fetch-backend";
import { getSessionCookies } from "@/lib/auth/session-cookies";
import type { ApiResponse, Pagination } from "@/types/api";
import type { JenisCustomer, StatusPeluang } from "./customer-status";

// Bentuk item GET /api/v1/master/customers — lihat
// documentation/note/api/03-master-data.md#modul-customer.
export type { JenisCustomer, StatusPeluang };

export interface Customer {
  id: number;
  nama: string;
  amId: number | null;
  industriId: number | null;
  statusPeluang: StatusPeluang;
  jenisCustomer: JenisCustomer;
}

// Tidak ada endpoint /dropdown khusus untuk Customer — pakai list
// berpaginasi dengan limit besar, sama seperti pola master kecil lainnya.
// Best-effort: kegagalan mengembalikan array kosong.
export async function getCustomerList(): Promise<Customer[]> {
  const { accessToken } = await getSessionCookies();
  if (!accessToken) return [];

  try {
    const res = await fetchBackend("/api/v1/master/customers?limit=100");
    const body: ApiResponse<Customer[]> = await res.json();
    if (!res.ok || !body.success) return [];
    return body.data ?? [];
  } catch {
    return [];
  }
}

export interface CustomerFilter {
  search?: string;
  amId?: number;
  industriId?: number;
  statusPeluang?: StatusPeluang;
  jenisCustomer?: JenisCustomer;
  page?: number;
  limit?: number;
}

export interface CustomerPage {
  items: Customer[];
  pagination: Pagination | null;
}

function buildCustomerQuery(filter: CustomerFilter): string {
  const params = new URLSearchParams();
  if (filter.search) params.set("search", filter.search);
  if (filter.amId) params.set("am_id", String(filter.amId));
  if (filter.industriId) params.set("industri_id", String(filter.industriId));
  if (filter.statusPeluang) params.set("status_peluang", filter.statusPeluang);
  if (filter.jenisCustomer) params.set("jenis_customer", filter.jenisCustomer);
  params.set("page", String(filter.page ?? 1));
  params.set("limit", String(filter.limit ?? 20));
  return params.toString();
}

// Server-to-server, dipanggil dari Server Component (halaman Customer)
// untuk initial render. Best-effort: kegagalan mengembalikan halaman kosong.
export async function getCustomerPage(
  filter: CustomerFilter = {},
): Promise<CustomerPage> {
  const { accessToken } = await getSessionCookies();
  if (!accessToken) return { items: [], pagination: null };

  try {
    const res = await fetchBackend(
      `/api/v1/master/customers?${buildCustomerQuery(filter)}`,
    );
    const body: ApiResponse<Customer[]> = await res.json();
    if (!res.ok || !body.success) return { items: [], pagination: null };
    return { items: body.data ?? [], pagination: body.meta.pagination ?? null };
  } catch {
    return { items: [], pagination: null };
  }
}
