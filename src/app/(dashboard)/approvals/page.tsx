import type { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { ApprovalsInbox } from "@/components/approvals/approvals-inbox";

export const metadata: Metadata = { title: "Approvals" };

export default async function ApprovalsPage() {
  const profile = await requireRole("manager", "admin");

  return (
    <div className="space-y-6 py-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Approvals</h2>
        <p className="text-sm text-muted mt-1">Review and act on pending expense submissions.</p>
      </div>
      <ApprovalsInbox role={profile.role} />
    </div>
  );
}
