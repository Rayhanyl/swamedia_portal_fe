import { Toast } from "@base-ui/react/toast";

// Instance global (di luar pohon React) supaya toast bisa dipicu dari mana
// saja — bukan cuma dari komponen lewat hook `Toast.useToastManager()`,
// tapi juga dari fungsi biasa seperti `login()`/`logout()` di AuthContext,
// atau nanti dari handler create/update/delete di halaman CRUD.
export const toastManager = Toast.createToastManager();

export const toast = {
  success: (description: string, title = "Berhasil") =>
    toastManager.add({ type: "success", title, description }),
  error: (description: string, title = "Gagal") =>
    toastManager.add({ type: "error", title, description }),
  info: (description: string, title?: string) =>
    toastManager.add({ title, description }),
};
