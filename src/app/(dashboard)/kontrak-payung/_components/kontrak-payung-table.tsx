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

import { Badge } from "@/components/ui/badge";
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
import type { Customer } from "@/lib/customer";
import type { KontrakPayung, KontrakPayungPage } from "@/lib/kontrak-payung";
import type { ApiResponse, Pagination } from "@/types/api";
import { KontrakPayungFormDialog } from "./kontrak-payung-form-dialog";

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

function formatTanggal(iso: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

// TIDAK ada di response API (lihat documentation/note/api/05-sales-unit.md#modul-kontrak-payung)
// meski backend punya view v_kontrak_payung yang menghitungnya — dihitung ulang
// di frontend dengan logika yang identik (tanggalSelesai >= hari ini = Berlaku),
// murni dari field yang sudah ada di list, tanpa field API tambahan.
function isBerlaku(tanggalSelesai: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(tanggalSelesai) >= today;
}

export function KontrakPayungTable({
  initialPage,
  customerOptions,
}: {
  initialPage: KontrakPayungPage;
  customerOptions: Customer[];
}) {
  const [items, setItems] = useState(initialPage.items);
  const [pagination, setPagination] = useState<Pagination | null>(
    initialPage.pagination,
  );
  const [search, setSearch] = useState("");
  const [customerFilter, setCustomerFilter] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<KontrakPayung | null>(null);
  const [deletingItem, setDeletingItem] = useState<KontrakPayung | null>(null);
  const [deleting, setDeleting] = useState(false);

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function fetchPage(overrides: {
    search?: string;
    customerId?: number | null;
  }) {
    const nextSearch = overrides.search ?? search;
    const nextCustomerId =
      overrides.customerId !== undefined ? overrides.customerId : customerFilter;

    const query = new URLSearchParams();
    if (nextSearch) query.set("search", nextSearch);
    if (nextCustomerId) query.set("customer_id", String(nextCustomerId));
    query.set("page", "1");
    query.set("limit", "100");

    setLoading(true);
    try {
      const res = await fetch(
        `/api/proxy/business/kontrak-payung?${query.toString()}`,
        { cache: "no-store" },
      );
      const body: ApiResponse<KontrakPayung[]> = await res.json();
      if (!res.ok || !body.success) {
        throw new Error(body.message || "Gagal memuat daftar kontrak payung");
      }
      setItems(body.data ?? []);
      setPagination(body.meta.pagination ?? null);
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Gagal memuat daftar kontrak payung",
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

  function handleCustomerFilterChange(value: number | null) {
    setCustomerFilter(value);
    fetchPage({ customerId: value });
  }

  function openAdd() {
    setEditingItem(null);
    setDialogOpen(true);
  }

  function openEdit(item: KontrakPayung) {
    setEditingItem(item);
    setDialogOpen(true);
  }

  function handleSaved(saved: KontrakPayung) {
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
        `/api/proxy/business/kontrak-payung/${deletingItem.id}`,
        { method: "DELETE" },
      );
      const body: ApiResponse<null> = await res.json();
      if (!res.ok || !body.success) {
        toast.error(body.message || "Gagal menghapus kontrak payung");
        return;
      }
      setItems((prev) => prev.filter((it) => it.id !== deletingItem.id));
      toast.success("Kontrak payung berhasil dihapus");
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
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Kontrak Payung</h1>
          <Button onClick={openAdd}>
            <PlusIcon className="size-4" />
            Tambah Data
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground text-sm">Filter:</span>
          <FilterDropdown
            value={customerFilter !== null ? String(customerFilter) : ""}
            fallbackLabel="Semua Customer"
            options={[
              { value: "", label: "Semua Customer" },
              ...customerOptions.map((c) => ({
                value: String(c.id),
                label: c.nama,
              })),
            ]}
            onChange={(v) => handleCustomerFilterChange(v ? Number(v) : null)}
          />
          <div className="relative">
            <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
            <Input
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Cari kontrak..."
              className="w-48 pl-8"
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
              <th className="px-4 py-3 text-xs font-semibold">NO</th>
              <th className="px-4 py-3 text-xs font-semibold">NO KONTRAK</th>
              <th className="px-4 py-3 text-xs font-semibold">
                NAMA KONTRAK
              </th>
              <th className="px-4 py-3 text-xs font-semibold">CUSTOMER</th>
              <th className="px-4 py-3 text-xs font-semibold">
                TGL KONTRAK
              </th>
              <th className="px-4 py-3 text-xs font-semibold">PERIODE</th>
              <th className="px-4 py-3 text-xs font-semibold">STATUS</th>
              <th className="px-4 py-3 text-right text-xs font-semibold">
                AKSI
              </th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="text-muted-foreground p-6 text-center text-sm"
                >
                  Belum ada kontrak payung.
                </td>
              </tr>
            ) : (
              items.map((item, index) => {
                const berlaku = isBerlaku(item.tanggalSelesai);
                return (
                  <tr key={item.id} className="border-b last:border-b-0">
                    <td className="text-muted-foreground px-4 py-3 align-top">
                      {index + 1}
                    </td>
                    <td className="px-4 py-3 align-top font-mono font-medium">
                      {item.noKontrakPayung}
                    </td>
                    <td className="px-4 py-3 align-top">
                      {item.namaKontrak}
                    </td>
                    <td className="text-muted-foreground px-4 py-3 align-top">
                      {item.customerNama ?? "—"}
                    </td>
                    <td className="text-muted-foreground px-4 py-3 align-top whitespace-nowrap">
                      {formatTanggal(item.tanggalKontrak)}
                    </td>
                    <td className="text-muted-foreground px-4 py-3 align-top whitespace-nowrap">
                      {formatTanggal(item.tanggalMulai)} —{" "}
                      {formatTanggal(item.tanggalSelesai)}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <Badge variant={berlaku ? "default" : "outline"}>
                        {berlaku ? "Berlaku" : "Kedaluwarsa"}
                      </Badge>
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
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {items.length > 0 && pagination && totalItems > items.length && (
        <p className="text-muted-foreground text-sm">
          Menampilkan {items.length} dari {totalItems} kontrak payung. Gunakan
          pencarian atau filter untuk mempersempit hasil.
        </p>
      )}

      <KontrakPayungFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editingItem}
        customerOptions={customerOptions}
        onSaved={handleSaved}
      />

      <Dialog
        open={deletingItem !== null}
        onOpenChange={(open) => !open && setDeletingItem(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-primary-foreground">
              Hapus Kontrak Payung
            </DialogTitle>
          </DialogHeader>
          <DialogBody>
            <p className="text-sm">
              Yakin ingin menghapus kontrak{" "}
              <span className="font-semibold">
                {deletingItem?.noKontrakPayung}
              </span>
              ? Kontrak yang masih dirujuk proyek/kontrak biasa aktif tidak
              dapat dihapus.
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
