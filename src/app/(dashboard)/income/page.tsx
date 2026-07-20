import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth";
import { IncomeTable } from "@/components/income/income-table";

export const metadata: Metadata = { title: "Income" };

export default async function IncomePage() {
  const profile = await requireAuth();

  return (
    <div className="space-y-6 py-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Income</h2>
        <p className="text-sm text-muted mt-1">Record and track WiFi voucher sales and customer payments.</p>
      </div>
      <IncomeTable currentUserId={profile.id} role={profile.role} />
    </div>
  );
}
