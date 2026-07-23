import { getTagPage } from "@/lib/tags";
import { getUnitList } from "@/lib/unit";
import { TagTable } from "./_components/tag-table";

export default async function TagsPage() {
  const [page, unitList] = await Promise.all([getTagPage(), getUnitList()]);

  return (
    <div className="space-y-4 p-6">
      <TagTable initialPage={page} unitOptions={unitList} />
    </div>
  );
}
