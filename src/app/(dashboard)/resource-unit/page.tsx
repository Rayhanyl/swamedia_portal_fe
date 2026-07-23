import { getKaryawanDropdown } from "@/lib/karyawan";
import { getResourceUnitPage } from "@/lib/resource-unit";
import { getUnitList } from "@/lib/unit";
import { ResourceUnitTable } from "./_components/resource-unit-table";

export default async function ResourceUnitPage() {
  const [page, unitList, leadOptions] = await Promise.all([
    getResourceUnitPage(),
    getUnitList(),
    getKaryawanDropdown(),
  ]);

  return (
    <div className="space-y-4 p-6">
      <ResourceUnitTable
        initialPage={page}
        unitOptions={unitList.filter((u) => u.status === "AKTIF")}
        leadOptions={leadOptions}
      />
    </div>
  );
}
