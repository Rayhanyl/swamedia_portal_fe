import { fetchBackend } from "@/lib/auth/fetch-backend";
import { getSessionCookies } from "@/lib/auth/session-cookies";
import type { ApiResponse } from "@/types/api";
import type { MenuItem } from "@/types/menu";

// Dipanggil dari layout dashboard (Server Component) untuk merender sidebar.
// Server-to-server langsung ke backend lewat fetchBackend (retry-on-401 +
// refresh, meniru proxy.ts) karena kita sudah di server. Best-effort, satu
// kali percobaan saja — kegagalan mengembalikan array kosong, bukan
// melempar error, supaya layout tetap bisa dirender segera.
//
// Sesaat setelah login, token yang baru diterbitkan kadang belum dikenali
// backend (401/403) selama beberapa detik, lalu pulih sendiri. Daripada
// blocking render dashboard dengan retry panjang di sini, AppSidebar
// (client) yang menangani retry-di-background kalau array ini kosong —
// lihat komentar di app-sidebar.tsx.
export async function getMenuSaya(): Promise<MenuItem[]> {
  const { accessToken } = await getSessionCookies();
  if (!accessToken) return [];

  try {
    const res = await fetchBackend("/api/v1/menu-saya");
    const body: ApiResponse<MenuItem[]> = await res.json();
    if (!res.ok || !body.success) {
      console.warn("[getMenuSaya] backend menolak:", res.status, body);
      return [];
    }
    return body.data ?? [];
  } catch (err) {
    console.warn("[getMenuSaya] fetch gagal:", err);
    return [];
  }
}
