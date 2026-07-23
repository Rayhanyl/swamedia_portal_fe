import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format angka besar jadi ringkas ala "6,1M" / "275Jt" (locale id-ID).
export function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("id-ID", {
    notation: "compact",
    maximumFractionDigits: 1,
  })
    .format(value)
    .replace(/\s/g, "");
}

// Format nilai uang penuh ala "Rp 1.200.000.000" (locale id-ID, tanpa desimal).
// Dipakai di tabel laporan finansial/sales yang butuh angka utuh, sementara
// formatCompactNumber dipakai untuk sumbu/label chart yang butuh ringkas.
export function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  const first = parts[0][0] ?? "";
  const last = parts[parts.length - 1]?.[0] ?? "";
  return (first + last).toUpperCase();
}
