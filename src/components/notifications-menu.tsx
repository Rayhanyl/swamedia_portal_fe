"use client";

import { useState } from "react";
import { BellIcon } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast-manager";
import { KATEGORI_META, formatWaktuNotifikasi } from "@/lib/notifikasi-display";
import type { Notifikasi } from "@/lib/notifikasi";
import type { ApiResponse } from "@/types/api";

export function NotificationsMenu({
  initialItems,
  initialUnreadCount,
}: {
  initialItems: Notifikasi[];
  initialUnreadCount: number;
}) {
  const [items, setItems] = useState(initialItems);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [markingAll, setMarkingAll] = useState(false);

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
    // Optimistic, sama seperti di halaman /notifikasi — endpoint idempoten.
    setItems((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n)),
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
    try {
      const res = await fetch(`/api/proxy/notifikasi/${item.id}/read`, {
        method: "PUT",
      });
      if (!res.ok) {
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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className="text-muted-foreground hover:bg-muted hover:text-foreground relative flex size-9 items-center justify-center rounded-full transition-colors"
            aria-label="Notifikasi"
          />
        }
      >
        <BellIcon className="size-5" />
        {unreadCount > 0 && (
          <span className="bg-destructive text-destructive-foreground absolute top-0.5 right-0.5 flex size-4 items-center justify-center rounded-full text-[10px] font-semibold">
            {unreadCount}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">Notifikasi</span>
            {unreadCount > 0 && (
              <span className="bg-destructive text-destructive-foreground flex size-5 items-center justify-center rounded-full text-[11px] font-semibold">
                {unreadCount}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={handleMarkAllRead}
            disabled={markingAll || unreadCount === 0}
            className="text-primary text-xs font-medium hover:underline disabled:pointer-events-none disabled:opacity-50"
          >
            Tandai dibaca
          </button>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {items.length === 0 ? (
            <p className="text-muted-foreground p-4 text-center text-sm">
              Tidak ada notifikasi.
            </p>
          ) : (
            items.map((n) => {
              const meta = KATEGORI_META[n.kategori];
              const Icon = meta.icon;
              return (
                <div
                  key={n.id}
                  className="flex items-start gap-3 border-b px-4 py-3 last:border-b-0"
                >
                  <div
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-full",
                      meta.className,
                    )}
                  >
                    <Icon className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-foreground text-sm font-medium">
                      {meta.label}
                    </p>
                    <p className="text-muted-foreground mt-0.5 text-xs">
                      {n.pesan}
                    </p>
                    <p className="text-muted-foreground/70 mt-1 text-[11px]">
                      {formatWaktuNotifikasi(n.createdAt)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleMarkOneRead(n)}
                    title={n.isRead ? "Sudah dibaca" : "Tandai sudah dibaca"}
                    className={cn(
                      "mt-1.5 size-2 shrink-0 rounded-full",
                      n.isRead ? "bg-muted-foreground/30" : meta.dot,
                    )}
                  />
                </div>
              );
            })
          )}
        </div>
        <a
          href="/notifikasi"
          className="text-primary block border-t px-4 py-3 text-center text-sm font-medium hover:underline"
        >
          Lihat semua notifikasi →
        </a>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
