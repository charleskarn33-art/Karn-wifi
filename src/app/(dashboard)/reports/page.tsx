import type { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { ReportsView } from "@/components/reports/reports-view";

export const metadata: Metadata = { title: "Reports" };

export default async function ReportsPage() {
  await requireRole("manager", "admin");

  return (
    <div className="space-y-6 py-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Reports</h2>
        <p className="text-sm text-muted mt-1">Daily, weekly and monthly profit &amp; loss with export options.</p>
      </div>
      <ReportsView />
    </div>
  );
}
