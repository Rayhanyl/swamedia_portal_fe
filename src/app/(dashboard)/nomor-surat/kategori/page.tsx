import { getKategoriSuratWithCount } from "@/lib/kategori-surat";
import { KategoriSuratTable } from "./_components/kategori-surat-table";

export default async function KategoriSuratPage() {
  const items = await getKategoriSuratWithCount();

  return (
    <div className="space-y-4 p-6">
      <KategoriSuratTable initialItems={items} />
    </div>
  );
}
