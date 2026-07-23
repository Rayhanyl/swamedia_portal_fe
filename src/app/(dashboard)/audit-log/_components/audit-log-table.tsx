"use client";

import { useRef, useState } from "react";
import { ChevronDownIcon, EyeIcon, Loader2Icon, SearchIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogBody,
  DialogContent,
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
import type { AuditLog, AuditLogAksi, AuditLogPage } from "@/lib/audit-log";
import type { ApiResponse, Pagination } from "@/types/api";

const AKSI_VALUES: AuditLogAksi[] = ["CREATE", "UPDATE", "DELETE"];

const AKSI_BADGE_VARIANT: Record<
  AuditLogAksi,
  "default" | "secondary" | "destructive"
> = {
  CREATE: "default",
  UPDATE: "secondary",
  DELETE: "destructive",
};

function formatWaktu(iso: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
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

function ChangeDetail({ item }: { item: AuditLog }) {
  const perubahan = item.perubahan;
  if (!perubahan) {
    return <p className="text-muted-foreground text-sm">Tidak ada data perubahan.</p>;
  }
  const hasOldNew = "old" in perubahan || "new" in perubahan;

  if (!hasOldNew) {
    return (
      <pre className="bg-muted overflow-x-auto rounded-lg p-3 text-xs">
        {JSON.stringify(perubahan, null, 2)}
      </pre>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-1.5">
        <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
          Sebelum
        </p>
        <pre className="bg-muted overflow-x-auto rounded-lg p-3 text-xs">
          {perubahan.old === undefined || perubahan.old === null
            ? "—"
            : JSON.stringify(perubahan.old, null, 2)}
        </pre>
      </div>
      <div className="space-y-1.5">
        <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
          Sesudah
        </p>
        <pre className="bg-muted overflow-x-auto rounded-lg p-3 text-xs">
          {perubahan.new === undefined || perubahan.new === null
            ? "—"
            : JSON.stringify(perubahan.new, null, 2)}
        </pre>
      </div>
    </div>
  );
}

export function AuditLogTable({ initialPage }: { initialPage: AuditLogPage }) {
  const [items, setItems] = useState(initialPage.items);
  const [pagination, setPagination] = useState<Pagination | null>(
    initialPage.pagination,
  );
  const [tableName, setTableName] = useState("");
  const [aktor, setAktor] = useState("");
  const [aksiFilter, setAksiFilter] = useState<AuditLogAksi | null>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [detailItem, setDetailItem] = useState<AuditLog | null>(null);

  const tableNameTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const aktorTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function fetchPage(overrides: {
    tableName?: string;
    aktor?: string;
    aksi?: AuditLogAksi | null;
    dateFrom?: string;
    dateTo?: string;
  }) {
    const nextTableName = overrides.tableName ?? tableName;
    const nextAktor = overrides.aktor ?? aktor;
    const nextAksi = overrides.aksi !== undefined ? overrides.aksi : aksiFilter;
    const nextDateFrom = overrides.dateFrom ?? dateFrom;
    const nextDateTo = overrides.dateTo ?? dateTo;

    const query = new URLSearchParams();
    if (nextTableName) query.set("table_name", nextTableName);
    if (nextAktor) query.set("aktor", nextAktor);
    if (nextAksi) query.set("aksi", nextAksi);
    if (nextDateFrom) query.set("date_from", nextDateFrom);
    if (nextDateTo) query.set("date_to", nextDateTo);
    query.set("page", "1");
    query.set("limit", "100");

    setLoading(true);
    try {
      const res = await fetch(`/api/proxy/audit-log?${query.toString()}`, {
        cache: "no-store",
      });
      const body: ApiResponse<AuditLog[]> = await res.json();
      if (!res.ok || !body.success) {
        throw new Error(body.message || "Gagal memuat audit log");
      }
      setItems(body.data ?? []);
      setPagination(body.meta.pagination ?? null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal memuat audit log");
    } finally {
      setLoading(false);
    }
  }

  function handleTableNameChange(value: string) {
    setTableName(value);
    if (tableNameTimer.current) clearTimeout(tableNameTimer.current);
    tableNameTimer.current = setTimeout(() => {
      fetchPage({ tableName: value });
    }, 400);
  }

  function handleAktorChange(value: string) {
    setAktor(value);
    if (aktorTimer.current) clearTimeout(aktorTimer.current);
    aktorTimer.current = setTimeout(() => {
      fetchPage({ aktor: value });
    }, 400);
  }

  function handleAksiFilterChange(value: AuditLogAksi | null) {
    setAksiFilter(value);
    fetchPage({ aksi: value });
  }

  function handleDateFromChange(value: string) {
    setDateFrom(value);
    fetchPage({ dateFrom: value });
  }

  function handleDateToChange(value: string) {
    setDateTo(value);
    fetchPage({ dateTo: value });
  }

  const totalItems = pagination?.totalItems ?? items.length;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Audit Log</h1>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground text-sm">Filter:</span>
          <FilterDropdown
            value={aksiFilter ?? ""}
            fallbackLabel="Semua Aksi"
            options={[
              { value: "", label: "Semua Aksi" },
              ...AKSI_VALUES.map((a) => ({ value: a, label: a })),
            ]}
            onChange={(v) => handleAksiFilterChange((v || null) as AuditLogAksi | null)}
          />
          <div className="relative">
            <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
            <Input
              value={tableName}
              onChange={(e) => handleTableNameChange(e.target.value)}
              placeholder="Nama tabel, mis. customer"
              className="w-44 pl-8"
            />
          </div>
          <div className="relative">
            <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
            <Input
              value={aktor}
              onChange={(e) => handleAktorChange(e.target.value)}
              placeholder="Cari aktor (email)..."
              className="w-48 pl-8"
            />
          </div>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => handleDateFromChange(e.target.value)}
            className="w-36"
          />
          <span className="text-muted-foreground text-sm">s/d</span>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => handleDateToChange(e.target.value)}
            className="w-36"
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
              <th className="px-4 py-3 text-xs font-semibold">WAKTU</th>
              <th className="px-4 py-3 text-xs font-semibold">TABEL</th>
              <th className="px-4 py-3 text-xs font-semibold">RECORD ID</th>
              <th className="px-4 py-3 text-xs font-semibold">AKSI</th>
              <th className="px-4 py-3 text-xs font-semibold">AKTOR</th>
              <th className="px-4 py-3 text-xs font-semibold">IP ADDRESS</th>
              <th className="px-4 py-3 text-right text-xs font-semibold">
                DETAIL
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
                  Tidak ada entri audit log.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="border-b last:border-b-0">
                  <td className="text-muted-foreground px-4 py-3 align-top whitespace-nowrap">
                    {formatWaktu(item.waktu)}
                  </td>
                  <td className="px-4 py-3 align-top font-mono text-xs">
                    {item.tableName}
                  </td>
                  <td className="text-muted-foreground px-4 py-3 align-top font-mono text-xs">
                    {item.recordId}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <Badge variant={AKSI_BADGE_VARIANT[item.aksi]}>
                      {item.aksi}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <span className="break-all">{item.aktor}</span>
                  </td>
                  <td className="text-muted-foreground px-4 py-3 align-top">
                    {item.ipAddress ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-right align-top">
                    <button
                      type="button"
                      onClick={() => setDetailItem(item)}
                      title="Lihat Detail"
                      className="border-input text-primary hover:bg-muted flex size-8 items-center justify-center rounded-md border"
                    >
                      <EyeIcon className="size-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {items.length > 0 && pagination && totalItems > items.length && (
        <p className="text-muted-foreground text-sm">
          Menampilkan {items.length} dari {totalItems} entri. Gunakan
          pencarian atau filter untuk mempersempit hasil.
        </p>
      )}

      <Dialog
        open={detailItem !== null}
        onOpenChange={(open) => !open && setDetailItem(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-primary-foreground">
              Detail Audit Log
            </DialogTitle>
          </DialogHeader>
          <DialogBody className="max-h-[70vh] overflow-y-auto">
            {detailItem && (
              <>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Tabel</p>
                    <p className="font-mono">{detailItem.tableName}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Record ID</p>
                    <p className="font-mono">{detailItem.recordId}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Aksi</p>
                    <Badge variant={AKSI_BADGE_VARIANT[detailItem.aksi]}>
                      {detailItem.aksi}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Waktu</p>
                    <p>{formatWaktu(detailItem.waktu)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Aktor</p>
                    <p className="break-all">{detailItem.aktor}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">IP Address</p>
                    <p>{detailItem.ipAddress ?? "—"}</p>
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-muted-foreground mb-1.5 text-xs font-semibold tracking-wide uppercase">
                    Perubahan
                  </p>
                  <ChangeDetail item={detailItem} />
                </div>
              </>
            )}
          </DialogBody>
        </DialogContent>
      </Dialog>
    </>
  );
}
