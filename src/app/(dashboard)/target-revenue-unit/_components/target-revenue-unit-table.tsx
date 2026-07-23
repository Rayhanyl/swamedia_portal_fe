"use client";

import { useRef, useState } from "react";
import {
  ChevronDownIcon,
  Loader2Icon,
  PencilIcon,
  PlusIcon,
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
import { tahunOptions } from "@/lib/laporan-unit";
import type {
  TargetRevenueUnit,
  TargetRevenueUnitPage,
} from "@/lib/target-revenue-unit";
import { toast } from "@/lib/toast-manager";
import type { Unit } from "@/lib/unit";
import { cn, formatRupiah } from "@/lib/utils";
import type { ApiResponse, Pagination } from "@/types/api";
import { TargetRevenueUnitFormDialog } from "./target-revenue-unit-form-dialog";

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

export function TargetRevenueUnitTable({
  initialPage,
  unitOptions,
}: {
  initialPage: TargetRevenueUnitPage;
  unitOptions: Unit[];
}) {
  const [items, setItems] = useState(initialPage.items);
  const [pagination, setPagination] = useState<Pagination | null>(
    initialPage.pagination,
  );
  const [unitFilter, setUnitFilter] = useState<number | null>(null);
  const [tahunFilter, setTahunFilter] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TargetRevenueUnit | null>(
    null,
  );
  const [deletingItem, setDeletingItem] = useState<TargetRevenueUnit | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);

  const fetchRef = useRef(0);

  async function fetchPage(overrides: {
    unitId?: number | null;
    tahun?: number | null;
  }) {
    const nextUnitId =
      overrides.unitId !== undefined ? overrides.unitId : unitFilter;
    const nextTahun =
      overrides.tahun !== undefined ? overrides.tahun : tahunFilter;

    const query = new URLSearchParams();
    if (nextUnitId) query.set("unit_id", String(nextUnitId));
    if (nextTahun) query.set("tahun", String(nextTahun));
    query.set("page", "1");
    query.set("limit", "100");

    const reqId = ++fetchRef.current;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/proxy/business/target-revenue-unit?${query.toString()}`,
        { cache: "no-store" },
      );
      const body: ApiResponse<TargetRevenueUnit[]> = await res.json();
      if (reqId !== fetchRef.current) return;
      if (!res.ok || !body.success) {
        throw new Error(body.message || "Gagal memuat target revenue unit");
      }
      setItems(body.data ?? []);
      setPagination(body.meta.pagination ?? null);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Gagal memuat target revenue unit",
      );
    } finally {
      if (reqId === fetchRef.current) setLoading(false);
    }
  }

  function openAdd() {
    setEditingItem(null);
    setDialogOpen(true);
  }

  function openEdit(item: TargetRevenueUnit) {
    setEditingItem(item);
    setDialogOpen(true);
  }

  function handleSaved(saved: TargetRevenueUnit) {
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
        `/api/proxy/business/target-revenue-unit/${deletingItem.id}`,
        { method: "DELETE" },
      );
      const body: ApiResponse<null> = await res.json();
      if (!res.ok || !body.success) {
        toast.error(body.message || "Gagal menghapus target revenue unit");
        return;
      }
      setItems((prev) => prev.filter((it) => it.id !== deletingItem.id));
      toast.success("Target revenue unit berhasil dihapus");
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
          <h1 className="text-2xl font-bold">Target Revenue Unit</h1>
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
            onChange={(v) => {
              const id = v ? Number(v) : null;
              setUnitFilter(id);
              fetchPage({ unitId: id });
            }}
          />
          <FilterDropdown
            value={tahunFilter !== null ? String(tahunFilter) : ""}
            fallbackLabel="Semua Tahun"
            options={[
              { value: "", label: "Semua Tahun" },
              ...tahunOptions().map((y) => ({
                value: String(y),
                label: `Tahun ${y}`,
              })),
            ]}
            onChange={(v) => {
              const y = v ? Number(v) : null;
              setTahunFilter(y);
              fetchPage({ tahun: y });
            }}
          />
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
              <th className="px-4 py-3 text-xs font-semibold">UNIT</th>
              <th className="px-4 py-3 text-xs font-semibold">TAHUN</th>
              <th className="px-4 py-3 text-right text-xs font-semibold">TW1</th>
              <th className="px-4 py-3 text-right text-xs font-semibold">TW2</th>
              <th className="px-4 py-3 text-right text-xs font-semibold">TW3</th>
              <th className="px-4 py-3 text-right text-xs font-semibold">TW4</th>
              <th className="px-4 py-3 text-right text-xs font-semibold">
                TOTAL
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold">
                AKSI
              </th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  className="text-muted-foreground p-6 text-center text-sm"
                >
                  Belum ada target revenue unit.
                </td>
              </tr>
            ) : (
              items.map((item, index) => (
                <tr key={item.id} className="border-b last:border-b-0">
                  <td className="text-muted-foreground px-4 py-3">
                    {index + 1}
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {item.unitNama ?? "—"}
                  </td>
                  <td className="px-4 py-3 tabular-nums">{item.tahun}</td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {formatRupiah(item.targetTw1)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {formatRupiah(item.targetTw2)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {formatRupiah(item.targetTw3)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {formatRupiah(item.targetTw4)}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums">
                    {formatRupiah(item.targetTotal)}
                  </td>
                  <td className="px-4 py-3 text-right">
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
          Menampilkan {items.length} dari {totalItems} target. Gunakan filter
          untuk mempersempit hasil.
        </p>
      )}

      <TargetRevenueUnitFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editingItem}
        unitOptions={unitOptions}
        onSaved={handleSaved}
      />

      <Dialog
        open={deletingItem !== null}
        onOpenChange={(open) => !open && setDeletingItem(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-primary-foreground">
              Hapus Target Revenue Unit
            </DialogTitle>
          </DialogHeader>
          <DialogBody>
            <p className="text-sm">
              Yakin ingin menghapus target{" "}
              <span className="font-semibold">
                {deletingItem?.unitNama ?? "unit ini"}
              </span>{" "}
              tahun {deletingItem?.tahun}?{" "}
              <span className="text-destructive font-medium">
                Modul ini memakai hapus permanen (bukan soft delete) — data
                yang dihapus tidak bisa dikembalikan.
              </span>
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
              {deleting ? "Menghapus..." : "Hapus Permanen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
