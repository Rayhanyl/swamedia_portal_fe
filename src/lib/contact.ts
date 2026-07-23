import { fetchBackend } from "@/lib/auth/fetch-backend";
import { getSessionCookies } from "@/lib/auth/session-cookies";
import type { ApiResponse, Pagination } from "@/types/api";
import type { TipeKontak } from "./contact-status";

// Bentuk item GET /api/v1/master/contacts — lihat
// documentation/note/api/03-master-data.md#modul-contact.
export type { TipeKontak };

export interface Contact {
  id: number;
  customerId: number;
  nama: string;
  jabatan: string | null;
  email: string | null;
  telepon: string | null;
  tipeKontak: TipeKontak;
}

export interface ContactFilter {
  customerId?: number;
  search?: string;
  tipeKontak?: TipeKontak;
  page?: number;
  limit?: number;
}

export interface ContactPage {
  items: Contact[];
  pagination: Pagination | null;
}

function buildContactQuery(filter: ContactFilter): string {
  const params = new URLSearchParams();
  if (filter.customerId) params.set("customer_id", String(filter.customerId));
  if (filter.search) params.set("search", filter.search);
  if (filter.tipeKontak) params.set("tipe_kontak", filter.tipeKontak);
  params.set("page", String(filter.page ?? 1));
  params.set("limit", String(filter.limit ?? 20));
  return params.toString();
}

// Server-to-server, dipanggil dari Server Component (halaman Contact)
// untuk initial render. Best-effort: kegagalan mengembalikan halaman kosong.
export async function getContactPage(
  filter: ContactFilter = {},
): Promise<ContactPage> {
  const { accessToken } = await getSessionCookies();
  if (!accessToken) return { items: [], pagination: null };

  try {
    const res = await fetchBackend(
      `/api/v1/master/contacts?${buildContactQuery(filter)}`,
    );
    const body: ApiResponse<Contact[]> = await res.json();
    if (!res.ok || !body.success) return { items: [], pagination: null };
    return { items: body.data ?? [], pagination: body.meta.pagination ?? null };
  } catch {
    return { items: [], pagination: null };
  }
}
