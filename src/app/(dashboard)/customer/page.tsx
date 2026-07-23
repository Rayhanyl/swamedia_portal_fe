import { getCustomerPage } from "@/lib/customer";
import { getIndustriList } from "@/lib/industri";
import { getKaryawanDropdown } from "@/lib/karyawan";
import { CustomerTable } from "./_components/customer-table";

export default async function CustomerPage() {
  const [page, industriList, amOptions] = await Promise.all([
    getCustomerPage(),
    getIndustriList(),
    getKaryawanDropdown(),
  ]);

  return (
    <div className="space-y-4 p-6">
      <CustomerTable
        initialPage={page}
        industriOptions={industriList}
        amOptions={amOptions}
      />
    </div>
  );
}
