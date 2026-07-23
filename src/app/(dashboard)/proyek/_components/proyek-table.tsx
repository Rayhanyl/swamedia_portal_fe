"use client";

import Link from "next/link";
import { Fragment, useRef, useState } from "react";
import {
  ChevronDownIcon,
  EyeIcon,
  Loader2Icon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
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
import type { Industri } from "@/lib/industri";
import type { KaryawanDropdownItem } from "@/lib/karyawan";
import type { KontrakBiasaDropdownItem } from "@/lib/kontrak-biasa";
import type { Proyek, ProyekEligibleUnit, ProyekPage } from "@/lib/proyek";
import {
  PROYEK_STATUS_LABEL,
  PROYEK_STATUS_VALUES,
  getProyekStatusBucket,
  type ProyekStatus,
} from "@/lib/proyek-status";
import type { Unit } from "@/lib/unit";
import type { ApiResponse, Pagination } from "@/types/api";
import { ProyekFormDialog } from "./proyek-form-dialog";

const TAHUN_OPTIONS = Array.from(
  { length: 5 },
  (_, i) => new Date().getFullYear() - i,
);

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

export function ProyekTable({
  initialPage,
  initialTahun,
  customerOptions,
  industriOptions,
  unitOptions,
  eligibleUnitOptions,
  picOptions,
  kontrakBiasaOptions,
}: {
  initialPage: ProyekPage;
  initialTahun: number;
  customerOptions: Customer[];
  industriOptions: Industri[];
  unitOptions: Unit[];
  eligibleUnitOptions: ProyekEligibleUnit[];
  picOptions: KaryawanDropdownItem[];
  kontrakBiasaOptions: KontrakBiasaDropdownItem[];
}) {
  const [items, setItems] = useState(initialPage.items);
  const [pagination, setPagination] = useState<Pagination | null>(
    initialPage.pagination,
  );
  const [search, setSearch] = useState("");
  const [tahun, setTahun] = useState(initialTahun);
  const [unitFilter, setUnitFilter] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<ProyekStatus | null>(null);
  const [loading, setLoading] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProyek, setEditingProyek] = useState<Proyek | null>(null);

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function fetchPage(overrides: {
    search?: string;
    tahun?: number;
    unitId?: number | null;
    status?: ProyekStatus | null;
  }) {
    const nextSearch = overrides.search ?? search;
    const nextTahun = overrides.tahun ?? tahun;
    const nextUnitId =
      overrides.unitId !== undefined ? overrides.unitId : unitFilter;
    const nextStatus =
      overrides.status !== undefined ? overrides.status : statusFilter;

    const query = new URLSearchParams();
    if (nextSearch) query.set("search", nextSearch);
    query.set("tahun", String(nextTahun));
    if (nextUnitId) query.set("unit_id", String(nextUnitId));
    if (nextStatus) query.set("status", nextStatus);
    query.set("page", "1");
    query.set("limit", "100");

    setLoading(true);
    try {
      const res = await fetch(
        `/api/proxy/business/proyek?${query.toString()}`,
        {
          cache: "no-store",
        },
      );
      const body: ApiResponse<Proyek[]> = await res.json();
      if (!res.ok || !body.success) {
        throw new Error(body.message || "Gagal memuat daftar proyek");
      }
      setItems(body.data ?? []);
      setPagination(body.meta.pagination ?? null);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Gagal memuat daftar proyek",
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

  function handleTahunChange(value: number) {
    setTahun(value);
    fetchPage({ tahun: value });
  }

  function handleUnitFilterChange(value: number | null) {
    setUnitFilter(value);
    fetchPage({ unitId: value });
  }

  function handleStatusFilterChange(value: ProyekStatus | null) {
    setStatusFilter(value);
    fetchPage({ status: value });
  }

  function openAdd() {
    setEditingProyek(null);
    setDialogOpen(true);
  }

  function openEdit(item: Proyek) {
    setEditingProyek(item);
    setDialogOpen(true);
  }

  function handleSaved(saved: Proyek) {
    setItems((prev) =>
      prev.some((it) => it.id === saved.id)
        ? prev.map((it) => (it.id === saved.id ? saved : it))
        : [saved, ...prev],
    );
  }

  const groups: { unitId: number; unitNama: string; items: Proyek[] }[] = [];
  const groupIndex = new Map<number, number>();
  for (const item of items) {
    if (!groupIndex.has(item.unitId)) {
      groupIndex.set(item.unitId, groups.length);
      groups.push({
        unitId: item.unitId,
        unitNama: item.unitNama ?? "Tanpa Unit",
        items: [],
      });
    }
    groups[groupIndex.get(item.unitId)!].items.push(item);
  }

  const totalItems = pagination?.totalItems ?? items.length;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Daftar Sales Unit</h1>
          <Button onClick={openAdd} disabled={eligibleUnitOptions.length === 0}>
            <PlusIcon className="size-4" />
            Tambah Data
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground text-sm">Filter:</span>
          <FilterDropdown
            value={String(tahun)}
            fallbackLabel={String(tahun)}
            options={TAHUN_OPTIONS.map((y) => ({
              value: String(y),
              label: String(y),
            }))}
            onChange={(v) => handleTahunChange(Number(v))}
          />
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
              ...PROYEK_STATUS_VALUES.map((s) => ({
                value: s,
                label: PROYEK_STATUS_LABEL[s],
              })),
            ]}
            onChange={(v) =>
              handleStatusFilterChange((v || null) as ProyekStatus | null)
            }
          />
          <div className="relative">
            <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
            <Input
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Cari proyek..."
              className="w-48 pl-8"
            />
          </div>
          <div className="flex items-center overflow-hidden rounded-lg border">
            <button
              type="button"
              className="bg-primary text-primary-foreground px-3 py-1.5 text-sm font-medium"
            >
              Tabel
            </button>
            <button
              type="button"
              disabled
              title="Tampilan Kanban akan tersedia di pembaruan berikutnya"
              className="text-muted-foreground px-3 py-1.5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
            >
              Kanban
            </button>
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
              <th className="px-4 py-3 text-right text-xs font-semibold">
                PELUANG
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold">
                PROSES
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold">
                DEAL
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold">
                GAGAL
              </th>
              <th className="px-4 py-3 text-xs font-semibold">MULAI</th>
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
                  Belum ada proyek.
                </td>
              </tr>
            ) : (
              groups.map((group) => (
                <Fragment key={group.unitId}>
                  <tr className="bg-muted/50 border-b">
                    <td
                      colSpan={8}
                      className="text-muted-foreground px-4 py-2 text-xs font-bold tracking-wide uppercase"
                    >
                      {group.unitNama}
                    </td>
                  </tr>
                  {group.items.map((item, index) => {
                    const bucket = getProyekStatusBucket(item.status);
                    return (
                      <tr key={item.id} className="border-b last:border-b-0">
                        <td className="text-muted-foreground px-4 py-3 align-top">
                          {index + 1}
                        </td>
                        <td className="px-4 py-3 align-top">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-mono font-medium">
                              {item.kodeProyek}
                            </span>
                            <span className="text-muted-foreground text-xs">
                              {item.customerNama ?? "—"}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right align-top">
                          {bucket === "PELUANG" ? (
                            <span className="text-primary font-semibold whitespace-nowrap">
                              {formatRupiah(item.nilaiBersih)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right align-top">
                          {bucket === "PROSES" ? (
                            <span className="text-primary font-semibold whitespace-nowrap">
                              {formatRupiah(item.nilaiBersih)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right align-top">
                          {bucket === "DEAL" ? (
                            <span className="text-primary font-semibold whitespace-nowrap">
                              {formatRupiah(item.nilaiBersih)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right align-top">
                          {bucket === "GAGAL" ? (
                            <span className="text-destructive font-semibold whitespace-nowrap">
                              {formatRupiah(item.nilaiBersih)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="text-muted-foreground px-4 py-3 align-top whitespace-nowrap">
                          {formatTanggal(item.tanggalMulai)}
                        </td>
                        <td className="px-4 py-3 text-right align-top">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link
                              href={`/proyek/${item.id}`}
                              title="Lihat Detail"
                              className="border-input text-primary hover:bg-muted flex size-8 items-center justify-center rounded-md border"
                            >
                              <EyeIcon className="size-3.5" />
                            </Link>
                            <button
                              type="button"
                              onClick={() => openEdit(item)}
                              title="Edit"
                              className="border-input text-primary hover:bg-muted flex size-8 items-center justify-center rounded-md border"
                            >
                              <PencilIcon className="size-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>

      {items.length > 0 && pagination && totalItems > items.length && (
        <p className="text-muted-foreground text-sm">
          Menampilkan {items.length} dari {totalItems} proyek. Gunakan pencarian
          atau filter untuk mempersempit hasil.
        </p>
      )}

      <ProyekFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editingProyek}
        defaultTahun={tahun}
        customerOptions={customerOptions}
        industriOptions={industriOptions}
        eligibleUnitOptions={eligibleUnitOptions}
        picOptions={picOptions}
        kontrakBiasaOptions={kontrakBiasaOptions}
        onSaved={handleSaved}
      />
    </>
  );
}
