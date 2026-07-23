import { getJabatanList } from "@/lib/jabatan";
import { getKaryawanPage } from "@/lib/karyawan";
import { getUnitList } from "@/lib/unit";
import { KaryawanTable } from "./_components/karyawan-table";

export default async function KaryawanPage() {
  const [page, unitList, jabatanList] = await Promise.all([
    getKaryawanPage(),
    getUnitList(),
    getJabatanList(),
  ]);

  return (
    <div className="space-y-4 p-6">
      <KaryawanTable
        initialPage={page}
        unitOptions={unitList}
        jabatanOptions={jabatanList}
      />
    </div>
  );
}
