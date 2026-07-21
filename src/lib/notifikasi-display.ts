import {
  AlertTriangleIcon,
  Building2Icon,
  CheckCircle2Icon,
  type LucideIcon,
} from "lucide-react";

import type { NotifikasiKategori } from "@/lib/notifikasi";

// Dipakai bareng oleh dropdown lonceng (notifications-menu.tsx) dan halaman
// penuh (notifikasi/_components/notifikasi-list.tsx) supaya tampilan
// kategori & format waktu konsisten di kedua tempat.
export const KATEGORI_META: Record<
  NotifikasiKategori,
  { label: string; icon: LucideIcon; className: string; dot: string }
> = {
  PENUGASAN: {
    label: "Penugasan",
    icon: Building2Icon,
    className: "bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
    dot: "bg-blue-500",
  },
  STATUS: {
    label: "Status",
    icon: CheckCircle2Icon,
    className:
      "bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400",
    dot: "bg-green-500",
  },
  SISTEM: {
    label: "Sistem",
    icon: AlertTriangleIcon,
    className:
      "bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400",
    dot: "bg-amber-500",
  },
};

export function formatWaktuNotifikasi(iso: string) {
  const date = new Date(iso);
  const tanggal = new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
  const jam = new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
  return `${tanggal} · ${jam}`;
}
