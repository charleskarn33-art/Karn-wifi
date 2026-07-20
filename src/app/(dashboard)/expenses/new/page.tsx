import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { ExpenseForm } from "@/components/expenses/expense-form";

export const metadata: Metadata = { title: "New Expense" };

export default async function NewExpensePage() {
  const profile = await requireAuth();

  return (
    <div className="space-y-6 py-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight">New Expense</h2>
        <p className="text-sm text-muted mt-1">Log a business expense for manager and admin approval.</p>
      </div>
      <Card className="max-w-2xl">
        <ExpenseForm userId={profile.id} />
      </Card>
    </div>
  );
}
