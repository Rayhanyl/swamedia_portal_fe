import { getRoleList } from "@/lib/role";
import { RolePermissionManager } from "./_components/role-permission-manager";

export default async function RolePermissionPage() {
  const roles = await getRoleList();

  return (
    <div className="space-y-4 p-6">
      <RolePermissionManager initialRoles={roles} />
    </div>
  );
}
