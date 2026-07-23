"use client";

import { useMemo, useState } from "react";
import { ChevronDownIcon, Loader2Icon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  pencapaianBadgeVariant,
  tahunOptions,
  TRIWULAN_LABEL,
  TRIWULAN_VALUES,
  type LaporanUnitTwRow,
  type Triwulan,
} from "@/lib/laporan-unit";
import { toast } from "@/lib/toast-manager";
import type { Unit } from "@/lib/unit";
import { cn, formatRupiah } from "@/lib/utils";
import type { ApiResponse } from "@/types/api";

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

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <Card size="sm">
      <CardContent>
        <p className="text-muted-foreground text-xs">{label}</p>
        <p className="mt-1 text-lg font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}

// Laporan revenue unit satu triwulan. Beda dari laporan lengkap: parameter
// `triwulan` WAJIB (endpoint /tw menolak 400 bila di luar 1..4), jadi selalu
// ada triwulan terpilih dan tidak ada opsi "semua triwulan".
export function RevenueUnitTwReport({
  initialRows,
  initialTahun,
  initialTriwulan,
  unitOptions,
}: {
  initialRows: LaporanUnitTwRow[];
  initialTahun: number;
  initialTriwulan: number;
  unitOptions: Unit[];
}) {
  const [rows, setRows] = useState(initialRows);
  const [tahun, setTahun] = useState(initialTahun);
  const [triwulan, setTriwulan] = useState(initialTriwulan);
  const [unitFilter, setUnitFilter] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const totals = useMemo(() => {
    const target = rows.reduce((sum, r) => sum + r.target, 0);
    const realisasi = rows.reduce((sum, r) => sum + r.realisasi, 0);
    const persen = target > 0 ? (realisasi / target) * 100 : 0;
    return { target, realisasi, persen };
  }, [rows]);

  async function fetchReport(overrides: {
    tahun?: number;
    triwulan?: number;
    unitId?: number | null;
  }) {
    const nextTahun = overrides.tahun ?? tahun;
    const nextTriwulan = overrides.triwulan ?? triwulan;
    const nextUnitId =
      overrides.unitId !== undefined ? overrides.unitId : unitFilter;

    const query = new URLSearchParams();
    query.set("triwulan", String(nextTriwulan));
    query.set("tahun", String(nextTahun));
    if (nextUnitId) query.set("unit_id", String(nextUnitId));

    setLoading(true);
    try {
      const res = await fetch(
        `/api/proxy/business/revenue-unit/tw?${query.toString()}`,
        { cache: "no-store" },
      );
      const body: ApiResponse<LaporanUnitTwRow[]> = await res.json();
      if (!res.ok || !body.success) {
        throw new Error(body.message || "Gagal memuat laporan revenue unit");
      }
      setRows(body.data ?? []);
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Gagal memuat laporan revenue unit",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Revenue Unit per TW</h1>
          <p className="text-muted-foreground text-sm">
            Target vs realisasi revenue per unit untuk satu triwulan terpilih.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground text-sm">Filter:</span>
          <FilterDropdown
            value={String(triwulan)}
            fallbackLabel="Triwulan"
            options={TRIWULAN_VALUES.map((tw) => ({
              value: String(tw),
              label: TRIWULAN_LABEL[tw as Triwulan],
            }))}
            onChange={(v) => {
              const tw = Number(v);
              setTriwulan(tw);
              fetchReport({ triwulan: tw });
            }}
          />
          <FilterDropdown
            value={String(tahun)}
            fallbackLabel="Tahun"
            options={tahunOptions().map((y) => ({
              value: String(y),
              label: `Tahun ${y}`,
            }))}
            onChange={(v) => {
              const y = Number(v);
              setTahun(y);
              fetchReport({ tahun: y });
            }}
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
            onChange={(v) => {
              const id = v ? Number(v) : null;
              setUnitFilter(id);
              fetchReport({ unitId: id });
            }}
          />
          {loading && (
            <Loader2Icon className="text-muted-foreground size-4 animate-spin" />
          )}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryCard
          label={`Total Target ${TRIWULAN_LABEL[triwulan as Triwulan]}`}
          value={formatRupiah(totals.target)}
        />
        <SummaryCard
          label="Total Realisasi"
          value={formatRupiah(totals.realisasi)}
        />
        <SummaryCard
          label="Pencapaian Keseluruhan"
          value={`${totals.persen.toFixed(2)}%`}
        />
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
              <th className="px-4 py-3 text-right text-xs font-semibold">
                TARGET
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold">
                REALISASI
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold">
                PENCAPAIAN
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="text-muted-foreground p-6 text-center text-sm"
                >
                  Belum ada data revenue unit untuk triwulan ini.
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr
                  key={`${row.unitId}-${row.tahun}-${row.triwulan}`}
                  className="border-b last:border-b-0"
                >
                  <td className="text-muted-foreground px-4 py-3">
                    {index + 1}
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {row.unitNama ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {formatRupiah(row.target)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {formatRupiah(row.realisasi)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Badge variant={pencapaianBadgeVariant(row.pencapaianPersen)}>
                      {row.pencapaianPersen.toFixed(2)}%
                    </Badge>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
