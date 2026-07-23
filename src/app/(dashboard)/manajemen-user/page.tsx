import { getRoleList } from "@/lib/role";
import { getUserPage } from "@/lib/manajemen-user";
import { ManajemenUserTable } from "./_components/manajemen-user-table";

export default async function ManajemenUserPage() {
  const [page, roles] = await Promise.all([getUserPage(), getRoleList()]);

  return (
    <div className="space-y-4 p-6">
      <ManajemenUserTable initialPage={page} roleOptions={roles} />
    </div>
  );
}
