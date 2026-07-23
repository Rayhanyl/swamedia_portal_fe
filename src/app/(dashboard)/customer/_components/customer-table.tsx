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
import type { Customer, CustomerPage } from "@/lib/customer";
import {
  JENIS_CUSTOMER_LABEL,
  STATUS_PELUANG_BADGE_VARIANT,
  STATUS_PELUANG_LABEL,
  STATUS_PELUANG_VALUES,
  type StatusPeluang,
} from "@/lib/customer-status";
import type { Industri } from "@/lib/industri";
import type { KaryawanDropdownItem } from "@/lib/karyawan";
import type { ApiResponse, Pagination } from "@/types/api";
import { CustomerFormDialog } from "./customer-form-dialog";

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

export function CustomerTable({
  initialPage,
  industriOptions,
  amOptions,
}: {
  initialPage: CustomerPage;
  industriOptions: Industri[];
  amOptions: KaryawanDropdownItem[];
}) {
  const [items, setItems] = useState(initialPage.items);
  const [pagination, setPagination] = useState<Pagination | null>(
    initialPage.pagination,
  );
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusPeluang | null>(
    null,
  );
  const [industriFilter, setIndustriFilter] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(
    null,
  );
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const industriById = new Map(industriOptions.map((i) => [i.id, i.nama]));
  const amById = new Map(amOptions.map((a) => [a.id, a.nama]));

  async function fetchPage(overrides: {
    search?: string;
    status?: StatusPeluang | null;
    industriId?: number | null;
  }) {
    const nextSearch = overrides.search ?? search;
    const nextStatus =
      overrides.status !== undefined ? overrides.status : statusFilter;
    const nextIndustriId =
      overrides.industriId !== undefined
        ? overrides.industriId
        : industriFilter;

    const query = new URLSearchParams();
    if (nextSearch) query.set("search", nextSearch);
    if (nextStatus) query.set("status_peluang", nextStatus);
    if (nextIndustriId) query.set("industri_id", String(nextIndustriId));
    query.set("page", "1");
    query.set("limit", "100");

    setLoading(true);
    try {
      const res = await fetch(
        `/api/proxy/master/customers?${query.toString()}`,
        { cache: "no-store" },
      );
      const body: ApiResponse<Customer[]> = await res.json();
      if (!res.ok || !body.success) {
        throw new Error(body.message || "Gagal memuat daftar customer");
      }
      setItems(body.data ?? []);
      setPagination(body.meta.pagination ?? null);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Gagal memuat daftar customer",
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

  function handleStatusFilterChange(value: StatusPeluang | null) {
    setStatusFilter(value);
    fetchPage({ status: value });
  }

  function handleIndustriFilterChange(value: number | null) {
    setIndustriFilter(value);
    fetchPage({ industriId: value });
  }

  function openAdd() {
    setEditingCustomer(null);
    setDialogOpen(true);
  }

  function openEdit(item: Customer) {
    setEditingCustomer(item);
    setDialogOpen(true);
  }

  function handleSaved(saved: Customer) {
    setItems((prev) =>
      prev.some((it) => it.id === saved.id)
        ? prev.map((it) => (it.id === saved.id ? saved : it))
        : [saved, ...prev],
    );
  }

  async function handleDelete() {
    if (!deletingCustomer) return;
    setDeleting(true);
    try {
      const res = await fetch(
        `/api/proxy/master/customers/${deletingCustomer.id}`,
        { method: "DELETE" },
      );
      const body: ApiResponse<null> = await res.json();
      if (!res.ok || !body.success) {
        toast.error(body.message || "Gagal menghapus customer");
        return;
      }
      setItems((prev) => prev.filter((it) => it.id !== deletingCustomer.id));
      toast.success("Customer berhasil dihapus");
      setDeletingCustomer(null);
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
          <h1 className="text-2xl font-bold">Customer</h1>
          <Button onClick={openAdd}>
            <PlusIcon className="size-4" />
            Tambah Data
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground text-sm">Filter:</span>
          <FilterDropdown
            value={industriFilter !== null ? String(industriFilter) : ""}
            fallbackLabel="Semua Industri"
            options={[
              { value: "", label: "Semua Industri" },
              ...industriOptions.map((i) => ({
                value: String(i.id),
                label: i.nama,
              })),
            ]}
            onChange={(v) =>
              handleIndustriFilterChange(v ? Number(v) : null)
            }
          />
          <FilterDropdown
            value={statusFilter ?? ""}
            fallbackLabel="Semua Status"
            options={[
              { value: "", label: "Semua Status" },
              ...STATUS_PELUANG_VALUES.map((s) => ({
                value: s,
                label: STATUS_PELUANG_LABEL[s],
              })),
            ]}
            onChange={(v) =>
              handleStatusFilterChange((v || null) as StatusPeluang | null)
            }
          />
          <div className="relative">
            <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
            <Input
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Cari customer..."
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
              <th className="px-4 py-3 text-xs font-semibold">
                NAMA CUSTOMER
              </th>
              <th className="px-4 py-3 text-xs font-semibold">INDUSTRI</th>
              <th className="px-4 py-3 text-xs font-semibold">
                ACCOUNT MANAGER
              </th>
              <th className="px-4 py-3 text-xs font-semibold">
                JENIS CUSTOMER
              </th>
              <th className="px-4 py-3 text-xs font-semibold">
                STATUS PELUANG
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
                  colSpan={7}
                  className="text-muted-foreground p-6 text-center text-sm"
                >
                  Belum ada customer.
                </td>
              </tr>
            ) : (
              items.map((item, index) => (
                <tr key={item.id} className="border-b last:border-b-0">
                  <td className="text-muted-foreground px-4 py-3 align-top">
                    {index + 1}
                  </td>
                  <td className="px-4 py-3 align-top font-medium">
                    {item.nama}
                  </td>
                  <td className="text-muted-foreground px-4 py-3 align-top">
                    {(item.industriId && industriById.get(item.industriId)) ??
                      "—"}
                  </td>
                  <td className="text-muted-foreground px-4 py-3 align-top">
                    {(item.amId && amById.get(item.amId)) ?? "—"}
                  </td>
                  <td className="text-muted-foreground px-4 py-3 align-top">
                    {item.jenisCustomer
                      ? JENIS_CUSTOMER_LABEL[item.jenisCustomer]
                      : "—"}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <Badge variant={STATUS_PELUANG_BADGE_VARIANT[item.statusPeluang]}>
                      {STATUS_PELUANG_LABEL[item.statusPeluang]}
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
                        onClick={() => setDeletingCustomer(item)}
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
          Menampilkan {items.length} dari {totalItems} customer. Gunakan
          pencarian atau filter untuk mempersempit hasil.
        </p>
      )}

      <CustomerFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editingCustomer}
        industriOptions={industriOptions}
        amOptions={amOptions}
        onSaved={handleSaved}
      />

      <Dialog
        open={deletingCustomer !== null}
        onOpenChange={(open) => !open && setDeletingCustomer(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-primary-foreground">
              Hapus Customer
            </DialogTitle>
          </DialogHeader>
          <DialogBody>
            <p className="text-sm">
              Yakin ingin menghapus customer{" "}
              <span className="font-semibold">{deletingCustomer?.nama}</span>?
              Tindakan ini dapat dibatalkan oleh administrator sistem.
            </p>
          </DialogBody>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeletingCustomer(null)}
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
