import { BACKEND_BASE_URL } from "@/lib/config";
import type { ApiResponse } from "@/types/api";
import type { LoginResponse } from "@/types/auth";

// Dipakai oleh proxy.ts dan fetch-backend.ts (dua-duanya butuh menukar
// refreshToken jadi accessToken baru saat backend membalas 401) supaya
// logikanya satu tempat — dua salinan yang berbeda persis inilah yang
// menyebabkan proxy.ts punya retry-on-401 sementara pemanggilan langsung
// (getServerUser/getMenuSaya) tidak.
export async function refreshAccessToken(
  refreshToken: string,
): Promise<LoginResponse | null> {
  const res = await fetch(`${BACKEND_BASE_URL}/api/v1/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });
  const body: ApiResponse<LoginResponse> = await res.json();
  if (!res.ok || !body.success || !body.data) return null;
  return body.data;
}
