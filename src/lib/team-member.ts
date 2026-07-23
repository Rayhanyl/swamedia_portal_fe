import { fetchBackend } from "@/lib/auth/fetch-backend";
import { getSessionCookies } from "@/lib/auth/session-cookies";
import type { ApiResponse } from "@/types/api";

// Bentuk item GET .../proyek/{proyekId}/team-member — lihat
// documentation/note/api/05-sales-unit.md#sub-resource-team-member.
// `roleId` merujuk ke `project_role_master` (peran proyek), BUKAN role RBAC
// — sampai saat ini tidak ada endpoint master terdokumentasi untuk daftar
// peran proyek ini, jadi field `roleId` di form diisi manual sebagai angka.
//
// `undanganStatus`/`undanganSentAt`/`undanganSentBy` dikendalikan backend
// sepenuhnya — tidak pernah dikirim dari CRUD payload, hanya ditampilkan.
// Diisi oleh POST .../team-member/undangan (lihat `sendTeamMemberUndangan`
// di bawah), yang men-skip anggota yang statusnya sudah TERKIRIM.
export type UndanganStatus = "BELUM_DIKIRIM" | "TERKIRIM" | "GAGAL";

export interface TeamMember {
  id: number;
  proyekId: number;
  karyawanId: number;
  karyawanNama: string | null;
  roleId: number;
  roleNama: string | null;
  tglMulai: string | null;
  tglSelesai: string | null;
  bobot: number | null;
  keterangan: string | null;
  undanganStatus: UndanganStatus;
  undanganSentAt: string | null;
  undanganSentBy: string | null;
  createdAt: string;
  updatedAt: string | null;
  createdBy: string;
  updatedBy: string | null;
}

// Bentuk response POST .../proyek/{proyekId}/team-member/undangan. Anggota yang undanganStatus-nya
// sudah TERKIRIM di-skip backend (tidak muncul di `items`, tidak dihitung di total) — aman dipanggil
// ulang setelah menambah anggota baru, tidak akan mengirim ulang ke yang sudah menerima.
export interface TeamMemberUndanganItem {
  id: number;
  karyawanNama: string;
  status: "TERKIRIM" | "GAGAL";
  errorMessage: string | null;
}

export interface TeamMemberUndanganResult {
  totalTargeted: number;
  totalSent: number;
  totalFailed: number;
  items: TeamMemberUndanganItem[];
}

export async function getTeamMemberList(
  proyekId: number,
): Promise<TeamMember[]> {
  const { accessToken } = await getSessionCookies();
  if (!accessToken) return [];

  try {
    const res = await fetchBackend(
      `/api/v1/business/proyek/${proyekId}/team-member`,
    );
    const body: ApiResponse<TeamMember[]> = await res.json();
    if (!res.ok || !body.success) return [];
    return body.data ?? [];
  } catch {
    return [];
  }
}
