import type { ApiResponse } from "@/types/api";
import type { AuthUser } from "@/types/auth";

import { getJwtPayload } from "./decode-jwt";
import { fetchBackend } from "./fetch-backend";
import { getSessionCookies } from "./session-cookies";

// Dipanggil dari Server Component (root layout) untuk re-hydrate klaim user
// setelah refresh halaman. Panggilan server-to-server langsung ke backend
// lewat fetchBackend (retry-on-401 + refresh, meniru proxy.ts) karena kita
// sudah di server. Best-effort: kegagalan backend mengembalikan null, bukan
// melempar error.
export async function getServerUser(): Promise<AuthUser | null> {
  const { accessToken, idToken, roleName } = await getSessionCookies();
  if (!accessToken) return null;

  // `/auth/userinfo` cuma meneruskan claim OIDC bawaan IS (sub/email/name/
  // swaportal_role_id). idToken (didekode lokal, tanpa verifikasi signature —
  // bukan gerbang keamanan, cuma sumber tampilan) melengkapi claim IS lain
  // yang tidak ikut di situ (given_name/family_name/username/dst).
  const idTokenClaims = idToken ? getJwtPayload<AuthUser>(idToken) : null;
  // `swaportal_role_name` dititipkan BE saat login/refresh, bukan claim IS —
  // tidak ada baik di idToken maupun /userinfo, jadi sumbernya cookie
  // terpisah (lihat setSessionCookies & proxy.ts).
  const roleNameClaim = roleName ? { swaportal_role_name: roleName } : null;

  let userinfoData: AuthUser | null = null;
  try {
    const res = await fetchBackend("/api/v1/auth/userinfo");
    const body: ApiResponse<AuthUser> = await res.json();
    if (res.ok && body.success) userinfoData = body.data ?? null;
  } catch {
    // best-effort — tetap lanjut dengan idToken/roleName yang sudah ada
  }

  if (!idTokenClaims && !userinfoData && !roleNameClaim) return null;
  return { ...idTokenClaims, ...userinfoData, ...roleNameClaim };
}
