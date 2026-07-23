import { getAuditLogPage } from "@/lib/audit-log";
import { AuditLogTable } from "./_components/audit-log-table";

export default async function AuditLogPage() {
  const page = await getAuditLogPage();

  return (
    <div className="space-y-4 p-6">
      <AuditLogTable initialPage={page} />
    </div>
  );
}
