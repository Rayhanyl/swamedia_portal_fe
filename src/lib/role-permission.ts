// Tipe murni untuk Role Permission — lihat
// documentation/note/api/04-rbac.md#modul-role-permission.
// GET /api/v1/master/role-permissions/{roleId} mengembalikan matriks izin per
// role: SATU baris untuk SETIAP modul yang ada (termasuk modul yang belum
// diatur → semua flag false, scope "ALL"). PUT mengganti SELURUH matriks
// sekaligus (modul yang tak disertakan kehilangan semua izinnya).
//
// File ini SENGAJA tidak mengimpor fetchBackend/next/headers — matriks
// diambil client-side lewat /api/proxy/master/role-permissions (lihat
// role-permission-grid.tsx), bukan saat initial server render, karena baru
// diperlukan setelah admin memilih sebuah role. Pola yang sama dengan
// lib/role-menu.ts dan lib/*-status.ts (aman diimpor sebagai nilai/tipe dari
// Client Component).

export type PermissionScope = "ALL" | "UNIT_SENDIRI";

export interface RolePermissionItem {
  modulId: number;
  kodeModul: string;
  namaModul: string;
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  // Hanya bermakna untuk modul beralur approval (Pembayaran & Pengeluaran
  // Perusahaan); untuk modul lain nilainya diabaikan backend.
  canApprove: boolean;
  canExport: boolean;
  scope: PermissionScope;
}

export interface RolePermissionMatrix {
  roleId: number;
  kodeRole: string;
  namaRole: string;
  items: RolePermissionItem[];
}

// Payload PUT: subset RolePermissionItem tanpa field join (kodeModul/namaModul).
export interface RolePermissionPayloadItem {
  modulId: number;
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canApprove: boolean;
  canExport: boolean;
  scope: PermissionScope;
}
