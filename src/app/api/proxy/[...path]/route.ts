import { NextRequest, NextResponse } from "next/server";

import {
  clearSessionCookies,
  getSessionCookies,
  setSessionCookies,
} from "@/lib/auth/session-cookies";
import { refreshAccessToken } from "@/lib/auth/refresh-token";
import { BACKEND_BASE_URL } from "@/lib/config";

// Titik tunggal yang menempelkan Authorization: Bearer <accessToken> ke setiap
// request bisnis menuju Ballerina backend, dan otomatis me-refresh sekali kalau
// backend membalas 401. Browser hanya pernah memanggil /api/proxy/... yang
// same-origin — token tidak pernah menyentuh JavaScript di browser.

async function forward(req: NextRequest, path: string[]) {
  const { accessToken, refreshToken } = await getSessionCookies();
  const targetUrl = `${BACKEND_BASE_URL}/api/v1/${path.join("/")}${req.nextUrl.search}`;
  const body =
    req.method === "GET" || req.method === "HEAD"
      ? undefined
      : await req.text();

  const doFetch = (token?: string) =>
    fetch(targetUrl, {
      method: req.method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body,
      cache: "no-store",
    });

  let res = await doFetch(accessToken);

  if (res.status === 401 && refreshToken) {
    const refreshed = await refreshAccessToken(refreshToken);
    if (!refreshed) {
      await clearSessionCookies();
      return NextResponse.json(
        { success: false, message: "Session expired" },
        { status: 401 },
      );
    }
    await setSessionCookies({
      accessToken: refreshed.accessToken,
      refreshToken: refreshed.refreshToken ?? refreshToken,
      idToken: refreshed.idToken,
      expiresIn: refreshed.expiresIn,
    });
    res = await doFetch(refreshed.accessToken);
  }

  const responseBody = await res.text();
  return new NextResponse(responseBody, {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
}

type Ctx = { params: Promise<{ path: string[] }> };

export async function GET(req: NextRequest, { params }: Ctx) {
  return forward(req, (await params).path);
}
export async function POST(req: NextRequest, { params }: Ctx) {
  return forward(req, (await params).path);
}
export async function PUT(req: NextRequest, { params }: Ctx) {
  return forward(req, (await params).path);
}
export async function PATCH(req: NextRequest, { params }: Ctx) {
  return forward(req, (await params).path);
}
export async function DELETE(req: NextRequest, { params }: Ctx) {
  return forward(req, (await params).path);
}
