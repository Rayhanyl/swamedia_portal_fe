import { getSalesMatrixReport } from "@/lib/sales-matrix";
import { getUnitList } from "@/lib/unit";
import { SalesMatrixReport } from "./_components/sales-matrix-report";

export default async function SalesMatrixPage() {
  const tahun = new Date().getFullYear();
  const [rows, units] = await Promise.all([
    getSalesMatrixReport({ tahun }),
    getUnitList(),
  ]);

  return (
    <div className="space-y-4 p-6">
      <SalesMatrixReport
        initialRows={rows}
        initialTahun={tahun}
        unitOptions={units}
      />
    </div>
  );
}
