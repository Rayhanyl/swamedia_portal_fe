// Nama & opsi cookie sesi. Dipisah ke modul sendiri (tanpa dependensi
// `next/headers`) supaya bisa diimpor baik dari Route Handler/Server
// Component (session-cookies.ts) maupun dari `proxy.ts`, yang menulis cookie
// lewat NextResponse.cookies (API berbeda, tapi opsinya harus tetap sama).
export const ACCESS_TOKEN_COOKIE = "swamedia_access_token";
export const REFRESH_TOKEN_COOKIE = "swamedia_refresh_token";
export const ID_TOKEN_COOKIE = "swamedia_id_token";
// Nama role (mis. "Finance") ditambahkan BE saat login/refresh, BUKAN claim
// bawaan IS — jadi tidak ikut ke idToken dan tidak bisa direkonstruksi dari
// decode idToken. Satu-satunya cara dia tetap ada lintas reload adalah
// disimpan sendiri di sini, ditulis ulang setiap kali login/refresh terjadi.
export const ROLE_NAME_COOKIE = "swamedia_role_name";

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};
