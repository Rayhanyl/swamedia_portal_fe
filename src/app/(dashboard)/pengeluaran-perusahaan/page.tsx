import { getKategoriFinansialKeluarList } from "@/lib/kategori-finansial-keluar";
import { getPengeluaranPerusahaanPage } from "@/lib/pengeluaran-perusahaan";
import { getUnitList } from "@/lib/unit";
import { PengeluaranTable } from "./_components/pengeluaran-table";

export default async function PengeluaranPerusahaanPage() {
  const [page, unitList, kategoriOptions] = await Promise.all([
    getPengeluaranPerusahaanPage(),
    getUnitList(),
    getKategoriFinansialKeluarList(),
  ]);

  return (
    <div className="space-y-4 p-6">
      <PengeluaranTable
        initialPage={page}
        unitOptions={unitList.filter((u) => u.status === "AKTIF")}
        kategoriOptions={kategoriOptions}
      />
    </div>
  );
}
