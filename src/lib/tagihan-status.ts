// Enum statusAktif Tagihan — documentation/note/api/06-finansial.md baris
// ~92. File terpisah tanpa import server-only (sama alasannya dengan
// proyek-status.ts) supaya aman diimpor sebagai value dari Client Component.
export const TAGIHAN_STATUS_VALUES = [
  "PELUANG",
  "RENCANA",
  "BAST",
  "KIRIM_TAGIHAN",
  "LUNAS",
  "TIDAK_TERTAGIH",
] as const;

export type TagihanStatus = (typeof TAGIHAN_STATUS_VALUES)[number];

export const TAGIHAN_STATUS_LABEL: Record<TagihanStatus, string> = {
  PELUANG: "Peluang",
  RENCANA: "Rencana",
  BAST: "BAST",
  KIRIM_TAGIHAN: "Kirim Tagihan",
  LUNAS: "Lunas",
  TIDAK_TERTAGIH: "Tidak Tertagih",
};

// Warna titik timeline Status Tagihan — progresi sama seperti
// PROYEK_STATUS_DOT_COLOR (proyek-status.ts): netral (peluang) -> hangat
// (proses penagihan) -> hijau (lunas) / merah (tidak tertagih). Murni
// keputusan tampilan FE, TIDAK ada di API.
export const TAGIHAN_STATUS_DOT_COLOR: Record<TagihanStatus, string> = {
  PELUANG: "bg-muted-foreground/50",
  RENCANA: "bg-blue-500",
  BAST: "bg-amber-500",
  KIRIM_TAGIHAN: "bg-orange-600",
  LUNAS: "bg-emerald-500",
  TIDAK_TERTAGIH: "bg-destructive",
};

// Enum status Pencairan — documentation/note/api/06-finansial.md baris ~252.
export const PENCAIRAN_STATUS_VALUES = [
  "PARSIAL",
  "FINAL",
  "DIBATALKAN",
] as const;

export type PencairanStatus = (typeof PENCAIRAN_STATUS_VALUES)[number];

export const PENCAIRAN_STATUS_LABEL: Record<PencairanStatus, string> = {
  PARSIAL: "Parsial",
  FINAL: "Final",
  DIBATALKAN: "Dibatalkan",
};
