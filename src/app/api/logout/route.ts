import { NextResponse } from "next/server";

import {
  clearSessionCookies,
  getSessionCookies,
} from "@/lib/auth/session-cookies";
import { BACKEND_BASE_URL } from "@/lib/config";

export async function POST() {
  const { idToken } = await getSessionCookies();

  if (idToken) {
    // Best-effort: kalaupun WSO2 IS tidak terjangkau, tetap lanjut hapus cookie
    // lokal supaya user tidak "terjebak login" di browser-nya sendiri.
    await fetch(`${BACKEND_BASE_URL}/api/v1/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    }).catch(() => {});
  }

  await clearSessionCookies();
  return NextResponse.json({ success: true });
}
