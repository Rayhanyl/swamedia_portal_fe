// Bentuk bersama untuk empat endpoint "laporan target vs realisasi per unit":
// Revenue Unit (05-sales-unit.md#modul-revenue-unit-laporan) dan Sales Matrix
// (05-sales-unit.md#modul-sales-matrix-laporan). Dokumentasi API menegaskan
// bentuk request/response keduanya IDENTIK — hanya konteks realisasinya beda
// (Revenue Unit = realisasi kas dari pencairan; Sales Matrix = realisasi deal
// dari proyek DEAL_KONTRAK). Karena itu tipe di sini dipakai bersama oleh
// lib/revenue-unit.ts dan lib/sales-matrix.ts, mengikuti pola berbagi
// "file value/tipe, bukan fetcher/komponen" (lihat lib/approval-status.ts).
//
// File ini SENGAJA tidak mengimpor fetchBackend/next/headers supaya aman
// diimpor sebagai tipe/nilai dari Client Component.

// Baris laporan lengkap (semua triwulan + total). Dipakai halaman
// /revenue-unit dan /sales-matrix.
export interface LaporanUnitRow {
  unitId: number;
  unitNama: string | null;
  tahun: number;
  targetTw1: number;
  targetTw2: number;
  targetTw3: number;
  targetTw4: number;
  targetTotal: number;
  realisasiTw1: number;
  realisasiTw2: number;
  realisasiTw3: number;
  realisasiTw4: number;
  realisasiTotal: number;
  // realisasiTotal / targetTotal * 100 (0 bila target 0). Read-only dari backend.
  pencapaianPersen: number;
}

// Baris laporan satu triwulan. Dipakai halaman /revenue-unit-tw dan
// /pencapaian-sales-unit.
export interface LaporanUnitTwRow {
  unitId: number;
  unitNama: string | null;
  tahun: number;
  triwulan: number;
  target: number;
  realisasi: number;
  pencapaianPersen: number;
}

// Satu titik triwulan untuk chart (selalu 4 titik: TW1..TW4).
export interface LaporanUnitChartPoint {
  triwulan: number;
  label: string;
  target: number;
  realisasi: number;
}

// Bentuk GET .../chart — unitId/unitNama null bila diagregasi lintas semua unit.
export interface LaporanUnitChartData {
  tahun: number;
  unitId: number | null;
  unitNama: string | null;
  points: LaporanUnitChartPoint[];
}

// Empat triwulan, dipakai untuk selector triwulan dan header kolom.
export const TRIWULAN_VALUES = [1, 2, 3, 4] as const;
export type Triwulan = (typeof TRIWULAN_VALUES)[number];

export const TRIWULAN_LABEL: Record<Triwulan, string> = {
  1: "TW1 (Jan–Mar)",
  2: "TW2 (Apr–Jun)",
  3: "TW3 (Jul–Sep)",
  4: "TW4 (Okt–Des)",
};

// Rentang tahun untuk selector: tahun berjalan ± beberapa, terbaru dulu.
export function tahunOptions(span = 4): number[] {
  const current = new Date().getFullYear();
  const years: number[] = [];
  for (let y = current + 1; y >= current - span; y--) years.push(y);
  return years;
}

// Warna badge pencapaian: >= 100% hijau (default), >= 60% kuning (secondary),
// sisanya merah (destructive). Dipakai konsisten di keempat laporan.
export function pencapaianBadgeVariant(
  persen: number,
): "default" | "secondary" | "destructive" {
  if (persen >= 100) return "default";
  if (persen >= 60) return "secondary";
  return "destructive";
}
