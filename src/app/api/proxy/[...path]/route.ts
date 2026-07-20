import { NextRequest, NextResponse } from "next/server";

import {
  clearSessionCookies,
  getSessionCookies,
  setSessionCookies,
} from "@/lib/auth/session-cookies";
import { BACKEND_BASE_URL } from "@/lib/config";
import type { ApiResponse } from "@/types/api";
import type { LoginResponse } from "@/types/auth";

// Titik tunggal yang menempelkan Authorization: Bearer <accessToken> ke setiap
// request bisnis menuju Ballerina backend, dan otomatis me-refresh sekali kalau
// backend membalas 401. Browser hanya pernah memanggil /api/proxy/... yang
// same-origin — token tidak pernah menyentuh JavaScript di browser.

async function refreshAccessToken(refreshToken: string) {
  const res = await fetch(`${BACKEND_BASE_URL}/api/v1/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });
  const body: ApiResponse<LoginResponse> = await res.json();
  if (!res.ok || !body.success || !body.data) return null;
  return body.data;
}

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
        { status: 401 }
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
