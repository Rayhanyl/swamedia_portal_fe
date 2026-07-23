import { getDaftarSurat } from "@/lib/daftar-surat";
import { getKategoriSuratList } from "@/lib/kategori-surat";
import { getProyekDropdown } from "@/lib/proyek";
import { DaftarSuratTable } from "./_components/daftar-surat-table";

export default async function DaftarSuratPage() {
  const tahun = new Date().getFullYear();
  const [page, kategoriList, proyekOptions] = await Promise.all([
    getDaftarSurat({ tahun }),
    getKategoriSuratList(),
    getProyekDropdown(),
  ]);

  return (
    <div className="space-y-4 p-6">
      <DaftarSuratTable
        initialPage={page}
        initialTahun={tahun}
        kategoriOptions={kategoriList.filter((k) => k.status === "AKTIF")}
        proyekOptions={proyekOptions}
      />
    </div>
  );
}
