import { getKategoriFinansialKeluarList } from "@/lib/kategori-finansial-keluar";
import { getPembayaranPage } from "@/lib/pembayaran";
import { getProyekDropdown } from "@/lib/proyek";
import { PembayaranTable } from "./_components/pembayaran-table";

export default async function PembayaranPage() {
  const [page, proyekOptions, kategoriOptions] = await Promise.all([
    getPembayaranPage(),
    getProyekDropdown(),
    getKategoriFinansialKeluarList(),
  ]);

  return (
    <div className="space-y-4 p-6">
      <PembayaranTable
        initialPage={page}
        proyekOptions={proyekOptions}
        kategoriOptions={kategoriOptions}
      />
    </div>
  );
}
