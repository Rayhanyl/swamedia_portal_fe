// Baca payload JWT TANPA verifikasi signature — cukup untuk kebutuhan UX
// non-keamanan (cek `exp`, tampilkan klaim profil). Validitas sesungguhnya
// (signature/issuer/audience) tetap diverifikasi backend lewat JWKS di
// setiap request bisnis; ini bukan gerbang keamanan.
export function getJwtPayload<T = Record<string, unknown>>(
  token: string,
): T | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const json = Buffer.from(payload, "base64url").toString("utf-8");
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

export function getJwtExpiry(token: string): number | null {
  const parsed = getJwtPayload<{ exp?: unknown }>(token);
  return typeof parsed?.exp === "number" ? parsed.exp : null;
}

// true kalau token sudah lewat exp atau akan lewat dalam `bufferSeconds`
// berikutnya (default 60 detik) — supaya refresh terjadi sebelum request
// berikutnya benar-benar kena 401, bukan sesudahnya.
export function isJwtExpiringSoon(token: string, bufferSeconds = 60): boolean {
  const exp = getJwtExpiry(token);
  if (exp === null) return true;
  const nowSeconds = Date.now() / 1000;
  return exp - nowSeconds <= bufferSeconds;
}
