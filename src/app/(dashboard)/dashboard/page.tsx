import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { getDashboardSummary } from "@/lib/dashboard";
import { formatCompactNumber } from "@/lib/utils";

export default async function DashboardPage() {
  const summary = await getDashboardSummary();

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500">
          Ringkasan proyek &amp; revenue Anda.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total Proyek</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            {formatCompactNumber(summary.totalProyek)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Revenue Bulan Ini</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            {formatCompactNumber(summary.revenueBulanIni)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Proyek Sedang Dikerjakan</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            {formatCompactNumber(summary.proyekSedangDikerjakan)}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
