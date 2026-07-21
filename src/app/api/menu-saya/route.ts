import { NextResponse } from "next/server";

import { fetchBackend } from "@/lib/auth/fetch-backend";
import { getSessionCookies } from "@/lib/auth/session-cookies";
import type { ApiResponse } from "@/types/api";
import type { MenuItem } from "@/types/menu";

// Dipanggil AppSidebar (client) kalau render awal dashboard dapat menu
// kosong — lihat komentar di lib/menu.ts soal token baru yang sesaat belum
// dikenali backend. Retry di sini jalan SERVER-TO-SERVER (bukan lewat fetch
// di browser) supaya dari sisi client cuma terlihat SATU request yang
// selesai setelah berhasil/menyerah, bukan beberapa request 401 yang
// masing-masing otomatis dicatat DevTools sebagai error (itu logging bawaan
// browser untuk fetch berstatus error, tidak bisa dimatikan dari kode
// aplikasi manapun — satu-satunya cara menghindarinya adalah tidak membuat
// browser melihat request yang gagal itu sama sekali).
const RETRY_DELAYS_MS = [500, 1000, 2000, 4000];

export async function GET() {
  const { accessToken } = await getSessionCookies();
  if (!accessToken) {
    return NextResponse.json(
      { success: false, message: "Unauthorized", errors: null } as ApiResponse<
        MenuItem[]
      >,
      { status: 401 },
    );
  }

  let lastResponse: { status: number; body: ApiResponse<MenuItem[]> } | null =
    null;

  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    if (attempt > 0) {
      await new Promise((resolve) =>
        setTimeout(resolve, RETRY_DELAYS_MS[attempt - 1]),
      );
    }

    try {
      const res = await fetchBackend("/api/v1/menu-saya");
      const body: ApiResponse<MenuItem[]> = await res.json();
      lastResponse = { status: res.status, body };
      if (res.ok && body.success && (body.data ?? []).length > 0) {
        return NextResponse.json(body, { status: res.status });
      }
    } catch {
      // coba lagi di iterasi berikutnya
    }
  }

  if (lastResponse) {
    return NextResponse.json(lastResponse.body, {
      status: lastResponse.status,
    });
  }
  return NextResponse.json(
    {
      success: false,
      message: "Tidak dapat menghubungi server",
      errors: null,
    } as ApiResponse<MenuItem[]>,
    { status: 502 },
  );
}
