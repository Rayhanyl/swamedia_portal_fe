import { getTargetSalesUnitPage } from "@/lib/target-sales-unit";
import { getUnitList } from "@/lib/unit";
import { TargetSalesUnitTable } from "./_components/target-sales-unit-table";

export default async function TargetSalesUnitPage() {
  const [page, units] = await Promise.all([
    getTargetSalesUnitPage(),
    getUnitList(),
  ]);

  return (
    <div className="space-y-4 p-6">
      <TargetSalesUnitTable initialPage={page} unitOptions={units} />
    </div>
  );
}
