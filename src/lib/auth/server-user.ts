import { BACKEND_BASE_URL } from "@/lib/config";
import type { ApiResponse } from "@/types/api";
import type { AuthUser } from "@/types/auth";

import { getSessionCookies } from "./session-cookies";

// Dipanggil dari Server Component (root layout) untuk re-hydrate klaim user
// setelah refresh halaman. Ini panggilan server-to-server langsung ke backend
// (tidak lewat proxy.ts, karena kita sudah di server). Best-effort: kegagalan
// backend mengembalikan null, bukan melempar error.
export async function getServerUser(): Promise<AuthUser | null> {
  const { accessToken } = await getSessionCookies();
  if (!accessToken) return null;

  try {
    const res = await fetch(`${BACKEND_BASE_URL}/api/v1/auth/userinfo`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    const body: ApiResponse<AuthUser> = await res.json();
    if (!res.ok || !body.success) return null;
    return body.data ?? null;
  } catch {
    return null;
  }
}
