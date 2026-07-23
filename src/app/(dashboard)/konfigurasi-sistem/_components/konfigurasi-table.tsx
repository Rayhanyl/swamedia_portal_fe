"use client";

import { useRef, useState } from "react";
import { Loader2Icon, PencilIcon, SearchIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { SysConfig } from "@/lib/konfigurasi-sistem";
import { toast } from "@/lib/toast-manager";
import { cn } from "@/lib/utils";
import type { ApiResponse } from "@/types/api";
import { KonfigurasiEditDialog } from "./konfigurasi-edit-dialog";

function formatWaktu(iso: string | null) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function KonfigurasiTable({
  initialItems,
}: {
  initialItems: SysConfig[];
}) {
  const [items, setItems] = useState(initialItems);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<SysConfig | null>(null);

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function fetchList(nextSearch: string) {
    const query = new URLSearchParams();
    if (nextSearch) query.set("search", nextSearch);

    setLoading(true);
    try {
      const res = await fetch(
        `/api/proxy/konfigurasi-sistem?${query.toString()}`,
        { cache: "no-store" },
      );
      const body: ApiResponse<SysConfig[]> = await res.json();
      if (!res.ok || !body.success) {
        throw new Error(body.message || "Gagal memuat konfigurasi sistem");
      }
      setItems(body.data ?? []);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Gagal memuat konfigurasi sistem",
      );
    } finally {
      setLoading(false);
    }
  }

  function handleSearchChange(value: string) {
    setSearch(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => fetchList(value), 400);
  }

  function handleSaved(saved: SysConfig) {
    setItems((prev) => prev.map((it) => (it.key === saved.key ? saved : it)));
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Konfigurasi Sistem</h1>
          <p className="text-muted-foreground text-sm">
            Registry setting global. Hanya nilai (value) yang bisa diubah —
            key dan deskripsi tetap.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
            <Input
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Cari key/deskripsi..."
              className="w-56 pl-8"
            />
          </div>
          {loading && (
            <Loader2Icon className="text-muted-foreground size-4 animate-spin" />
          )}
        </div>
      </div>

      <div
        className={cn(
          "overflow-x-auto rounded-xl border",
          loading && "pointer-events-none opacity-60",
        )}
      >
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-primary text-primary-foreground text-left">
              <th className="px-4 py-3 text-xs font-semibold">KEY</th>
              <th className="px-4 py-3 text-xs font-semibold">VALUE</th>
              <th className="px-4 py-3 text-xs font-semibold">DESKRIPSI</th>
              <th className="px-4 py-3 text-xs font-semibold">DIPERBARUI</th>
              <th className="px-4 py-3 text-right text-xs font-semibold">
                AKSI
              </th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="text-muted-foreground p-6 text-center text-sm"
                >
                  Tidak ada konfigurasi.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.key} className="border-b last:border-b-0">
                  <td className="px-4 py-3 align-top font-mono text-xs font-medium">
                    {item.key}
                  </td>
                  <td className="px-4 py-3 align-top">
                    {item.value === null || item.value === "" ? (
                      <Badge variant="outline">kosong</Badge>
                    ) : (
                      <span className="font-mono">{item.value}</span>
                    )}
                  </td>
                  <td className="text-muted-foreground max-w-md px-4 py-3 align-top">
                    {item.deskripsi ?? "—"}
                  </td>
                  <td className="text-muted-foreground px-4 py-3 align-top whitespace-nowrap">
                    {formatWaktu(item.updatedAt)}
                  </td>
                  <td className="px-4 py-3 text-right align-top">
                    <button
                      type="button"
                      onClick={() => setEditing(item)}
                      title="Ubah nilai"
                      className="border-input text-primary hover:bg-muted flex size-8 items-center justify-center rounded-md border"
                    >
                      <PencilIcon className="size-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <KonfigurasiEditDialog
        item={editing}
        onOpenChange={(open) => !open && setEditing(null)}
        onSaved={handleSaved}
      />
    </>
  );
}
