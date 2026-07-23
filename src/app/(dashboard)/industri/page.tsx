import { getIndustriPage } from "@/lib/industri";
import { IndustriTable } from "./_components/industri-table";

export default async function IndustriPage() {
  const page = await getIndustriPage();

  return (
    <div className="space-y-4 p-6">
      <IndustriTable initialPage={page} />
    </div>
  );
}
