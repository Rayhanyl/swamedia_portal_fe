// Enum TipeKontak — lihat documentation/note/api/03-master-data.md#modul-contact.
//
// File ini sengaja terpisah dari lib/contact.ts dan TIDAK mengimpor
// next/headers/fetchBackend apa pun — supaya aman diimpor sebagai value
// (bukan cuma type) dari Client Component tanpa menyeret kode server-only
// ke bundle browser (lihat catatan di lib/proyek-status.ts).
//
// Catatan: tipeKontak adalah PERAN kontak, bukan status aktif/nonaktif —
// untuk menyembunyikan kontak pakai DELETE (soft delete), bukan field ini.
export const TIPE_KONTAK_VALUES = ["UTAMA", "AKTIF", "PROSPEK"] as const;

export type TipeKontak = (typeof TIPE_KONTAK_VALUES)[number];

export const TIPE_KONTAK_LABEL: Record<TipeKontak, string> = {
  UTAMA: "PIC Utama",
  AKTIF: "Aktif",
  PROSPEK: "Prospek",
};

// Variant Badge (lihat components/ui/badge.tsx) per tipe — murni
// keputusan tampilan FE, tidak ada di API.
export const TIPE_KONTAK_BADGE_VARIANT: Record<
  TipeKontak,
  "default" | "secondary" | "destructive" | "outline"
> = {
  UTAMA: "default",
  AKTIF: "secondary",
  PROSPEK: "outline",
};
