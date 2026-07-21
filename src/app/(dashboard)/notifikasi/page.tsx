import { getNotifikasi, getUnreadCount } from "@/lib/notifikasi";
import { NotifikasiList } from "./_components/notifikasi-list";

export default async function NotifikasiPage() {
  const [page, unreadCount] = await Promise.all([
    getNotifikasi({ page: 1 }),
    getUnreadCount(),
  ]);

  return (
    <div className="p-6">
      <NotifikasiList initialPage={page} initialUnreadCount={unreadCount} />
    </div>
  );
}
