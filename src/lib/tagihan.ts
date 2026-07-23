import { fetchBackend } from "@/lib/auth/fetch-backend";
import { getSessionCookies } from "@/lib/auth/session-cookies";
import type { ApiResponse } from "@/types/api";
import type { TagihanStatus } from "./tagihan-status";

// Bentuk item GET /api/v1/finance/tagihan — lihat
// documentation/note/api/06-finansial.md#modul-tagihan. `totalPencairan`
// dihitung backend (jumlah pencairan berstatus PARSIAL/FINAL), read-only.
//
// Catatan: modul ini TIDAK punya field `nilaiCair`/`tglCair` langsung —
// mockup desain "Tagihan/Invoice" menampilkan nilai/tanggal cair per baris,
// yang sebenarnya diturunkan dari sub-resource Pencairan (lib/pencairan.ts),
// bukan kolom flat di Tagihan.
export interface Tagihan {
  id: number;
  proyekId: number;
  proyekKode: string | null;
  proyekNama: string | null;
  tanggalTagihan: string;
  noTagihan: string;
  keterangan: string | null;
  statusAktif: TagihanStatus;
  nilaiTagihan: number;
  nilaiDpp: number | null;
  ppn: number | null;
  pph: number | null;
  totalPencairan: number;
}

export async function getTagihanByProyek(proyekId: number): Promise<Tagihan[]> {
  const { accessToken } = await getSessionCookies();
  if (!accessToken) return [];

  try {
    const res = await fetchBackend(
      `/api/v1/finance/tagihan?proyek_id=${proyekId}&limit=100`,
    );
    const body: ApiResponse<Tagihan[]> = await res.json();
    if (!res.ok || !body.success) return [];
    return body.data ?? [];
  } catch {
    return [];
  }
}

// Bentuk item GET /api/v1/finance/tagihan/{id}/status-history.
export interface TagihanStatusHistory {
  id: number;
  tagihanId: number;
  status: TagihanStatus;
  tanggal: string;
  keterangan: string | null;
  createdAt: string;
  createdBy: string;
}

export async function getTagihanStatusHistory(
  tagihanId: number,
): Promise<TagihanStatusHistory[]> {
  const { accessToken } = await getSessionCookies();
  if (!accessToken) return [];

  try {
    const res = await fetchBackend(
      `/api/v1/finance/tagihan/${tagihanId}/status-history`,
    );
    const body: ApiResponse<TagihanStatusHistory[]> = await res.json();
    if (!res.ok || !body.success) return [];
    return body.data ?? [];
  } catch {
    return [];
  }
}
