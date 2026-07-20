import type { ApiResponse } from "@/types/api";
import { toast } from "@/lib/toast-manager";

// Helper yang dipanggil dari komponen React (browser). Token sudah ditangani
// sepenuhnya oleh proxy.ts, jadi di sini cukup memanggil path relatif ke
// /api/proxy/... tanpa header Authorization apa pun.
//
// contoh: apiClient.get("master/units?page=1")
//   -> GET /api/proxy/master/units?page=1
//   -> backend GET /api/v1/master/units?page=1 (token ditempel otomatis)

async function unwrap<T>(res: Response): Promise<T> {
  const body: ApiResponse<T> = await res.json();
  if (!res.ok || !body.success) {
    if (res.status === 401 && typeof window !== "undefined") {
      window.location.href = "/login";
    }
    const message = body.errors?.message ?? body.message;
    toast.error(message);
    throw new Error(message);
  }
  return body.data as T;
}

// successMessage opsional: dipakai halaman create/update/delete untuk
// menampilkan toast setelah mutasi berhasil (mis. "Unit berhasil ditambahkan").
// Tidak diisi berarti tidak ada toast sukses — GET/list tidak perlu ini.
function withSuccessToast<T>(
  promise: Promise<T>,
  successMessage?: string,
): Promise<T> {
  return promise.then((data) => {
    if (successMessage) toast.success(successMessage);
    return data;
  });
}

const jsonHeaders = { "Content-Type": "application/json" };

export const apiClient = {
  get: <T>(path: string) =>
    fetch(`/api/proxy/${path}`).then((res) => unwrap<T>(res)),

  post: <T>(path: string, payload: unknown, successMessage?: string) =>
    withSuccessToast(
      fetch(`/api/proxy/${path}`, {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify(payload),
      }).then((res) => unwrap<T>(res)),
      successMessage,
    ),

  put: <T>(path: string, payload: unknown, successMessage?: string) =>
    withSuccessToast(
      fetch(`/api/proxy/${path}`, {
        method: "PUT",
        headers: jsonHeaders,
        body: JSON.stringify(payload),
      }).then((res) => unwrap<T>(res)),
      successMessage,
    ),

  patch: <T>(path: string, payload: unknown, successMessage?: string) =>
    withSuccessToast(
      fetch(`/api/proxy/${path}`, {
        method: "PATCH",
        headers: jsonHeaders,
        body: JSON.stringify(payload),
      }).then((res) => unwrap<T>(res)),
      successMessage,
    ),

  delete: <T>(path: string, successMessage?: string) =>
    withSuccessToast(
      fetch(`/api/proxy/${path}`, { method: "DELETE" }).then((res) =>
        unwrap<T>(res),
      ),
      successMessage,
    ),
};
