import { getResourceTagPage } from "@/lib/resource-tags";
import { getUnitList } from "@/lib/unit";
import { ResourceTagTable } from "./_components/resource-tag-table";

export default async function ResourceTagsPage() {
  const [page, unitList] = await Promise.all([
    getResourceTagPage(),
    getUnitList(),
  ]);

  return (
    <div className="space-y-4 p-6">
      <ResourceTagTable initialPage={page} unitOptions={unitList} />
    </div>
  );
}
