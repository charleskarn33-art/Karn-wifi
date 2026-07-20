import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { IncomeForm } from "@/components/income/income-form";

export const metadata: Metadata = { title: "New Income" };

export default async function NewIncomePage() {
  await requireAuth();

  return (
    <div className="space-y-6 py-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight">New Income Entry</h2>
        <p className="text-sm text-muted mt-1">Record a WiFi voucher sale or customer payment.</p>
      </div>
      <Card className="max-w-2xl">
        <IncomeForm />
      </Card>
    </div>
  );
}
