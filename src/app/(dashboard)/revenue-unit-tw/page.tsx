import { getRevenueUnitTwReport } from "@/lib/revenue-unit";
import { getUnitList } from "@/lib/unit";
import { RevenueUnitTwReport } from "./_components/revenue-unit-tw-report";

// Triwulan default = triwulan tempat bulan berjalan berada (mis. Jul → TW3).
function currentTriwulan(): number {
  return Math.floor(new Date().getMonth() / 3) + 1;
}

export default async function RevenueUnitTwPage() {
  const tahun = new Date().getFullYear();
  const triwulan = currentTriwulan();
  const [rows, units] = await Promise.all([
    getRevenueUnitTwReport(triwulan, { tahun }),
    getUnitList(),
  ]);

  return (
    <div className="space-y-4 p-6">
      <RevenueUnitTwReport
        initialRows={rows}
        initialTahun={tahun}
        initialTriwulan={triwulan}
        unitOptions={units}
      />
    </div>
  );
}
