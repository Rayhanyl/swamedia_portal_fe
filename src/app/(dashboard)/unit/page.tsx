import { getUnitList, getUnitPage } from "@/lib/unit";
import { UnitTable } from "./_components/unit-table";

export default async function UnitPage() {
  const [page, allUnits] = await Promise.all([getUnitPage(), getUnitList()]);

  return (
    <div className="space-y-4 p-6">
      <UnitTable initialPage={page} allUnits={allUnits} />
    </div>
  );
}
