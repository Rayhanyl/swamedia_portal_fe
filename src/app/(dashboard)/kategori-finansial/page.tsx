import { getKategoriFinansialKeluarPage } from "@/lib/kategori-finansial-keluar";
import { KategoriFinansialTable } from "./_components/kategori-finansial-table";

export default async function KategoriFinansialPage() {
  const page = await getKategoriFinansialKeluarPage({ limit: 100 });

  return (
    <div className="space-y-4 p-6">
      <KategoriFinansialTable initialPage={page} />
    </div>
  );
}
