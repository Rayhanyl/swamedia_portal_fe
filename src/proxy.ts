import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { ACCESS_TOKEN_COOKIE } from "@/lib/auth/constants";

// Next.js 16 "Proxy" (pengganti middleware.ts). Ini HANYA optimisasi UX
// navigasi: cek keberadaan cookie sesi dan redirect ke /login sebelum halaman
// terproteksi di-render. Validitas token yang sesungguhnya tetap diverifikasi
// backend lewat JWKS setiap kali BFF proxy (/api/proxy/...) meneruskan request;
// attach-token & auto-refresh ada di app/api/proxy/[...path]/route.ts, bukan di
// sini. Runtime edge tidak menyimpan/menyentuh nilai token.
export function proxy(request: NextRequest) {
  const hasSession = request.cookies.has(ACCESS_TOKEN_COOKIE);

  if (!hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Jalankan di semua path KECUALI: route API (proxy/login/logout punya
  // penanganan sendiri), aset internal Next.js, favicon, halaman /login, dan
  // file statis apa pun (mengandung titik, mis. .svg/.png/.ico).
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|login|.*\\..*).*)"],
};
