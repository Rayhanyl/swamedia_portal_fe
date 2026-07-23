"use client";

import { useState } from "react";
import { ChevronDownIcon, Loader2Icon } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GroupedBarChart } from "@/components/ui/grouped-bar-chart";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { tahunOptions, type LaporanUnitChartData } from "@/lib/laporan-unit";
import { toast } from "@/lib/toast-manager";
import type { Unit } from "@/lib/unit";
import { formatCompactNumber } from "@/lib/utils";
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

// Chart 4 titik triwulan (target vs realisasi revenue). Endpoint mengembalikan
// SATU objek {tahun, unitId, unitNama, points[]} — bukan array — dan
// unitId/unitNama null bila diagregasi lintas semua unit (unit_id tidak
// dikirim). Selalu 4 titik.
export function ChartRevenueUnit({
  initialChart,
  initialTahun,
  unitOptions,
}: {
  initialChart: LaporanUnitChartData | null;
  initialTahun: number;
  unitOptions: Unit[];
}) {
  const [chart, setChart] = useState(initialChart);
  const [tahun, setTahun] = useState(initialTahun);
  const [unitFilter, setUnitFilter] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  async function fetchChart(overrides: {
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
        `/api/proxy/business/revenue-unit/chart?${query.toString()}`,
        { cache: "no-store" },
      );
      const body: ApiResponse<LaporanUnitChartData> = await res.json();
      if (!res.ok || !body.success || !body.data) {
        throw new Error(body.message || "Gagal memuat chart revenue unit");
      }
      setChart(body.data);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Gagal memuat chart revenue unit",
      );
    } finally {
      setLoading(false);
    }
  }

  const points = chart?.points ?? [];
  const scopeLabel = chart?.unitNama ?? "Semua Unit (agregat)";

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Chart Revenue Unit</h1>
          <p className="text-muted-foreground text-sm">
            Target vs realisasi revenue per triwulan.
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
            onChange={(v) => {
              const y = Number(v);
              setTahun(y);
              fetchChart({ tahun: y });
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
              fetchChart({ unitId: id });
            }}
          />
          {loading && (
            <Loader2Icon className="text-muted-foreground size-4 animate-spin" />
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            Revenue {scopeLabel} — Tahun {tahun}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {points.length === 0 ? (
            <p className="text-muted-foreground py-12 text-center text-sm">
              Belum ada data revenue untuk tahun {tahun}.
            </p>
          ) : (
            <GroupedBarChart
              categories={points.map((p) => p.label)}
              series={[
                {
                  name: "Target",
                  colorClass: "fill-primary",
                  swatchClass: "bg-primary",
                  values: points.map((p) => p.target),
                },
                {
                  name: "Realisasi",
                  colorClass: "fill-emerald-500",
                  swatchClass: "bg-emerald-500",
                  values: points.map((p) => p.realisasi),
                },
              ]}
              formatValue={formatCompactNumber}
            />
          )}
        </CardContent>
      </Card>
    </>
  );
}
