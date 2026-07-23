import { getCustomerList } from "@/lib/customer";
import { getKontrakPayungPage } from "@/lib/kontrak-payung";
import { KontrakPayungTable } from "./_components/kontrak-payung-table";

export default async function KontrakPayungPage() {
  const [page, customerOptions] = await Promise.all([
    getKontrakPayungPage(),
    getCustomerList(),
  ]);

  return (
    <div className="space-y-4 p-6">
      <KontrakPayungTable initialPage={page} customerOptions={customerOptions} />
    </div>
  );
}
