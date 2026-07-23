"use client";

import { useMemo, useState } from "react";
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
import type { CashflowChartPoint } from "@/lib/cashflow";
import { tahunOptions } from "@/lib/laporan-unit";
import { toast } from "@/lib/toast-manager";
import { formatCompactNumber, formatRupiah } from "@/lib/utils";
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

// Chart cashflow 12 bulan (inflow vs outflow). Endpoint /chart hanya
// mengembalikan titik bulanan (tanpa total/posisi kas) — total di bawah
// dihitung ulang di client dari titik-titik tersebut, murni untuk ringkasan
// tampilan. Selalu 12 titik (Jan–Des), bulan tanpa data bernilai 0.
export function ChartCashflow({
  initialPoints,
  initialTahun,
}: {
  initialPoints: CashflowChartPoint[];
  initialTahun: number;
}) {
  const [points, setPoints] = useState(initialPoints);
  const [tahun, setTahun] = useState(initialTahun);
  const [loading, setLoading] = useState(false);

  const totals = useMemo(() => {
    const inflow = points.reduce((sum, p) => sum + p.inflow, 0);
    const outflow = points.reduce((sum, p) => sum + p.outflow, 0);
    return { inflow, outflow, net: inflow - outflow };
  }, [points]);

  async function fetchChart(nextTahun: number) {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/proxy/business/cashflow/chart?tahun=${nextTahun}`,
        { cache: "no-store" },
      );
      const body: ApiResponse<CashflowChartPoint[]> = await res.json();
      if (!res.ok || !body.success) {
        throw new Error(body.message || "Gagal memuat chart cashflow");
      }
      setPoints(body.data ?? []);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Gagal memuat chart cashflow",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Chart Cashflow</h1>
          <p className="text-muted-foreground text-sm">
            Arus kas bulanan seluruh perusahaan: inflow (pencairan) vs outflow
            (pembayaran + pengeluaran yang terealisasi).
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
              fetchChart(y);
            }}
          />
          {loading && (
            <Loader2Icon className="text-muted-foreground size-4 animate-spin" />
          )}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryCard
          label="Total Inflow"
          value={formatRupiah(totals.inflow)}
        />
        <SummaryCard
          label="Total Outflow"
          value={formatRupiah(totals.outflow)}
        />
        <SummaryCard label="Net" value={formatRupiah(totals.net)} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cashflow Bulanan — Tahun {tahun}</CardTitle>
        </CardHeader>
        <CardContent>
          {points.length === 0 ? (
            <p className="text-muted-foreground py-12 text-center text-sm">
              Belum ada data cashflow untuk tahun {tahun}.
            </p>
          ) : (
            <GroupedBarChart
              categories={points.map((p) => p.label)}
              series={[
                {
                  name: "Inflow",
                  colorClass: "fill-emerald-500",
                  swatchClass: "bg-emerald-500",
                  values: points.map((p) => p.inflow),
                },
                {
                  name: "Outflow",
                  colorClass: "fill-rose-500",
                  swatchClass: "bg-rose-500",
                  values: points.map((p) => p.outflow),
                },
              ]}
              formatValue={formatCompactNumber}
            />
          )}
        </CardContent>
      </Card>

      <p className="text-muted-foreground text-xs">
        Total di atas dihitung dari 12 titik bulanan pada chart. Untuk posisi
        kas terkini, lihat modul Saldo Awal Kas / laporan Cashflow lengkap.
      </p>
    </>
  );
}
