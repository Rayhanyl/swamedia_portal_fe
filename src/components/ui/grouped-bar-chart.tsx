"use client";

import { useId } from "react";

import { cn } from "@/lib/utils";

// Grouped bar chart SVG murni — TIDAK ada library chart di proyek ini
// (cek package.json: tidak ada recharts/chart.js). Primitif presentasional
// ini tinggal di components/ui bersama badge/card karena bersifat umum
// (bukan komponen domain lintas-route), dipakai halaman Chart Revenue Unit
// dan Chart Cashflow. Responsif lewat viewBox + width 100%.

export interface BarSeries {
  name: string;
  // Kelas Tailwind fill-* untuk bar SVG (mis. "fill-primary").
  colorClass: string;
  // Kelas Tailwind bg-* untuk kotak legenda (mis. "bg-primary") — SVG pakai
  // fill-*, sedangkan <span> legenda butuh background, jadi dipisah.
  swatchClass: string;
  values: number[];
}

// "Nice" upper bound supaya garis grid & skala rapi (mis. 240Jt → 250Jt).
function niceCeil(value: number): number {
  if (value <= 0) return 1;
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
  const normalized = value / magnitude;
  let step: number;
  if (normalized <= 1) step = 1;
  else if (normalized <= 2) step = 2;
  else if (normalized <= 2.5) step = 2.5;
  else if (normalized <= 5) step = 5;
  else step = 10;
  return step * magnitude;
}

export function GroupedBarChart({
  categories,
  series,
  formatValue,
  gridLines = 4,
  className,
}: {
  categories: string[];
  series: BarSeries[];
  formatValue: (value: number) => string;
  gridLines?: number;
  className?: string;
}) {
  const titleId = useId();

  // Geometri viewBox (koordinat internal, di-scale responsif oleh browser).
  const width = 820;
  const height = 360;
  const padding = { top: 24, right: 16, bottom: 48, left: 64 };
  const plotW = width - padding.left - padding.right;
  const plotH = height - padding.top - padding.bottom;

  const allValues = series.flatMap((s) => s.values);
  const rawMax = Math.max(...allValues, 0);
  const maxValue = niceCeil(rawMax);

  const groupCount = categories.length;
  const groupWidth = plotW / Math.max(groupCount, 1);
  const barGap = 4;
  const groupInnerPad = groupWidth * 0.18;
  const barsPerGroup = series.length;
  const barWidth =
    (groupWidth - groupInnerPad * 2 - barGap * (barsPerGroup - 1)) /
    Math.max(barsPerGroup, 1);

  const yFor = (value: number) =>
    padding.top + plotH - (value / maxValue) * plotH;

  const gridValues = Array.from(
    { length: gridLines + 1 },
    (_, i) => (maxValue / gridLines) * i,
  );

  return (
    <div className={cn("w-full", className)}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full"
        role="img"
        aria-labelledby={titleId}
        preserveAspectRatio="xMidYMid meet"
      >
        <title id={titleId}>Grouped bar chart</title>

        {/* Garis grid + label sumbu Y */}
        {gridValues.map((gv, i) => {
          const y = yFor(gv);
          return (
            <g key={i}>
              <line
                x1={padding.left}
                x2={width - padding.right}
                y1={y}
                y2={y}
                className="stroke-border"
                strokeWidth={1}
              />
              <text
                x={padding.left - 8}
                y={y + 4}
                textAnchor="end"
                className="fill-muted-foreground text-[10px]"
              >
                {formatValue(gv)}
              </text>
            </g>
          );
        })}

        {/* Kelompok bar per kategori */}
        {categories.map((cat, gi) => {
          const groupX = padding.left + groupWidth * gi + groupInnerPad;
          return (
            <g key={cat}>
              {series.map((s, si) => {
                const value = s.values[gi] ?? 0;
                const barX = groupX + si * (barWidth + barGap);
                const barY = yFor(value);
                const barH = padding.top + plotH - barY;
                return (
                  <rect
                    key={s.name}
                    x={barX}
                    y={barY}
                    width={Math.max(barWidth, 0)}
                    height={Math.max(barH, 0)}
                    rx={2}
                    className={s.colorClass}
                  >
                    <title>{`${cat} — ${s.name}: ${formatValue(value)}`}</title>
                  </rect>
                );
              })}
              <text
                x={padding.left + groupWidth * gi + groupWidth / 2}
                y={height - padding.bottom + 18}
                textAnchor="middle"
                className="fill-muted-foreground text-[11px]"
              >
                {cat}
              </text>
            </g>
          );
        })}

        {/* Garis dasar sumbu X */}
        <line
          x1={padding.left}
          x2={width - padding.right}
          y1={padding.top + plotH}
          y2={padding.top + plotH}
          className="stroke-foreground/30"
          strokeWidth={1}
        />
      </svg>

      {/* Legenda */}
      <div className="mt-2 flex flex-wrap items-center justify-center gap-4">
        {series.map((s) => (
          <div key={s.name} className="flex items-center gap-1.5">
            <span className={cn("size-3 rounded-sm", s.swatchClass)} />
            <span className="text-muted-foreground text-xs">{s.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
