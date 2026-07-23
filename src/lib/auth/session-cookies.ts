import { cookies } from "next/headers";

import type { LoginResponse } from "@/types/auth";

import {
  ACCESS_TOKEN_COOKIE,
  ID_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  ROLE_NAME_COOKIE,
  SESSION_COOKIE_OPTIONS,
} from "./constants";

// Tiga token WSO2 disimpan sebagai cookie httpOnly terpisah. `httpOnly` berarti
// JavaScript di browser tidak bisa membacanya sama sekali — mitigasi utama
// terhadap pencurian token lewat XSS. Hanya kode server Next.js (route handler
// login/logout & proxy) yang menyentuh nilai token ini.

export async function setSessionCookies(tokens: LoginResponse) {
  const jar = await cookies();

  jar.set(ACCESS_TOKEN_COOKIE, tokens.accessToken, {
    ...SESSION_COOKIE_OPTIONS,
    maxAge: tokens.expiresIn,
  });

  if (tokens.refreshToken) {
    jar.set(REFRESH_TOKEN_COOKIE, tokens.refreshToken, SESSION_COOKIE_OPTIONS);
  }

  if (tokens.idToken) {
    jar.set(ID_TOKEN_COOKIE, tokens.idToken, SESSION_COOKIE_OPTIONS);
  }

  // Lihat komentar ROLE_NAME_COOKIE di constants.ts — field ini titipan BE,
  // bukan claim idToken, jadi disimpan terpisah setiap kali login/refresh.
  const roleName = tokens.user?.swaportal_role_name;
  if (typeof roleName === "string" && roleName.length > 0) {
    jar.set(ROLE_NAME_COOKIE, roleName, SESSION_COOKIE_OPTIONS);
  }
}

export async function getSessionCookies() {
  const jar = await cookies();
  return {
    accessToken: jar.get(ACCESS_TOKEN_COOKIE)?.value,
    refreshToken: jar.get(REFRESH_TOKEN_COOKIE)?.value,
    idToken: jar.get(ID_TOKEN_COOKIE)?.value,
    roleName: jar.get(ROLE_NAME_COOKIE)?.value,
  };
}

export async function clearSessionCookies() {
  const jar = await cookies();
  jar.delete(ACCESS_TOKEN_COOKIE);
  jar.delete(REFRESH_TOKEN_COOKIE);
  jar.delete(ID_TOKEN_COOKIE);
  jar.delete(ROLE_NAME_COOKIE);
}
