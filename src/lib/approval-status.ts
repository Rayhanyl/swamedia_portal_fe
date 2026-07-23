// Status alur approval Pembayaran & Pengeluaran Perusahaan — identik di
// kedua modul (lihat documentation/note/api/06-finansial.md#alur-status-state-machine):
//
//   PENGAJUAN --approve--> APPROVED   (terkunci; tidak bisa diedit/dihapus)
//       ^         --reject--> REJECTED
//       |                        |
//       +----- edit (PUT) -------+   (mengedit REJECTED mengembalikannya ke PENGAJUAN)
//
// File terpisah dari lib/pembayaran.ts & lib/pengeluaran-perusahaan.ts dan TIDAK
// mengimpor next/headers/fetchBackend apa pun — aman diimpor sebagai value dari
// Client Component (lihat catatan di lib/proyek-status.ts).
export const APPROVAL_STATUS_VALUES = [
  "PENGAJUAN",
  "APPROVED",
  "REJECTED",
] as const;

export type ApprovalStatus = (typeof APPROVAL_STATUS_VALUES)[number];

export const APPROVAL_STATUS_LABEL: Record<ApprovalStatus, string> = {
  PENGAJUAN: "Pengajuan",
  APPROVED: "Disetujui",
  REJECTED: "Ditolak",
};

export const APPROVAL_STATUS_BADGE_VARIANT: Record<
  ApprovalStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  PENGAJUAN: "outline",
  APPROVED: "default",
  REJECTED: "destructive",
};

// Hanya baris PENGAJUAN/REJECTED yang bisa diedit/dihapus; APPROVED terkunci.
// Hanya baris PENGAJUAN yang bisa di-approve/reject (REJECTED harus diedit
// dulu — otomatis kembali ke PENGAJUAN — sebelum bisa disetujui lagi).
export function canEditApproval(status: ApprovalStatus): boolean {
  return status !== "APPROVED";
}

export function canApproveOrReject(status: ApprovalStatus): boolean {
  return status === "PENGAJUAN";
}
