import { getRevenueUnitReport } from "@/lib/revenue-unit";
import { getUnitList } from "@/lib/unit";
import { RevenueUnitReport } from "./_components/revenue-unit-report";

export default async function RevenueUnitPage() {
  const tahun = new Date().getFullYear();
  const [rows, units] = await Promise.all([
    getRevenueUnitReport({ tahun }),
    getUnitList(),
  ]);

  return (
    <div className="space-y-4 p-6">
      <RevenueUnitReport
        initialRows={rows}
        initialTahun={tahun}
        unitOptions={units}
      />
    </div>
  );
}
