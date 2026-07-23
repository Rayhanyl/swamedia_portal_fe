// Enum status siklus Proyek — TIDAK didokumentasikan lengkap di
// documentation/note/api/05-sales-unit.md (cuma menyebut INFO_PELUANG sebagai
// default dan DEAL_KONTRAK sebagai status khusus). Daftar 7 nilai ini
// dikonfirmasi langsung dari constraint database backend.
//
// File ini sengaja terpisah dari lib/proyek.ts dan TIDAK mengimpor
// next/headers/fetchBackend apa pun — supaya aman diimpor sebagai value
// (bukan cuma type) dari Client Component tanpa menyeret kode server-only
// ke bundle browser (lihat catatan di lib/daftar-surat.ts).
export const PROYEK_STATUS_VALUES = [
  "INFO_PELUANG",
  "UNDANGAN_PENJELASAN",
  "MEETING_INISIASI",
  "PROSES_PROPOSAL",
  "EVALUASI_ADMIN_TEKNIS",
  "DEAL_KONTRAK",
  "GAGAL",
] as const;

export type ProyekStatus = (typeof PROYEK_STATUS_VALUES)[number];

export const PROYEK_STATUS_LABEL: Record<ProyekStatus, string> = {
  INFO_PELUANG: "Info Peluang",
  UNDANGAN_PENJELASAN: "Undangan Penjelasan",
  MEETING_INISIASI: "Meeting Inisiasi",
  PROSES_PROPOSAL: "Proses Proposal/BoQ",
  EVALUASI_ADMIN_TEKNIS: "Evaluasi Admin/Teknis",
  DEAL_KONTRAK: "Deal/Kontrak",
  GAGAL: "Gagal",
};

// Pengelompokan status ke 4 kolom ringkasan (Peluang/Proses/Deal/Gagal) di
// tabel Daftar Sales Unit — TIDAK ada di API, ini murni keputusan tampilan
// frontend berdasarkan urutan siklus di atas.
export type ProyekStatusBucket = "PELUANG" | "PROSES" | "DEAL" | "GAGAL";

export function getProyekStatusBucket(
  status: ProyekStatus,
): ProyekStatusBucket {
  if (status === "INFO_PELUANG") return "PELUANG";
  if (status === "DEAL_KONTRAK") return "DEAL";
  if (status === "GAGAL") return "GAGAL";
  return "PROSES";
}

// Warna titik timeline Log Status — progresi "suhu" dari netral (peluang)
// ke hangat (proses) ke hijau (deal) / merah (gagal), sesuai mockup desain.
// Murni keputusan tampilan FE, TIDAK ada di API.
export const PROYEK_STATUS_DOT_COLOR: Record<ProyekStatus, string> = {
  INFO_PELUANG: "bg-muted-foreground/50",
  UNDANGAN_PENJELASAN: "bg-blue-500",
  MEETING_INISIASI: "bg-blue-500",
  PROSES_PROPOSAL: "bg-amber-500",
  EVALUASI_ADMIN_TEKNIS: "bg-orange-600",
  DEAL_KONTRAK: "bg-emerald-500",
  GAGAL: "bg-destructive",
};
