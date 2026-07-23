import { getCashflowChart } from "@/lib/cashflow";
import { ChartCashflow } from "./_components/chart-cashflow";

export default async function ChartCashflowPage() {
  const tahun = new Date().getFullYear();
  const points = await getCashflowChart(tahun);

  return (
    <div className="space-y-4 p-6">
      <ChartCashflow initialPoints={points} initialTahun={tahun} />
    </div>
  );
}
