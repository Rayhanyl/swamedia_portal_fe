import { fetchBackend } from "@/lib/auth/fetch-backend";
import { getSessionCookies } from "@/lib/auth/session-cookies";
import type { ApiResponse } from "@/types/api";

// Bentuk `data` GET/PUT /api/v1/akun-saya — identitas WSO2 IS pemanggil.
// Lihat documentation/note/api/02-dashboard-dan-self-service.md#modul-akun-saya.
export interface AkunSaya {
  subjectId: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  telepon: string | null;
  organization: string | null;
  country: string | null;
  roleId: number | null;
  groupId: string | null;
}

// Dipanggil dari Server Component (halaman Profil Saya) untuk mengisi form.
// Server-to-server lewat fetchBackend, sama seperti getMenuSaya/getServerUser.
// Best-effort: kegagalan mengembalikan null, bukan melempar error.
export async function getAkunSaya(): Promise<AkunSaya | null> {
  console.log("getAkunSaya() dipanggil"); 
  const { accessToken } = await getSessionCookies();
  if (!accessToken) return null;

  try {
    const res = await fetchBackend("/api/v1/akun-saya");
    const body: ApiResponse<AkunSaya> = await res.json();
    if (!res.ok || !body.success) return null;
    return body.data ?? null;
  } catch {
    return null;
  }
}
