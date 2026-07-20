import { NextResponse } from "next/server";

import {
  clearSessionCookies,
  getSessionCookies,
} from "@/lib/auth/session-cookies";
import { BACKEND_BASE_URL } from "@/lib/config";

export async function POST() {
  const { idToken, accessToken } = await getSessionCookies();

  if (idToken) {
    // Best-effort: kalaupun WSO2 IS tidak terjangkau, tetap lanjut hapus cookie
    // lokal supaya user tidak "terjebak login" di browser-nya sendiri.
    // Sertakan accessToken (opsional di LogoutRequest) supaya backend juga
    // menambahkannya ke denylist lokal, bukan cuma mengakhiri sesi di WSO2 IS.
    await fetch(`${BACKEND_BASE_URL}/api/v1/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken, accessToken }),
    }).catch(() => {});
  }

  await clearSessionCookies();
  return NextResponse.json({ success: true });
}
