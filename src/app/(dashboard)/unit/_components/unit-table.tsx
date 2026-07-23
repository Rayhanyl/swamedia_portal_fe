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
import type { Unit, UnitPage, UnitStatus } from "@/lib/unit";
import type { ApiResponse, Pagination } from "@/types/api";
import { UnitFormDialog } from "./unit-form-dialog";

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

export function UnitTable({
  initialPage,
  allUnits,
}: {
  initialPage: UnitPage;
  allUnits: Unit[];
}) {
  const [items, setItems] = useState(initialPage.items);
  const [pagination, setPagination] = useState<Pagination | null>(
    initialPage.pagination,
  );
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<UnitStatus | null>(null);
  const [parentFilter, setParentFilter] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [deletingUnit, setDeletingUnit] = useState<Unit | null>(null);
  const [deleting, setDeleting] = useState(false);

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const unitById = new Map(allUnits.map((u) => [u.id, u.namaUnit]));

  async function fetchPage(overrides: {
    search?: string;
    status?: UnitStatus | null;
    parentId?: number | null;
  }) {
    const nextSearch = overrides.search ?? search;
    const nextStatus =
      overrides.status !== undefined ? overrides.status : statusFilter;
    const nextParentId =
      overrides.parentId !== undefined ? overrides.parentId : parentFilter;

    const query = new URLSearchParams();
    if (nextSearch) query.set("search", nextSearch);
    if (nextStatus) query.set("status", nextStatus);
    if (nextParentId) query.set("parent_id", String(nextParentId));
    query.set("page", "1");
    query.set("limit", "100");

    setLoading(true);
    try {
      const res = await fetch(`/api/proxy/master/units?${query.toString()}`, {
        cache: "no-store",
      });
      const body: ApiResponse<Unit[]> = await res.json();
      if (!res.ok || !body.success) {
        throw new Error(body.message || "Gagal memuat daftar unit");
      }
      setItems(body.data ?? []);
      setPagination(body.meta.pagination ?? null);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Gagal memuat daftar unit",
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

  function handleStatusFilterChange(value: UnitStatus | null) {
    setStatusFilter(value);
    fetchPage({ status: value });
  }

  function handleParentFilterChange(value: number | null) {
    setParentFilter(value);
    fetchPage({ parentId: value });
  }

  function openAdd() {
    setEditingUnit(null);
    setDialogOpen(true);
  }

  function openEdit(item: Unit) {
    setEditingUnit(item);
    setDialogOpen(true);
  }

  function handleSaved(saved: Unit) {
    setItems((prev) =>
      prev.some((it) => it.id === saved.id)
        ? prev.map((it) => (it.id === saved.id ? saved : it))
        : [saved, ...prev],
    );
  }

  async function handleDelete() {
    if (!deletingUnit) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/proxy/master/units/${deletingUnit.id}`, {
        method: "DELETE",
      });
      const body: ApiResponse<null> = await res.json();
      if (!res.ok || !body.success) {
        toast.error(body.message || "Gagal menghapus unit");
        return;
      }
      setItems((prev) => prev.filter((it) => it.id !== deletingUnit.id));
      toast.success("Unit berhasil dihapus");
      setDeletingUnit(null);
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
          <h1 className="text-2xl font-bold">Unit (Organisasi)</h1>
          <Button onClick={openAdd}>
            <PlusIcon className="size-4" />
            Tambah Data
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground text-sm">Filter:</span>
          <FilterDropdown
            value={parentFilter !== null ? String(parentFilter) : ""}
            fallbackLabel="Semua Unit Induk"
            options={[
              { value: "", label: "Semua Unit Induk" },
              ...allUnits.map((u) => ({
                value: String(u.id),
                label: u.namaUnit,
              })),
            ]}
            onChange={(v) => handleParentFilterChange(v ? Number(v) : null)}
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
              handleStatusFilterChange((v || null) as UnitStatus | null)
            }
          />
          <div className="relative">
            <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
            <Input
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Cari unit..."
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
              <th className="px-4 py-3 text-xs font-semibold">KODE</th>
              <th className="px-4 py-3 text-xs font-semibold">KODE NIK</th>
              <th className="px-4 py-3 text-xs font-semibold">NAMA UNIT</th>
              <th className="px-4 py-3 text-xs font-semibold">UNIT INDUK</th>
              <th className="px-4 py-3 text-xs font-semibold">TIPE</th>
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
                  Belum ada unit.
                </td>
              </tr>
            ) : (
              items.map((item, index) => (
                <tr key={item.id} className="border-b last:border-b-0">
                  <td className="text-muted-foreground px-4 py-3 align-top">
                    {index + 1}
                  </td>
                  <td className="px-4 py-3 align-top font-mono font-medium">
                    {item.kodeUnit}
                  </td>
                  <td className="text-muted-foreground px-4 py-3 align-top font-mono">
                    {item.kodeNik}
                  </td>
                  <td className="px-4 py-3 align-top">{item.namaUnit}</td>
                  <td className="text-muted-foreground px-4 py-3 align-top">
                    {(item.parentUnitId && unitById.get(item.parentUnitId)) ??
                      "—"}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                        item.tipeUnit === "STRUKTURAL"
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {item.tipeUnit === "STRUKTURAL"
                        ? "Struktural"
                        : "Operasional"}
                    </span>
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
                        onClick={() => setDeletingUnit(item)}
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
          Menampilkan {items.length} dari {totalItems} unit. Gunakan pencarian
          atau filter untuk mempersempit hasil.
        </p>
      )}

      <UnitFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editingUnit}
        allUnits={allUnits}
        onSaved={handleSaved}
      />

      <Dialog
        open={deletingUnit !== null}
        onOpenChange={(open) => !open && setDeletingUnit(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-primary-foreground">
              Hapus Unit
            </DialogTitle>
          </DialogHeader>
          <DialogBody>
            <p className="text-sm">
              Yakin ingin menghapus unit{" "}
              <span className="font-semibold">{deletingUnit?.namaUnit}</span>?
              Unit yang masih punya anak aktif atau dirujuk karyawan/proyek
              tidak dapat dihapus.
            </p>
          </DialogBody>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeletingUnit(null)}
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
