import { getKonfigurasiList } from "@/lib/konfigurasi-sistem";
import { KonfigurasiTable } from "./_components/konfigurasi-table";

export default async function KonfigurasiSistemPage() {
  const items = await getKonfigurasiList();

  return (
    <div className="space-y-4 p-6">
      <KonfigurasiTable initialItems={items} />
    </div>
  );
}
