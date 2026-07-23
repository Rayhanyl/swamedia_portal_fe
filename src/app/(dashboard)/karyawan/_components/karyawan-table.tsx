"use client";

import { useRef, useState } from "react";
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
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
import type { Jabatan } from "@/lib/jabatan";
import type { Karyawan, KaryawanPage, KaryawanStatus } from "@/lib/karyawan";
import type { Unit } from "@/lib/unit";
import type { ApiResponse, Pagination } from "@/types/api";
import { KaryawanFormDialog } from "./karyawan-form-dialog";

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
      {/* min-w di sini SENGAJA lebih lebar dari lebar trigger — DropdownMenuContent
          bawaan memakai w-(--anchor-width) (selebar tombol trigger persis), yang
          membuat opsi Unit dengan nama panjang (mis. "Direktur Business
          Development & General Affair") terpaksa wrap berbaris-baris acak-acakan
          saat trigger-nya cuma sependek "Semua Unit ⌄". max-h + overflow-y-auto
          sudah jadi bawaan komponen (max-h-(--available-height)), jadi daftar
          panjang tetap bisa di-scroll rapi. */}
      <DropdownMenuContent align="start" className="max-h-72 min-w-64">
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

function formatTanggal(iso: string | null) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

export function KaryawanTable({
  initialPage,
  unitOptions,
  jabatanOptions,
}: {
  initialPage: KaryawanPage;
  unitOptions: Unit[];
  jabatanOptions: Jabatan[];
}) {
  const [items, setItems] = useState(initialPage.items);
  const [pagination, setPagination] = useState<Pagination | null>(
    initialPage.pagination,
  );
  const [search, setSearch] = useState("");
  const [unitFilter, setUnitFilter] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<KaryawanStatus | null>(
    null,
  );
  const [loading, setLoading] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Karyawan | null>(null);
  const [deletingItem, setDeletingItem] = useState<Karyawan | null>(null);
  const [deleting, setDeleting] = useState(false);

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Penanda request terakhir — bukan debounce, tapi guard supaya response yang
  // telat datang (mis. dari perubahan filter sebelumnya) tidak menimpa hasil
  // yang lebih baru. Tanpa ini, pencarian bisa "kembali" ke data lama begitu
  // request lama akhirnya resolve setelah request baru, atau memicu toast
  // error hantu dari request lama yang gagal padahal request terbaru sukses.
  const fetchRef = useRef(0);

  const unitById = new Map(unitOptions.map((u) => [u.id, u.namaUnit]));
  const jabatanById = new Map(jabatanOptions.map((j) => [j.id, j]));

  function jabatanLabel(item: Karyawan) {
    const jabatanMaster = jabatanById.get(item.jabatan.id);
    if (jabatanMaster?.isKombinasiUnit) {
      const unitNama = unitById.get(item.unitId);
      if (unitNama) return `${item.jabatan.namaJabatan} ${unitNama}`;
    }
    return item.jabatan.namaJabatan;
  }

  async function fetchPage(overrides: {
    search?: string;
    unitId?: number | null;
    status?: KaryawanStatus | null;
    page?: number;
  }) {
    const nextSearch = overrides.search ?? search;
    const nextUnitId =
      overrides.unitId !== undefined ? overrides.unitId : unitFilter;
    const nextStatus =
      overrides.status !== undefined ? overrides.status : statusFilter;
    const nextPage = overrides.page ?? 1;

    const query = new URLSearchParams();
    if (nextSearch) query.set("search", nextSearch);
    if (nextUnitId) query.set("unit_id", String(nextUnitId));
    if (nextStatus) query.set("status", nextStatus);
    query.set("page", String(nextPage));
    query.set("limit", "20");

    const reqId = ++fetchRef.current;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/proxy/master/karyawan?${query.toString()}`,
        { cache: "no-store" },
      );
      const body: ApiResponse<Karyawan[]> = await res.json();
      // Request ini sudah "dikalahkan" oleh request yang lebih baru (mis. user
      // mengetik lagi atau ganti filter sebelum response ini datang) — abaikan
      // hasilnya, jangan timpa state yang sudah lebih mutakhir.
      if (reqId !== fetchRef.current) return;
      if (!res.ok || !body.success) {
        throw new Error(body.message || "Gagal memuat daftar karyawan");
      }
      setItems(body.data ?? []);
      setPagination(body.meta.pagination ?? null);
    } catch (err) {
      if (reqId !== fetchRef.current) return;
      toast.error(
        err instanceof Error ? err.message : "Gagal memuat daftar karyawan",
      );
    } finally {
      if (reqId === fetchRef.current) setLoading(false);
    }
  }

  function handleSearchChange(value: string) {
    setSearch(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      fetchPage({ search: value, page: 1 });
    }, 400);
  }

  function handleUnitFilterChange(value: number | null) {
    setUnitFilter(value);
    fetchPage({ unitId: value, page: 1 });
  }

  function handleStatusFilterChange(value: KaryawanStatus | null) {
    setStatusFilter(value);
    fetchPage({ status: value, page: 1 });
  }

  function openAdd() {
    setEditingItem(null);
    setDialogOpen(true);
  }

  function openEdit(item: Karyawan) {
    setEditingItem(item);
    setDialogOpen(true);
  }

  function handleSaved(saved: Karyawan) {
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
        `/api/proxy/master/karyawan/${deletingItem.id}`,
        { method: "DELETE" },
      );
      const body: ApiResponse<null> = await res.json();
      if (!res.ok || !body.success) {
        toast.error(body.message || "Gagal menghapus karyawan");
        return;
      }
      setItems((prev) => prev.filter((it) => it.id !== deletingItem.id));
      toast.success("Karyawan berhasil dihapus");
      setDeletingItem(null);
    } catch {
      toast.error("Tidak dapat menghubungi server");
    } finally {
      setDeleting(false);
    }
  }

  const totalItems = pagination?.totalItems ?? items.length;
  const currentPageNum = pagination?.page ?? 1;
  const totalPages = pagination?.totalPages ?? 1;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Karyawan</h1>
          <Button onClick={openAdd}>
            <PlusIcon className="size-4" />
            Tambah Data
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground text-sm">Filter:</span>
          <FilterDropdown
            value={unitFilter !== null ? String(unitFilter) : ""}
            fallbackLabel="Semua Unit"
            options={[
              { value: "", label: "Semua Unit" },
              ...unitOptions.map((u) => ({
                value: String(u.id),
                label: u.namaUnit,
              })),
            ]}
            onChange={(v) => handleUnitFilterChange(v ? Number(v) : null)}
          />
          <FilterDropdown
            value={statusFilter ?? ""}
            fallbackLabel="Semua Status"
            options={[
              { value: "", label: "Semua Status" },
              { value: "AKTIF", label: "Aktif" },
              { value: "TIDAK_AKTIF", label: "Tidak Aktif" },
            ]}
            onChange={(v) =>
              handleStatusFilterChange((v || null) as KaryawanStatus | null)
            }
          />
          <div className="relative">
            <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
            <Input
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Cari NIK/nama..."
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
              <th className="px-4 py-3 text-xs font-semibold">NIK</th>
              <th className="px-4 py-3 text-xs font-semibold">TIPE</th>
              <th className="px-4 py-3 text-xs font-semibold">NAMA</th>
              <th className="px-4 py-3 text-xs font-semibold">JABATAN</th>
              <th className="px-4 py-3 text-xs font-semibold">UNIT</th>
              <th className="px-4 py-3 text-xs font-semibold">EMAIL</th>
              <th className="px-4 py-3 text-xs font-semibold">NO HP</th>
              <th className="px-4 py-3 text-xs font-semibold">
                TANGGAL MASUK
              </th>
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
                  colSpan={11}
                  className="text-muted-foreground p-6 text-center text-sm"
                >
                  Belum ada karyawan.
                </td>
              </tr>
            ) : (
              items.map((item, index) => (
                <tr key={item.id} className="border-b last:border-b-0">
                  <td className="text-muted-foreground px-4 py-3 align-top">
                    {index + 1}
                  </td>
                  <td className="px-4 py-3 align-top font-mono text-xs">
                    {item.nik}
                  </td>
                  <td className="text-muted-foreground px-4 py-3 align-top whitespace-nowrap">
                    {item.tipeKaryawan === "P" ? "Tetap" : "Kontrak"}
                  </td>
                  <td className="px-4 py-3 align-top font-medium">
                    {item.nama}
                  </td>
                  <td className="text-muted-foreground px-4 py-3 align-top">
                    {jabatanLabel(item)}
                  </td>
                  <td className="text-muted-foreground px-4 py-3 align-top">
                    {unitById.get(item.unitId) ?? "—"}
                  </td>
                  <td className="text-muted-foreground px-4 py-3 align-top">
                    {item.email ?? "—"}
                  </td>
                  <td className="text-muted-foreground px-4 py-3 align-top whitespace-nowrap">
                    {item.noHp ?? "—"}
                  </td>
                  <td className="text-muted-foreground px-4 py-3 align-top whitespace-nowrap">
                    {formatTanggal(item.tanggalMasuk)}
                  </td>
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

      {items.length > 0 && (
        <div className="flex items-center justify-between gap-3">
          <p className="text-muted-foreground text-sm">
            Menampilkan {items.length} dari {totalItems} karyawan.
          </p>
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fetchPage({ page: currentPageNum - 1 })}
                disabled={currentPageNum <= 1 || loading}
                className="border-input hover:bg-muted flex size-8 items-center justify-center rounded-md border disabled:pointer-events-none disabled:opacity-40"
              >
                <ChevronLeftIcon className="size-3.5" />
              </button>
              <span className="text-muted-foreground text-sm whitespace-nowrap">
                Halaman {currentPageNum} dari {totalPages}
              </span>
              <button
                type="button"
                onClick={() => fetchPage({ page: currentPageNum + 1 })}
                disabled={currentPageNum >= totalPages || loading}
                className="border-input hover:bg-muted flex size-8 items-center justify-center rounded-md border disabled:pointer-events-none disabled:opacity-40"
              >
                <ChevronRightIcon className="size-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      <KaryawanFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editingItem}
        unitOptions={unitOptions}
        jabatanOptions={jabatanOptions}
        onSaved={handleSaved}
      />

      <Dialog
        open={deletingItem !== null}
        onOpenChange={(open) => !open && setDeletingItem(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-primary-foreground">
              Hapus Karyawan
            </DialogTitle>
          </DialogHeader>
          <DialogBody>
            <p className="text-sm">
              Yakin ingin menghapus karyawan{" "}
              <span className="font-semibold">{deletingItem?.nama}</span>?
              Karyawan yang masih menjadi PIC Sales/PMO proyek aktif atau
              team member tidak dapat dihapus.
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
