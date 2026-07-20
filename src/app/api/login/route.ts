import { NextRequest, NextResponse } from "next/server";

import { setSessionCookies } from "@/lib/auth/session-cookies";
import { BACKEND_BASE_URL } from "@/lib/config";
import type { ApiResponse } from "@/types/api";
import type { LoginResponse } from "@/types/auth";

// Satu-satunya tempat browser mengirim username/password, dan satu-satunya
// tempat cookie sesi di-set. Token mentah tidak pernah dikirim balik ke browser.
export async function POST(req: NextRequest) {
  let username: string;
  let password: string;
  try {
    ({ username, password } = await req.json());
  } catch {
    return NextResponse.json({ message: "Body tidak valid" }, { status: 400 });
  }

  if (!username || !password) {
    return NextResponse.json(
      { message: "Username dan password wajib diisi" },
      { status: 400 }
    );
  }

  let res: Response;
  try {
    res = await fetch(`${BACKEND_BASE_URL}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
  } catch {
    return NextResponse.json(
      { message: "Tidak dapat menghubungi server autentikasi" },
      { status: 502 }
    );
  }

  const body: ApiResponse<LoginResponse> = await res.json();

  if (!res.ok || !body.success || !body.data) {
    return NextResponse.json(
      { message: body.errors?.message ?? body.message },
      { status: res.status || 401 }
    );
  }

  await setSessionCookies(body.data);

  // Browser hanya menerima data user, TIDAK PERNAH token mentah.
  return NextResponse.json({ user: body.data.user });
}
