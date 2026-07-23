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
import type { Contact, ContactPage } from "@/lib/contact";
import {
  TIPE_KONTAK_BADGE_VARIANT,
  TIPE_KONTAK_LABEL,
  TIPE_KONTAK_VALUES,
  type TipeKontak,
} from "@/lib/contact-status";
import type { Customer } from "@/lib/customer";
import type { ApiResponse, Pagination } from "@/types/api";
import { ContactFormDialog } from "./contact-form-dialog";

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

export function ContactTable({
  initialPage,
  customerOptions,
}: {
  initialPage: ContactPage;
  customerOptions: Customer[];
}) {
  const [items, setItems] = useState(initialPage.items);
  const [pagination, setPagination] = useState<Pagination | null>(
    initialPage.pagination,
  );
  const [search, setSearch] = useState("");
  const [customerFilter, setCustomerFilter] = useState<number | null>(null);
  const [tipeFilter, setTipeFilter] = useState<TipeKontak | null>(null);
  const [loading, setLoading] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [deletingContact, setDeletingContact] = useState<Contact | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const customerById = new Map(customerOptions.map((c) => [c.id, c.nama]));

  async function fetchPage(overrides: {
    search?: string;
    customerId?: number | null;
    tipeKontak?: TipeKontak | null;
  }) {
    const nextSearch = overrides.search ?? search;
    const nextCustomerId =
      overrides.customerId !== undefined ? overrides.customerId : customerFilter;
    const nextTipe =
      overrides.tipeKontak !== undefined ? overrides.tipeKontak : tipeFilter;

    const query = new URLSearchParams();
    if (nextSearch) query.set("search", nextSearch);
    if (nextCustomerId) query.set("customer_id", String(nextCustomerId));
    if (nextTipe) query.set("tipe_kontak", nextTipe);
    query.set("page", "1");
    query.set("limit", "100");

    setLoading(true);
    try {
      const res = await fetch(
        `/api/proxy/master/contacts?${query.toString()}`,
        { cache: "no-store" },
      );
      const body: ApiResponse<Contact[]> = await res.json();
      if (!res.ok || !body.success) {
        throw new Error(body.message || "Gagal memuat daftar kontak");
      }
      setItems(body.data ?? []);
      setPagination(body.meta.pagination ?? null);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Gagal memuat daftar kontak",
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

  function handleTipeFilterChange(value: TipeKontak | null) {
    setTipeFilter(value);
    fetchPage({ tipeKontak: value });
  }

  function openAdd() {
    setEditingContact(null);
    setDialogOpen(true);
  }

  function openEdit(item: Contact) {
    setEditingContact(item);
    setDialogOpen(true);
  }

  function handleSaved(saved: Contact) {
    setItems((prev) =>
      prev.some((it) => it.id === saved.id)
        ? prev.map((it) => (it.id === saved.id ? saved : it))
        : [saved, ...prev],
    );
  }

  async function handleDelete() {
    if (!deletingContact) return;
    setDeleting(true);
    try {
      const res = await fetch(
        `/api/proxy/master/contacts/${deletingContact.id}`,
        { method: "DELETE" },
      );
      const body: ApiResponse<null> = await res.json();
      if (!res.ok || !body.success) {
        toast.error(body.message || "Gagal menghapus kontak");
        return;
      }
      setItems((prev) => prev.filter((it) => it.id !== deletingContact.id));
      toast.success("Kontak berhasil dihapus");
      setDeletingContact(null);
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
          <h1 className="text-2xl font-bold">Contact</h1>
          <Button onClick={openAdd} disabled={customerOptions.length === 0}>
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
            onChange={(v) =>
              handleCustomerFilterChange(v ? Number(v) : null)
            }
          />
          <FilterDropdown
            value={tipeFilter ?? ""}
            fallbackLabel="Semua Tipe"
            options={[
              { value: "", label: "Semua Tipe" },
              ...TIPE_KONTAK_VALUES.map((t) => ({
                value: t,
                label: TIPE_KONTAK_LABEL[t],
              })),
            ]}
            onChange={(v) =>
              handleTipeFilterChange((v || null) as TipeKontak | null)
            }
          />
          <div className="relative">
            <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
            <Input
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Cari kontak..."
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
              <th className="px-4 py-3 text-xs font-semibold">NAMA KONTAK</th>
              <th className="px-4 py-3 text-xs font-semibold">CUSTOMER</th>
              <th className="px-4 py-3 text-xs font-semibold">JABATAN</th>
              <th className="px-4 py-3 text-xs font-semibold">EMAIL</th>
              <th className="px-4 py-3 text-xs font-semibold">TELEPON</th>
              <th className="px-4 py-3 text-xs font-semibold">TIPE</th>
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
                  Belum ada kontak.
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
                    {customerById.get(item.customerId) ?? "—"}
                  </td>
                  <td className="text-muted-foreground px-4 py-3 align-top">
                    {item.jabatan ?? "—"}
                  </td>
                  <td className="text-muted-foreground px-4 py-3 align-top">
                    {item.email ?? "—"}
                  </td>
                  <td className="text-muted-foreground px-4 py-3 align-top whitespace-nowrap">
                    {item.telepon ?? "—"}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <Badge variant={TIPE_KONTAK_BADGE_VARIANT[item.tipeKontak]}>
                      {TIPE_KONTAK_LABEL[item.tipeKontak]}
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
                        onClick={() => setDeletingContact(item)}
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
          Menampilkan {items.length} dari {totalItems} kontak. Gunakan
          pencarian atau filter untuk mempersempit hasil.
        </p>
      )}

      <ContactFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editingContact}
        defaultCustomerId={customerFilter}
        customerOptions={customerOptions}
        onSaved={handleSaved}
      />

      <Dialog
        open={deletingContact !== null}
        onOpenChange={(open) => !open && setDeletingContact(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-primary-foreground">
              Hapus Kontak
            </DialogTitle>
          </DialogHeader>
          <DialogBody>
            <p className="text-sm">
              Yakin ingin menghapus kontak{" "}
              <span className="font-semibold">{deletingContact?.nama}</span>?
            </p>
          </DialogBody>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeletingContact(null)}
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
