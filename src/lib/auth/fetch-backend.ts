import { BACKEND_BASE_URL } from "@/lib/config";
import { getSessionCookies } from "@/lib/auth/session-cookies";

// Untuk Server Component yang memanggil backend LANGSUNG, server-to-server
// (tidak lewat proxy.ts/[...path]/route.ts, karena kita sudah di server).
// Tidak ada retry-refresh di sini dengan sengaja: proxy.ts (src/proxy.ts,
// Next Proxy — jalan SEBELUM Server Component render) sudah memastikan
// access token di cookie fresh sebelum request ini sampai sini. Server
// Component tidak bisa menulis cookie sendiri (cookies().set() selalu throw
// di luar Server Action/Route Handler), jadi mencoba refresh+retry di sini
// hanya akan membakar refresh token tanpa bisa menyimpan hasilnya.
export async function fetchBackend(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const { accessToken } = await getSessionCookies();

  return fetch(`${BACKEND_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...init?.headers,
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    cache: "no-store",
  });
}
