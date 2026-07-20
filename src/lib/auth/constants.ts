// Nama cookie sesi. Dipisah ke modul sendiri (tanpa dependensi `next/headers`)
// supaya bisa diimpor baik dari Route Handler (Node) maupun dari `proxy.ts`
// (edge), tanpa menyeret API yang tidak tersedia di runtime edge.
export const ACCESS_TOKEN_COOKIE = "swamedia_access_token";
export const REFRESH_TOKEN_COOKIE = "swamedia_refresh_token";
export const ID_TOKEN_COOKIE = "swamedia_id_token";
