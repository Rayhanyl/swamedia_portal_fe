import { getTargetRevenueUnitPage } from "@/lib/target-revenue-unit";
import { getUnitList } from "@/lib/unit";
import { TargetRevenueUnitTable } from "./_components/target-revenue-unit-table";

export default async function TargetRevenueUnitPage() {
  const [page, units] = await Promise.all([
    getTargetRevenueUnitPage(),
    getUnitList(),
  ]);

  return (
    <div className="space-y-4 p-6">
      <TargetRevenueUnitTable initialPage={page} unitOptions={units} />
    </div>
  );
}
