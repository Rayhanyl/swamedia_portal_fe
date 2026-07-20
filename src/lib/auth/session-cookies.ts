import { cookies } from "next/headers";

import {
  ACCESS_TOKEN_COOKIE,
  ID_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
} from "./constants";

// Tiga token WSO2 disimpan sebagai cookie httpOnly terpisah. `httpOnly` berarti
// JavaScript di browser tidak bisa membacanya sama sekali — mitigasi utama
// terhadap pencurian token lewat XSS. Hanya kode server Next.js (route handler
// login/logout & proxy) yang menyentuh nilai token ini.

const baseCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export async function setSessionCookies(tokens: {
  accessToken: string;
  refreshToken?: string;
  idToken?: string;
  expiresIn: number; // detik, dari LoginResponse.expiresIn
}) {
  const jar = await cookies();

  jar.set(ACCESS_TOKEN_COOKIE, tokens.accessToken, {
    ...baseCookieOptions,
    maxAge: tokens.expiresIn,
  });

  if (tokens.refreshToken) {
    // Refresh token berumur jauh lebih panjang dari access token di WSO2 IS.
    // maxAge di sini sengaja dilebihkan supaya proxy.ts yang menentukan kapan
    // token tidak valid (lewat respons 401 backend), bukan cookie expiry yang
    // menebak-nebak umur refresh token.
    jar.set(REFRESH_TOKEN_COOKIE, tokens.refreshToken, {
      ...baseCookieOptions,
      maxAge: 60 * 60 * 24 * 30,
    });
  }

  if (tokens.idToken) {
    jar.set(ID_TOKEN_COOKIE, tokens.idToken, {
      ...baseCookieOptions,
      maxAge: 60 * 60 * 24 * 30,
    });
  }
}

export async function getSessionCookies() {
  const jar = await cookies();
  return {
    accessToken: jar.get(ACCESS_TOKEN_COOKIE)?.value,
    refreshToken: jar.get(REFRESH_TOKEN_COOKIE)?.value,
    idToken: jar.get(ID_TOKEN_COOKIE)?.value,
  };
}

export async function clearSessionCookies() {
  const jar = await cookies();
  jar.delete(ACCESS_TOKEN_COOKIE);
  jar.delete(REFRESH_TOKEN_COOKIE);
  jar.delete(ID_TOKEN_COOKIE);
}
