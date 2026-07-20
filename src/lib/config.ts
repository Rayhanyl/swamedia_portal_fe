// Konfigurasi runtime yang dipakai kode server-side (route handler & proxy).
// BACKEND_BASE_URL menunjuk ke Ballerina BFF (swamedia_portal_be).
export const BACKEND_BASE_URL =
  process.env.BACKEND_BASE_URL ?? "http://localhost:8080";
