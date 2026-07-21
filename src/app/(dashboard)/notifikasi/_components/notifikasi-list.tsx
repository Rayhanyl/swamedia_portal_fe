"use client";

import { useState } from "react";
import { ChevronDownIcon, Loader2Icon } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast-manager";
import { KATEGORI_META, formatWaktuNotifikasi } from "@/lib/notifikasi-display";
import type {
  Notifikasi,
  NotifikasiKategori,
  NotifikasiPage,
} from "@/lib/notifikasi";
import type { ApiResponse, Pagination } from "@/types/api";

type FilterValue = "SEMUA" | "BELUM_DIBACA" | NotifikasiKategori;

const FILTER_OPTIONS: { value: FilterValue; label: string }[] = [
  { value: "SEMUA", label: "Semua" },
  { value: "BELUM_DIBACA", label: "Belum Dibaca" },
  { value: "PENUGASAN", label: "Penugasan" },
  { value: "STATUS", label: "Status" },
  { value: "SISTEM", label: "Sistem" },
];

const LIMIT = 8;

export function NotifikasiList({
  initialPage,
  initialUnreadCount,
}: {
  initialPage: NotifikasiPage;
  initialUnreadCount: number;
}) {
  const [items, setItems] = useState(initialPage.items);
  const [pagination, setPagination] = useState<Pagination | null>(
    initialPage.pagination,
  );
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [filter, setFilter] = useState<FilterValue>("SEMUA");
  const [loadingMore, setLoadingMore] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  function buildQuery(filterValue: FilterValue, page: number) {
    const params = new URLSearchParams();
    if (filterValue === "BELUM_DIBACA") params.set("is_read", "false");
    else if (filterValue !== "SEMUA") params.set("kategori", filterValue);
    params.set("page", String(page));
    params.set("limit", String(LIMIT));
    return params.toString();
  }

  async function fetchPage(filterValue: FilterValue, page: number) {
    const res = await fetch(
      `/api/proxy/notifikasi?${buildQuery(filterValue, page)}`,
      {
        cache: "no-store",
      },
    );
    const body: ApiResponse<Notifikasi[]> = await res.json();
    if (!res.ok || !body.success) {
      throw new Error(body.message || "Gagal memuat notifikasi");
    }
    return { items: body.data ?? [], pagination: body.meta.pagination ?? null };
  }

  async function handleFilterChange(value: FilterValue) {
    setFilter(value);
    try {
      const page = await fetchPage(value, 1);
      setItems(page.items);
      setPagination(page.pagination);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Gagal memuat notifikasi",
      );
    }
  }

  async function handleLoadMore() {
    if (!pagination || pagination.page >= pagination.totalPages) return;
    setLoadingMore(true);
    try {
      const page = await fetchPage(filter, pagination.page + 1);
      setItems((prev) => [...prev, ...page.items]);
      setPagination(page.pagination);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Gagal memuat notifikasi",
      );
    } finally {
      setLoadingMore(false);
    }
  }

  async function handleMarkAllRead() {
    setMarkingAll(true);
    try {
      const res = await fetch("/api/proxy/notifikasi/read-all", {
        method: "PUT",
      });
      const body: ApiResponse<null> = await res.json();
      if (!res.ok || !body.success) {
        toast.error(body.message || "Gagal menandai notifikasi");
        return;
      }
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      toast.error("Tidak dapat menghubungi server");
    } finally {
      setMarkingAll(false);
    }
  }

  async function handleMarkOneRead(item: Notifikasi) {
    if (item.isRead) return;
    // Optimistic — cepat terasa responsif, tidak masalah kalau di-retry
    // (endpoint idempoten, lihat catatan status 200 di dokumentasi).
    setItems((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n)),
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
    try {
      const res = await fetch(`/api/proxy/notifikasi/${item.id}/read`, {
        method: "PUT",
      });
      if (!res.ok) {
        // Rollback kalau gagal
        setItems((prev) =>
          prev.map((n) => (n.id === item.id ? { ...n, isRead: false } : n)),
        );
        setUnreadCount((prev) => prev + 1);
      }
    } catch {
      setItems((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, isRead: false } : n)),
      );
      setUnreadCount((prev) => prev + 1);
    }
  }

  const currentFilterLabel =
    FILTER_OPTIONS.find((o) => o.value === filter)?.label ?? "Semua";
  const totalItems = pagination?.totalItems ?? items.length;
  const hasMore = pagination ? pagination.page < pagination.totalPages : false;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">Notifikasi</h1>
          {unreadCount > 0 && (
            <span className="bg-destructive text-destructive-foreground rounded-full px-2.5 py-0.5 text-xs font-semibold">
              {unreadCount} Belum Dibaca
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={handleMarkAllRead}
            disabled={markingAll || unreadCount === 0}
            className="text-primary text-sm font-medium hover:underline disabled:pointer-events-none disabled:opacity-50"
          >
            Tandai Semua Dibaca
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button
                  type="button"
                  className="border-input bg-background flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm"
                />
              }
            >
              {currentFilterLabel}
              <ChevronDownIcon className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuRadioGroup
                value={filter}
                onValueChange={(value) =>
                  handleFilterChange(value as FilterValue)
                }
              >
                {FILTER_OPTIONS.map((opt) => (
                  <DropdownMenuRadioItem
                    key={opt.value}
                    value={opt.value}
                    closeOnClick
                  >
                    {opt.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border">
        {items.length === 0 ? (
          <p className="text-muted-foreground p-6 text-center text-sm">
            Tidak ada notifikasi.
          </p>
        ) : (
          items.map((item) => {
            const meta = KATEGORI_META[item.kategori];
            const Icon = meta.icon;
            return (
              <div
                key={item.id}
                className={cn(
                  "flex items-start gap-3 border-b p-4 last:border-b-0",
                  !item.isRead && "bg-blue-50/60 dark:bg-blue-950/20",
                )}
              >
                <button
                  type="button"
                  onClick={() => handleMarkOneRead(item)}
                  title={item.isRead ? "Sudah dibaca" : "Tandai sudah dibaca"}
                  className={cn(
                    "mt-1.5 size-2 shrink-0 rounded-full",
                    item.isRead ? "bg-muted-foreground/30" : meta.dot,
                  )}
                />
                <div
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-full",
                    meta.className,
                  )}
                >
                  <Icon className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{meta.label}</p>
                  <p className="text-muted-foreground mt-0.5 text-sm">
                    {item.pesan}
                  </p>
                  <p className="text-muted-foreground/70 mt-1 text-xs">
                    {formatWaktuNotifikasi(item.createdAt)}
                  </p>
                </div>
                {item.linkLabel && (
                  <a
                    href="#"
                    className="text-primary shrink-0 text-sm font-medium whitespace-nowrap hover:underline"
                  >
                    {item.linkLabel} →
                  </a>
                )}
              </div>
            );
          })
        )}
      </div>

      {items.length > 0 && (
        <div className="space-y-3 text-center">
          <p className="text-muted-foreground text-sm">
            Menampilkan {items.length} dari {totalItems} notifikasi
          </p>
          {hasMore && (
            <button
              type="button"
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="border-input inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              {loadingMore && <Loader2Icon className="size-4 animate-spin" />}
              Muat Lebih Banyak
            </button>
          )}
        </div>
      )}
    </div>
  );
}
