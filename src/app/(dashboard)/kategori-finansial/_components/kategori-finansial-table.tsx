"use client";

import { useRef, useState } from "react";
import {
  ChevronDownIcon,
  Loader2Icon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  Trash2Icon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast-manager";
import type {
  KategoriFinansialKeluar,
  KategoriFinansialKeluarPage,
  KategoriFinansialKeluarStatus,
} from "@/lib/kategori-finansial-keluar";
import type { ApiResponse, Pagination } from "@/types/api";
import { KategoriFinansialFormDialog } from "./kategori-finansial-form-dialog";

function FilterDropdown({
  value,
  fallbackLabel,
  options,
  onChange,
}: {
  value: string;
  fallbackLabel: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  const current =
    options.find((o) => o.value === value)?.label ?? fallbackLabel;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className="border-input bg-background flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm whitespace-nowrap"
          />
        }
      >
        {current}
        <ChevronDownIcon className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuRadioGroup value={value} onValueChange={onChange}>
          {options.map((opt) => (
            <DropdownMenuRadioItem
              key={opt.value || "__all__"}
              value={opt.value}
              closeOnClick
            >
              {opt.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function KategoriFinansialTable({
  initialPage,
}: {
  initialPage: KategoriFinansialKeluarPage;
}) {
  const [items, setItems] = useState(initialPage.items);
  const [pagination, setPagination] = useState<Pagination | null>(
    initialPage.pagination,
  );
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<KategoriFinansialKeluarStatus | null>(null);
  const [loading, setLoading] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] =
    useState<KategoriFinansialKeluar | null>(null);
  const [deletingItem, setDeletingItem] =
    useState<KategoriFinansialKeluar | null>(null);
  const [deleting, setDeleting] = useState(false);

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function fetchPage(overrides: {
    search?: string;
    status?: KategoriFinansialKeluarStatus | null;
  }) {
    const nextSearch = overrides.search ?? search;
    const nextStatus =
      overrides.status !== undefined ? overrides.status : statusFilter;

    const query = new URLSearchParams();
    if (nextSearch) query.set("search", nextSearch);
    if (nextStatus) query.set("status", nextStatus);
    query.set("page", "1");
    query.set("limit", "100");

    setLoading(true);
    try {
      const res = await fetch(
        `/api/proxy/master/kategori-finansial-keluar?${query.toString()}`,
        { cache: "no-store" },
      );
      const body: ApiResponse<KategoriFinansialKeluar[]> = await res.json();
      if (!res.ok || !body.success) {
        throw new Error(body.message || "Gagal memuat daftar kategori finansial");
      }
      setItems(body.data ?? []);
      setPagination(body.meta.pagination ?? null);
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Gagal memuat daftar kategori finansial",
      );
    } finally {
      setLoading(false);
    }
  }

  function handleSearchChange(value: string) {
    setSearch(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      fetchPage({ search: value });
    }, 400);
  }

  function handleStatusFilterChange(value: KategoriFinansialKeluarStatus | null) {
    setStatusFilter(value);
    fetchPage({ status: value });
  }

  function openAdd() {
    setEditingItem(null);
    setDialogOpen(true);
  }

  function openEdit(item: KategoriFinansialKeluar) {
    setEditingItem(item);
    setDialogOpen(true);
  }

  function handleSaved(saved: KategoriFinansialKeluar) {
    setItems((prev) =>
      prev.some((it) => it.id === saved.id)
        ? prev.map((it) => (it.id === saved.id ? saved : it))
        : [saved, ...prev],
    );
  }

  async function handleDelete() {
    if (!deletingItem) return;
    setDeleting(true);
    try {
      const res = await fetch(
        `/api/proxy/master/kategori-finansial-keluar/${deletingItem.id}`,
        { method: "DELETE" },
      );
      const body: ApiResponse<null> = await res.json();
      if (!res.ok || !body.success) {
        toast.error(body.message || "Gagal menghapus kategori finansial");
        return;
      }
      setItems((prev) => prev.filter((it) => it.id !== deletingItem.id));
      toast.success("Kategori finansial berhasil dihapus");
      setDeletingItem(null);
    } catch {
      toast.error("Tidak dapat menghubungi server");
    } finally {
      setDeleting(false);
    }
  }

  const totalItems = pagination?.totalItems ?? items.length;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-muted-foreground text-sm">
            Master kategori pengeluaran, dirujuk oleh form Pembayaran dan
            Pengeluaran Perusahaan.
          </p>
        </div>
        <Button onClick={openAdd}>
          <PlusIcon className="size-4" />
          Tambah Kategori
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-muted-foreground text-sm">Filter:</span>
        <FilterDropdown
          value={statusFilter ?? ""}
          fallbackLabel="Semua Status"
          options={[
            { value: "", label: "Semua Status" },
            { value: "AKTIF", label: "Aktif" },
            { value: "TIDAK_AKTIF", label: "Tidak Aktif" },
          ]}
          onChange={(v) =>
            handleStatusFilterChange(
              (v || null) as KategoriFinansialKeluarStatus | null,
            )
          }
        />
        <div className="relative">
          <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Cari kode/nama..."
            className="w-56 pl-8"
          />
        </div>
        {loading && (
          <Loader2Icon className="text-muted-foreground size-4 animate-spin" />
        )}
      </div>

      <div
        className={cn(
          "overflow-hidden rounded-xl border",
          loading && "pointer-events-none opacity-60",
        )}
      >
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/40 border-b text-left">
              <th className="text-muted-foreground w-12 px-4 py-3 text-xs font-semibold">
                NO
              </th>
              <th className="text-muted-foreground px-4 py-3 text-xs font-semibold">
                KODE
              </th>
              <th className="text-muted-foreground px-4 py-3 text-xs font-semibold">
                NAMA KATEGORI
              </th>
              <th className="text-muted-foreground px-4 py-3 text-xs font-semibold">
                STATUS
              </th>
              <th className="text-muted-foreground px-4 py-3 text-right text-xs font-semibold">
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
                  Belum ada kategori finansial.
                </td>
              </tr>
            ) : (
              items.map((item, index) => (
                <tr key={item.id} className="border-b last:border-b-0">
                  <td className="text-muted-foreground px-4 py-3 align-top">
                    {index + 1}
                  </td>
                  <td className="px-4 py-3 align-top font-mono font-medium">
                    {item.kode}
                  </td>
                  <td className="px-4 py-3 align-top">{item.nama}</td>
                  <td className="px-4 py-3 align-top">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
                        item.status === "AKTIF"
                          ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      <span
                        className={cn(
                          "size-1.5 rounded-full",
                          item.status === "AKTIF"
                            ? "bg-green-500"
                            : "bg-muted-foreground/50",
                        )}
                      />
                      {item.status === "AKTIF" ? "Aktif" : "Tidak Aktif"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right align-top">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => openEdit(item)}
                        title="Edit"
                        className="border-input text-primary hover:bg-muted flex size-8 items-center justify-center rounded-md border"
                      >
                        <PencilIcon className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingItem(item)}
                        title="Hapus"
                        className="border-input text-destructive hover:bg-destructive/10 flex size-8 items-center justify-center rounded-md border"
                      >
                        <Trash2Icon className="size-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {items.length > 0 && pagination && totalItems > items.length && (
        <p className="text-muted-foreground text-sm">
          Menampilkan {items.length} dari {totalItems} kategori. Gunakan
          pencarian atau filter untuk mempersempit hasil.
        </p>
      )}

      <KategoriFinansialFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editingItem}
        onSaved={handleSaved}
      />

      <Dialog
        open={deletingItem !== null}
        onOpenChange={(open) => !open && setDeletingItem(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-primary-foreground">
              Hapus Kategori Finansial
            </DialogTitle>
          </DialogHeader>
          <DialogBody>
            <p className="text-sm">
              Hapus kategori{" "}
              <span className="font-semibold">
                &ldquo;{deletingItem?.nama}&rdquo; ({deletingItem?.kode})
              </span>
              ? Kategori yang masih dipakai pada Pembayaran/Pengeluaran
              Perusahaan tidak dapat dihapus. Tindakan ini tidak bisa
              dibatalkan.
            </p>
          </DialogBody>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeletingItem(null)}
              disabled={deleting}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Menghapus..." : "Hapus"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
