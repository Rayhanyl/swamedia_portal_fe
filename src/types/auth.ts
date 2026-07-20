// Bentuk `data` untuk endpoint /auth/login, /auth/token, dan /auth/refresh.
export interface LoginResponse {
  accessToken: string;
  refreshToken?: string;
  idToken?: string;
  tokenType: string; // "Bearer"
  expiresIn: number; // detik
  scope?: string;
  user: AuthUser; // klaim id_token: sub, email, name, dst.
}

// Klaim user dari id_token. Longgar karena bentuknya bergantung WSO2 IS.
export type AuthUser = Record<string, unknown>;
