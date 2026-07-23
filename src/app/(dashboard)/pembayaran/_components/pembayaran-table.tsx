"use client";

import { useRef, useState } from "react";
import {
  CheckIcon,
  ChevronDownIcon,
  Loader2Icon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  Trash2Icon,
  XIcon,
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
import {
  APPROVAL_STATUS_BADGE_VARIANT,
  APPROVAL_STATUS_LABEL,
  APPROVAL_STATUS_VALUES,
  canApproveOrReject,
  canEditApproval,
  type ApprovalStatus,
} from "@/lib/approval-status";
import type { KategoriFinansialKeluar } from "@/lib/kategori-finansial-keluar";
import type { Pembayaran, PembayaranPage } from "@/lib/pembayaran";
import type { ProyekDropdownItem } from "@/lib/proyek";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast-manager";
import type { ApiResponse, Pagination } from "@/types/api";
import { PembayaranApprovalDialog } from "./pembayaran-approval-dialog";
import { PembayaranFormDialog } from "./pembayaran-form-dialog";

function formatRupiah(value: number) {
  return `Rp ${new Intl.NumberFormat("id-ID").format(value)}`;
}

function formatTanggal(iso: string | null) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

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

export function PembayaranTable({
  initialPage,
  proyekOptions,
  kategoriOptions,
}: {
  initialPage: PembayaranPage;
  proyekOptions: ProyekDropdownItem[];
  kategoriOptions: KategoriFinansialKeluar[];
}) {
  const [items, setItems] = useState(initialPage.items);
  const [pagination, setPagination] = useState<Pagination | null>(
    initialPage.pagination,
  );
  const [search, setSearch] = useState("");
  const [proyekFilter, setProyekFilter] = useState<number | null>(null);
  const [kategoriFilter, setKategoriFilter] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<ApprovalStatus | null>(
    null,
  );
  const [loading, setLoading] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Pembayaran | null>(null);
  const [deletingItem, setDeletingItem] = useState<Pembayaran | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [approvalMode, setApprovalMode] = useState<"approve" | "reject" | null>(
    null,
  );
  const [approvalItem, setApprovalItem] = useState<Pembayaran | null>(null);

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function fetchPage(overrides: {
    search?: string;
    proyekId?: number | null;
    kategoriId?: number | null;
    status?: ApprovalStatus | null;
  }) {
    const nextSearch = overrides.search ?? search;
    const nextProyekId =
      overrides.proyekId !== undefined ? overrides.proyekId : proyekFilter;
    const nextKategoriId =
      overrides.kategoriId !== undefined
        ? overrides.kategoriId
        : kategoriFilter;
    const nextStatus =
      overrides.status !== undefined ? overrides.status : statusFilter;

    const query = new URLSearchParams();
    if (nextSearch) query.set("search", nextSearch);
    if (nextProyekId) query.set("proyek_id", String(nextProyekId));
    if (nextKategoriId) query.set("kategori_id", String(nextKategoriId));
    if (nextStatus) query.set("status", nextStatus);
    query.set("page", "1");
    query.set("limit", "100");

    setLoading(true);
    try {
      const res = await fetch(
        `/api/proxy/finance/pembayaran?${query.toString()}`,
        { cache: "no-store" },
      );
      const body: ApiResponse<Pembayaran[]> = await res.json();
      if (!res.ok || !body.success) {
        throw new Error(body.message || "Gagal memuat daftar pembayaran");
      }
      setItems(body.data ?? []);
      setPagination(body.meta.pagination ?? null);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Gagal memuat daftar pembayaran",
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

  function handleProyekFilterChange(value: number | null) {
    setProyekFilter(value);
    fetchPage({ proyekId: value });
  }

  function handleKategoriFilterChange(value: number | null) {
    setKategoriFilter(value);
    fetchPage({ kategoriId: value });
  }

  function handleStatusFilterChange(value: ApprovalStatus | null) {
    setStatusFilter(value);
    fetchPage({ status: value });
  }

  function openAdd() {
    setEditingItem(null);
    setDialogOpen(true);
  }

  function openEdit(item: Pembayaran) {
    setEditingItem(item);
    setDialogOpen(true);
  }

  function handleSaved(saved: Pembayaran) {
    setItems((prev) =>
      prev.some((it) => it.id === saved.id)
        ? prev.map((it) => (it.id === saved.id ? saved : it))
        : [saved, ...prev],
    );
  }

  function handleApprovalDone(updated: Pembayaran) {
    setItems((prev) =>
      prev.map((it) => (it.id === updated.id ? updated : it)),
    );
  }

  async function handleDelete() {
    if (!deletingItem) return;
    setDeleting(true);
    try {
      const res = await fetch(
        `/api/proxy/finance/pembayaran/${deletingItem.id}`,
        { method: "DELETE" },
      );
      const body: ApiResponse<null> = await res.json();
      if (!res.ok || !body.success) {
        toast.error(body.message || "Gagal menghapus pembayaran");
        return;
      }
      setItems((prev) => prev.filter((it) => it.id !== deletingItem.id));
      toast.success("Pembayaran berhasil dihapus");
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
          <h1 className="text-2xl font-bold">Pembayaran</h1>
          <Button onClick={openAdd}>
            <PlusIcon className="size-4" />
            Ajukan Pembayaran
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground text-sm">Filter:</span>
          <FilterDropdown
            value={proyekFilter !== null ? String(proyekFilter) : ""}
            fallbackLabel="Semua Proyek"
            options={[
              { value: "", label: "Semua Proyek" },
              ...proyekOptions.map((p) => ({
                value: String(p.id),
                label: p.kodeProyek,
              })),
            ]}
            onChange={(v) => handleProyekFilterChange(v ? Number(v) : null)}
          />
          <FilterDropdown
            value={kategoriFilter !== null ? String(kategoriFilter) : ""}
            fallbackLabel="Semua Kategori"
            options={[
              { value: "", label: "Semua Kategori" },
              ...kategoriOptions.map((k) => ({
                value: String(k.id),
                label: k.nama,
              })),
            ]}
            onChange={(v) => handleKategoriFilterChange(v ? Number(v) : null)}
          />
          <FilterDropdown
            value={statusFilter ?? ""}
            fallbackLabel="Semua Status"
            options={[
              { value: "", label: "Semua Status" },
              ...APPROVAL_STATUS_VALUES.map((s) => ({
                value: s,
                label: APPROVAL_STATUS_LABEL[s],
              })),
            ]}
            onChange={(v) =>
              handleStatusFilterChange((v || null) as ApprovalStatus | null)
            }
          />
          <div className="relative">
            <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
            <Input
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Cari keterangan..."
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
              <th className="px-4 py-3 text-xs font-semibold">PROYEK</th>
              <th className="px-4 py-3 text-xs font-semibold">KATEGORI</th>
              <th className="px-4 py-3 text-right text-xs font-semibold">
                NILAI
              </th>
              <th className="px-4 py-3 text-xs font-semibold">
                TGL PENGAJUAN
              </th>
              <th className="px-4 py-3 text-xs font-semibold">
                TGL REALISASI
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
                  colSpan={8}
                  className="text-muted-foreground p-6 text-center text-sm"
                >
                  Belum ada pembayaran.
                </td>
              </tr>
            ) : (
              items.map((item, index) => (
                <tr key={item.id} className="border-b last:border-b-0">
                  <td className="text-muted-foreground px-4 py-3 align-top">
                    {index + 1}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-mono font-medium">
                        {item.proyekKode ?? "—"}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {item.proyekNama ?? "—"}
                      </span>
                    </div>
                  </td>
                  <td className="text-muted-foreground px-4 py-3 align-top">
                    {item.kategoriNama ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-right align-top font-medium whitespace-nowrap">
                    {formatRupiah(item.nilai)}
                  </td>
                  <td className="text-muted-foreground px-4 py-3 align-top whitespace-nowrap">
                    {formatTanggal(item.tanggalPengajuan)}
                  </td>
                  <td className="text-muted-foreground px-4 py-3 align-top whitespace-nowrap">
                    {formatTanggal(item.tanggalRealisasi)}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <Badge variant={APPROVAL_STATUS_BADGE_VARIANT[item.status]}>
                      {APPROVAL_STATUS_LABEL[item.status]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right align-top">
                    <div className="flex items-center justify-end gap-1.5">
                      {canApproveOrReject(item.status) && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setApprovalItem(item);
                              setApprovalMode("approve");
                            }}
                            title="Setujui"
                            className="border-input flex size-8 items-center justify-center rounded-md border text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950"
                          >
                            <CheckIcon className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setApprovalItem(item);
                              setApprovalMode("reject");
                            }}
                            title="Tolak"
                            className="border-input text-destructive hover:bg-destructive/10 flex size-8 items-center justify-center rounded-md border"
                          >
                            <XIcon className="size-3.5" />
                          </button>
                        </>
                      )}
                      {canEditApproval(item.status) && (
                        <>
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
                        </>
                      )}
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
          Menampilkan {items.length} dari {totalItems} pembayaran. Gunakan
          pencarian atau filter untuk mempersempit hasil.
        </p>
      )}

      <PembayaranFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editingItem}
        proyekOptions={proyekOptions}
        kategoriOptions={kategoriOptions}
        onSaved={handleSaved}
      />

      <PembayaranApprovalDialog
        mode={approvalMode}
        item={approvalItem}
        onOpenChange={(open) => !open && setApprovalMode(null)}
        onDone={handleApprovalDone}
      />

      <Dialog
        open={deletingItem !== null}
        onOpenChange={(open) => !open && setDeletingItem(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-primary-foreground">
              Hapus Pembayaran
            </DialogTitle>
          </DialogHeader>
          <DialogBody>
            <p className="text-sm">
              Yakin ingin menghapus pengajuan pembayaran senilai{" "}
              <span className="font-semibold">
                {deletingItem && formatRupiah(deletingItem.nilai)}
              </span>
              ?
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
