// Enum StatusPeluang/JenisCustomer — lihat
// documentation/note/api/03-master-data.md#modul-customer.
//
// File ini sengaja terpisah dari lib/customer.ts dan TIDAK mengimpor
// next/headers/fetchBackend apa pun — supaya aman diimpor sebagai value
// (bukan cuma type) dari Client Component tanpa menyeret kode server-only
// ke bundle browser (lihat catatan di lib/proyek-status.ts).
export const STATUS_PELUANG_VALUES = [
  "PROSPEK",
  "NEGOSIASI",
  "DEAL",
  "BATAL",
] as const;

export type StatusPeluang = (typeof STATUS_PELUANG_VALUES)[number];

export const STATUS_PELUANG_LABEL: Record<StatusPeluang, string> = {
  PROSPEK: "Prospek",
  NEGOSIASI: "Negosiasi",
  DEAL: "Deal",
  BATAL: "Batal",
};

// Variant Badge (lihat components/ui/badge.tsx) per status — murni
// keputusan tampilan FE, tidak ada di API.
export const STATUS_PELUANG_BADGE_VARIANT: Record<
  StatusPeluang,
  "default" | "secondary" | "destructive" | "outline"
> = {
  PROSPEK: "outline",
  NEGOSIASI: "secondary",
  DEAL: "default",
  BATAL: "destructive",
};

export const JENIS_CUSTOMER_VALUES = [
  "ENTERPRISE",
  "BANKING",
  "BUMN",
  "GOVERNMENT",
] as const;

export type JenisCustomer = (typeof JENIS_CUSTOMER_VALUES)[number];

export const JENIS_CUSTOMER_LABEL: Record<JenisCustomer, string> = {
  ENTERPRISE: "Enterprise",
  BANKING: "Banking",
  BUMN: "BUMN",
  GOVERNMENT: "Government",
};
