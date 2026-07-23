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
  type LaporanUnitRow,
} from "@/lib/laporan-unit";
import { toast } from "@/lib/toast-manager";
import type { Unit } from "@/lib/unit";
import { cn, formatCompactNumber, formatRupiah } from "@/lib/utils";
import type { ApiResponse } from "@/types/api";

// Kembaran RevenueUnitReport (bentuk data & tabel identik) — file terpisah
// mengikuti konvensi aplikasi yang tidak berbagi komponen lintas-route. Beda
// dari revenue unit: realisasi di sini berbasis DEAL (proyek DEAL_KONTRAK),
// bukan kas, dan endpoint proxy-nya /business/sales-matrix.
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

export function SalesMatrixReport({
  initialRows,
  initialTahun,
  unitOptions,
}: {
  initialRows: LaporanUnitRow[];
  initialTahun: number;
  unitOptions: Unit[];
}) {
  const [rows, setRows] = useState(initialRows);
  const [tahun, setTahun] = useState(initialTahun);
  const [unitFilter, setUnitFilter] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const totals = useMemo(() => {
    const target = rows.reduce((sum, r) => sum + r.targetTotal, 0);
    const realisasi = rows.reduce((sum, r) => sum + r.realisasiTotal, 0);
    const persen = target > 0 ? (realisasi / target) * 100 : 0;
    return { target, realisasi, persen };
  }, [rows]);

  async function fetchReport(overrides: {
    tahun?: number;
    unitId?: number | null;
  }) {
    const nextTahun = overrides.tahun ?? tahun;
    const nextUnitId =
      overrides.unitId !== undefined ? overrides.unitId : unitFilter;

    const query = new URLSearchParams();
    query.set("tahun", String(nextTahun));
    if (nextUnitId) query.set("unit_id", String(nextUnitId));

    setLoading(true);
    try {
      const res = await fetch(
        `/api/proxy/business/sales-matrix?${query.toString()}`,
        { cache: "no-store" },
      );
      const body: ApiResponse<LaporanUnitRow[]> = await res.json();
      if (!res.ok || !body.success) {
        throw new Error(body.message || "Gagal memuat laporan sales matrix");
      }
      setRows(body.data ?? []);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Gagal memuat laporan sales matrix",
      );
    } finally {
      setLoading(false);
    }
  }

  function handleTahunChange(value: number) {
    setTahun(value);
    fetchReport({ tahun: value });
  }

  function handleUnitChange(value: number | null) {
    setUnitFilter(value);
    fetchReport({ unitId: value });
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Sales Matrix</h1>
          <p className="text-muted-foreground text-sm">
            Target vs realisasi sales per unit (realisasi berbasis nilai bersih
            proyek yang sudah deal kontrak).
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground text-sm">Filter:</span>
          <FilterDropdown
            value={String(tahun)}
            fallbackLabel="Tahun"
            options={tahunOptions().map((y) => ({
              value: String(y),
              label: `Tahun ${y}`,
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
            onChange={(v) => handleUnitChange(v ? Number(v) : null)}
          />
          {loading && (
            <Loader2Icon className="text-muted-foreground size-4 animate-spin" />
          )}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryCard label="Total Target" value={formatRupiah(totals.target)} />
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
              <th className="px-4 py-3 text-xs font-semibold" rowSpan={2}>
                NO
              </th>
              <th className="px-4 py-3 text-xs font-semibold" rowSpan={2}>
                UNIT
              </th>
              <th
                className="border-primary-foreground/20 border-l px-4 py-2 text-center text-xs font-semibold"
                colSpan={5}
              >
                TARGET
              </th>
              <th
                className="border-primary-foreground/20 border-l px-4 py-2 text-center text-xs font-semibold"
                colSpan={5}
              >
                REALISASI
              </th>
              <th
                className="border-primary-foreground/20 border-l px-4 py-3 text-right text-xs font-semibold"
                rowSpan={2}
              >
                PENCAPAIAN
              </th>
            </tr>
            <tr className="bg-primary text-primary-foreground text-right">
              <th className="border-primary-foreground/20 border-l px-3 py-2 text-xs font-medium">
                TW1
              </th>
              <th className="px-3 py-2 text-xs font-medium">TW2</th>
              <th className="px-3 py-2 text-xs font-medium">TW3</th>
              <th className="px-3 py-2 text-xs font-medium">TW4</th>
              <th className="px-3 py-2 text-xs font-semibold">Total</th>
              <th className="border-primary-foreground/20 border-l px-3 py-2 text-xs font-medium">
                TW1
              </th>
              <th className="px-3 py-2 text-xs font-medium">TW2</th>
              <th className="px-3 py-2 text-xs font-medium">TW3</th>
              <th className="px-3 py-2 text-xs font-medium">TW4</th>
              <th className="px-3 py-2 text-xs font-semibold">Total</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={13}
                  className="text-muted-foreground p-6 text-center text-sm"
                >
                  Belum ada data sales matrix untuk tahun {tahun}.
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr
                  key={`${row.unitId}-${row.tahun}`}
                  className="border-b text-right last:border-b-0"
                >
                  <td className="text-muted-foreground px-4 py-3 text-left">
                    {index + 1}
                  </td>
                  <td className="px-4 py-3 text-left font-medium">
                    {row.unitNama ?? "—"}
                  </td>
                  <td className="border-muted border-l px-3 py-3 tabular-nums">
                    {formatCompactNumber(row.targetTw1)}
                  </td>
                  <td className="px-3 py-3 tabular-nums">
                    {formatCompactNumber(row.targetTw2)}
                  </td>
                  <td className="px-3 py-3 tabular-nums">
                    {formatCompactNumber(row.targetTw3)}
                  </td>
                  <td className="px-3 py-3 tabular-nums">
                    {formatCompactNumber(row.targetTw4)}
                  </td>
                  <td className="px-3 py-3 font-semibold tabular-nums">
                    {formatCompactNumber(row.targetTotal)}
                  </td>
                  <td className="border-muted border-l px-3 py-3 tabular-nums">
                    {formatCompactNumber(row.realisasiTw1)}
                  </td>
                  <td className="px-3 py-3 tabular-nums">
                    {formatCompactNumber(row.realisasiTw2)}
                  </td>
                  <td className="px-3 py-3 tabular-nums">
                    {formatCompactNumber(row.realisasiTw3)}
                  </td>
                  <td className="px-3 py-3 tabular-nums">
                    {formatCompactNumber(row.realisasiTw4)}
                  </td>
                  <td className="px-3 py-3 font-semibold tabular-nums">
                    {formatCompactNumber(row.realisasiTotal)}
                  </td>
                  <td className="border-muted border-l px-4 py-3">
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

      <p className="text-muted-foreground text-xs">
        Nilai per triwulan ditampilkan ringkas (mis. 500Jt / 2,5M). Kolom
        Pencapaian = realisasi total ÷ target total × 100.
      </p>
    </>
  );
}
