// Dilempar oleh AuthContext.login() saat POST /api/login gagal. `code`
// meneruskan `errors.code` dari backend (mis. "UNAUTHORIZED", "FORBIDDEN")
// supaya UI bisa membedakan penanganannya alih-alih menyamaratakan semua
// kegagalan login sebagai "password salah" — lihat Frontend-Auth-Middleware.md §1.4.
export class LoginError extends Error {
  code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = "LoginError";
    this.code = code;
  }
}
