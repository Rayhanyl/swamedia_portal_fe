import type { ApiResponse } from "@/types/api";

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
    throw new Error(body.errors?.message ?? body.message);
  }
  return body.data as T;
}

const jsonHeaders = { "Content-Type": "application/json" };

export const apiClient = {
  get: <T>(path: string) =>
    fetch(`/api/proxy/${path}`).then((res) => unwrap<T>(res)),

  post: <T>(path: string, payload: unknown) =>
    fetch(`/api/proxy/${path}`, {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify(payload),
    }).then((res) => unwrap<T>(res)),

  put: <T>(path: string, payload: unknown) =>
    fetch(`/api/proxy/${path}`, {
      method: "PUT",
      headers: jsonHeaders,
      body: JSON.stringify(payload),
    }).then((res) => unwrap<T>(res)),

  patch: <T>(path: string, payload: unknown) =>
    fetch(`/api/proxy/${path}`, {
      method: "PATCH",
      headers: jsonHeaders,
      body: JSON.stringify(payload),
    }).then((res) => unwrap<T>(res)),

  delete: <T>(path: string) =>
    fetch(`/api/proxy/${path}`, { method: "DELETE" }).then((res) =>
      unwrap<T>(res)
    ),
};
