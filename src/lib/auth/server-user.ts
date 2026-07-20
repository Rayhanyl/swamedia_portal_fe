import type { ApiResponse } from "@/types/api";
import type { AuthUser } from "@/types/auth";

import { fetchBackend } from "./fetch-backend";
import { getSessionCookies } from "./session-cookies";

// Dipanggil dari Server Component (root layout) untuk re-hydrate klaim user
// setelah refresh halaman. Panggilan server-to-server langsung ke backend
// lewat fetchBackend (retry-on-401 + refresh, meniru proxy.ts) karena kita
// sudah di server. Best-effort: kegagalan backend mengembalikan null, bukan
// melempar error.
export async function getServerUser(): Promise<AuthUser | null> {
  const { accessToken } = await getSessionCookies();
  if (!accessToken) return null;

  try {
    const res = await fetchBackend("/api/v1/auth/userinfo");
    const body: ApiResponse<AuthUser> = await res.json();
    if (!res.ok || !body.success) return null;
    return body.data ?? null;
  } catch {
    return null;
  }
}
