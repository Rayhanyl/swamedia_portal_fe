import { getRevenueUnitChart } from "@/lib/revenue-unit";
import { getUnitList } from "@/lib/unit";
import { ChartRevenueUnit } from "./_components/chart-revenue-unit";

export default async function ChartRevenueUnitPage() {
  const tahun = new Date().getFullYear();
  const [chart, units] = await Promise.all([
    getRevenueUnitChart({ tahun }),
    getUnitList(),
  ]);

  return (
    <div className="space-y-4 p-6">
      <ChartRevenueUnit
        initialChart={chart}
        initialTahun={tahun}
        unitOptions={units}
      />
    </div>
  );
}
