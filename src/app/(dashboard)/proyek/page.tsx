import { getCustomerList } from "@/lib/customer";
import { getIndustriList } from "@/lib/industri";
import { getKaryawanDropdown } from "@/lib/karyawan";
import { getKontrakBiasaDropdown } from "@/lib/kontrak-biasa";
import { getProyekEligibleUnits, getProyekList } from "@/lib/proyek";
import { getUnitList } from "@/lib/unit";
import { ProyekTable } from "./_components/proyek-table";

export default async function ProyekPage() {
  const tahun = new Date().getFullYear();
  const [
    page,
    customerList,
    industriList,
    unitList,
    eligibleUnitOptions,
    picOptions,
    kontrakBiasaOptions,
  ] = await Promise.all([
    getProyekList({ tahun }),
    getCustomerList(),
    getIndustriList(),
    getUnitList(),
    getProyekEligibleUnits(),
    getKaryawanDropdown(),
    getKontrakBiasaDropdown(),
  ]);

  return (
    <div className="space-y-4 p-6">
      <ProyekTable
        initialPage={page}
        initialTahun={tahun}
        customerOptions={customerList}
        industriOptions={industriList}
        unitOptions={unitList.filter((u) => u.status === "AKTIF")}
        eligibleUnitOptions={eligibleUnitOptions}
        picOptions={picOptions}
        kontrakBiasaOptions={kontrakBiasaOptions}
      />
    </div>
  );
}
