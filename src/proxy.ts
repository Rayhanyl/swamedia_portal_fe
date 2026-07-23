import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import {
  ACCESS_TOKEN_COOKIE,
  ID_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  ROLE_NAME_COOKIE,
  SESSION_COOKIE_OPTIONS,
} from "@/lib/auth/constants";
import { isJwtExpiringSoon } from "@/lib/auth/decode-jwt";
import { refreshAccessToken } from "@/lib/auth/refresh-token";
import type { LoginResponse } from "@/types/auth";

// Next.js 16 "Proxy" (pengganti middleware.ts), default runtime Node.js.
// Ini satu-satunya tempat yang jalan SEBELUM halaman di-render dan BISA
// menulis cookie ke response (Server Component tidak bisa — cookies().set()
// di sana selalu throw ReadonlyRequestCookiesError). Karena itu proaktif
// me-refresh access token yang mau kedaluwarsa harus terjadi di sini, bukan
// di dalam getServerUser()/getMenuSaya(): begitu Server Component jalan,
// cookie di request SUDAH pasti fresh, jadi mereka tidak perlu (dan tidak
// bisa) mencoba refresh sendiri lagi.
//
// exp dibaca lokal dari JWT (tanpa verifikasi signature) murni untuk
// keputusan "perlu refresh atau tidak" — validitas sesungguhnya tetap
// diverifikasi backend lewat JWKS di setiap request bisnis via
// app/api/proxy/[...path]/route.ts.
function redirectToLogin(request: NextRequest, clearCookies: boolean) {
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("from", request.nextUrl.pathname);
  const response = NextResponse.redirect(loginUrl);

  if (clearCookies) {
    response.cookies.delete(ACCESS_TOKEN_COOKIE);
    response.cookies.delete(REFRESH_TOKEN_COOKIE);
    response.cookies.delete(ID_TOKEN_COOKIE);
    response.cookies.delete(ROLE_NAME_COOKIE);
  }

  return response;
}

function applySessionCookies(
  response: NextResponse,
  tokens: LoginResponse,
  fallbackRefreshToken: string,
) {
  response.cookies.set(ACCESS_TOKEN_COOKIE, tokens.accessToken, {
    ...SESSION_COOKIE_OPTIONS,
    maxAge: tokens.expiresIn,
  });
  response.cookies.set(
    REFRESH_TOKEN_COOKIE,
    tokens.refreshToken ?? fallbackRefreshToken,
    SESSION_COOKIE_OPTIONS,
  );
  if (tokens.idToken) {
    response.cookies.set(ID_TOKEN_COOKIE, tokens.idToken, SESSION_COOKIE_OPTIONS);
  }

  // Lihat komentar ROLE_NAME_COOKIE di constants.ts — dititipkan BE, bukan
  // claim idToken, jadi harus ditulis ulang di sini juga saat refresh.
  const roleName = tokens.user?.swaportal_role_name;
  if (typeof roleName === "string" && roleName.length > 0) {
    response.cookies.set(ROLE_NAME_COOKIE, roleName, SESSION_COOKIE_OPTIONS);
  }
}

export async function proxy(request: NextRequest) {
  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;

  const needsRefresh = !accessToken || isJwtExpiringSoon(accessToken);
  if (!needsRefresh) {
    return NextResponse.next();
  }

  if (!refreshToken) {
    return redirectToLogin(request, Boolean(accessToken));
  }

  const refreshed = await refreshAccessToken(refreshToken);
  if (!refreshed) {
    return redirectToLogin(request, true);
  }

  const response = NextResponse.next();
  applySessionCookies(response, refreshed, refreshToken);
  return response;
}

export const config = {
  // Jalankan di semua path KECUALI: route API (proxy/login/logout punya
  // penanganan sendiri), aset internal Next.js, favicon, halaman /login, dan
  // file statis apa pun (mengandung titik, mis. .svg/.png/.ico).
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|login|.*\\..*).*)"],
};
