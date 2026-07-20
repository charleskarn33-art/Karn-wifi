import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth";
import { ExpenseTable } from "@/components/expenses/expense-table";

export const metadata: Metadata = { title: "Expenses" };

export default async function ExpensesPage() {
  const profile = await requireAuth();

  return (
    <div className="space-y-6 py-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Expenses</h2>
        <p className="text-sm text-muted mt-1">Log business expenses and track their approval status.</p>
      </div>
      <ExpenseTable currentUserId={profile.id} role={profile.role} />
    </div>
  );
}
