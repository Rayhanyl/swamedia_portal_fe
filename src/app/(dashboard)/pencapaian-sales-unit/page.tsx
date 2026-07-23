import { getSalesMatrixTwReport } from "@/lib/sales-matrix";
import { getUnitList } from "@/lib/unit";
import { PencapaianSalesUnitReport } from "./_components/pencapaian-sales-unit-report";

// Triwulan default = triwulan tempat bulan berjalan berada (mis. Jul → TW3).
function currentTriwulan(): number {
  return Math.floor(new Date().getMonth() / 3) + 1;
}

// Halaman ini adalah kembaran /revenue-unit-tw untuk sisi SALES: menampilkan
// pencapaian (target vs realisasi deal) per unit untuk satu triwulan, memakai
// endpoint /api/v1/business/sales-matrix/tw. Lihat catatan pemetaan menu di
// documentation/note/module/pencapaian-sales-unit.md §13.
export default async function PencapaianSalesUnitPage() {
  const tahun = new Date().getFullYear();
  const triwulan = currentTriwulan();
  const [rows, units] = await Promise.all([
    getSalesMatrixTwReport(triwulan, { tahun }),
    getUnitList(),
  ]);

  return (
    <div className="space-y-4 p-6">
      <PencapaianSalesUnitReport
        initialRows={rows}
        initialTahun={tahun}
        initialTriwulan={triwulan}
        unitOptions={units}
      />
    </div>
  );
}
