import type { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { AuditLogTable } from "@/components/audit/audit-log-table";

export const metadata: Metadata = { title: "Audit Log" };

export default async function AuditLogPage() {
  await requireRole("manager", "admin");

  return (
    <div className="space-y-6 py-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Audit Log</h2>
        <p className="text-sm text-muted mt-1">Every create, update, approval, rejection, and deletion — with who and when.</p>
      </div>
      <AuditLogTable />
    </div>
  );
}
