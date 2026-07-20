// Baca klaim `exp` dari JWT TANPA verifikasi signature — cukup untuk
// keputusan "perlu refresh proaktif atau tidak" di proxy.ts. Validitas
// sesungguhnya (signature/issuer/audience) tetap diverifikasi backend lewat
// JWKS di setiap request bisnis; ini murni optimisasi UX, bukan gerbang
// keamanan.
export function getJwtExpiry(token: string): number | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const json = Buffer.from(payload, "base64url").toString("utf-8");
    const parsed = JSON.parse(json) as { exp?: unknown };
    return typeof parsed.exp === "number" ? parsed.exp : null;
  } catch {
    return null;
  }
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
