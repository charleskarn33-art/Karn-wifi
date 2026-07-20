"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Wallet, Receipt, Inbox } from "lucide-react";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { DecisionActions } from "@/components/shared/decision-actions";
import { EmptyState } from "@/components/ui/empty-state";
import { TableSkeleton } from "@/components/ui/skeleton";
import { EXPENSE_CATEGORY_LABELS } from "@/lib/validations/expense";
import type { ExpenseWithRelations, IncomeWithRelations, UserRole } from "@/types/database";

type Tab = "income" | "expenses";

export function ApprovalsInbox({ role }: { role: UserRole }) {
  const [tab, setTab] = useState<Tab>("income");
  const [income, setIncome] = useState<IncomeWithRelations[]>([]);
  const [expenses, setExpenses] = useState<ExpenseWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);

    Promise.all([
      fetch("/api/income?status=submitted&pageSize=50").then((r) => r.json()),
      role === "admin"
        ? fetch("/api/expenses?pageSize=50").then((r) => r.json())
        : fetch("/api/expenses?status=submitted&pageSize=50").then((r) => r.json()),
    ]).then(([incomeJson, expenseJson]) => {
      if (!active) return;
      setIncome(incomeJson.data ?? []);
      const relevantExpenses = (expenseJson.data ?? []).filter((e: ExpenseWithRelations) =>
        role === "admin" ? e.status === "submitted" || e.status === "manager_approved" : e.status === "submitted",
      );
      setExpenses(relevantExpenses);
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [role, refreshKey]);

  const refetch = () => setRefreshKey((k) => k + 1);

  return (
    <div className="space-y-4">
      <div className="flex gap-1 rounded-xl bg-black/5 dark:bg-white/5 p-1 w-fit">
        <TabButton active={tab === "income"} onClick={() => setTab("income")} count={income.length}>
          <Wallet className="h-4 w-4" /> Income
        </TabButton>
        <TabButton active={tab === "expenses"} onClick={() => setTab("expenses")} count={expenses.length}>
          <Receipt className="h-4 w-4" /> Expenses
        </TabButton>
      </div>

      {loading ? (
        <TableSkeleton rows={4} />
      ) : tab === "income" ? (
        income.length === 0 ? (
          <EmptyState icon={Inbox} title="No income entries awaiting approval" />
        ) : (
          <div className="space-y-3">
            {income.map((entry) => (
              <div key={entry.id} className="glass-card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <Link href={`/income/${entry.id}`} className="font-medium hover:underline">
                    {entry.customer_name} — {entry.voucher_package}
                  </Link>
                  <p className="text-xs text-muted mt-0.5">
                    {formatCurrency(entry.amount)} · {formatDate(entry.entry_date)} · by{" "}
                    {entry.recorded_by_profile?.full_name ?? "Unknown"}
                  </p>
                </div>
                <DecisionActions
                  approveUrl={`/api/income/${entry.id}/approve`}
                  rejectUrl={`/api/income/${entry.id}/reject`}
                  size="sm"
                  onDone={refetch}
                />
              </div>
            ))}
          </div>
        )
      ) : expenses.length === 0 ? (
        <EmptyState icon={Inbox} title="No expenses awaiting approval" />
      ) : (
        <div className="space-y-3">
          {expenses.map((entry) => {
            const isManagerStage = entry.status === "submitted";
            // Admins hold full authority at any stage: approving a
            // still-"submitted" expense goes straight to final approval
            // (the DB trigger backfills the manager sign-off automatically)
            // instead of requiring a manager-approve click first.
            const useAdminApprove = role === "admin";
            return (
              <div key={entry.id} className="glass-card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <Link href={`/expenses/${entry.id}`} className="font-medium hover:underline">
                    {EXPENSE_CATEGORY_LABELS[entry.category]}
                  </Link>
                  <p className="text-xs text-muted mt-0.5">
                    {formatCurrency(entry.amount)} · {formatDate(entry.entry_date)} · by{" "}
                    {entry.requested_by_profile?.full_name ?? "Unknown"}
                    {!isManagerStage && " · manager-approved, needs final sign-off"}
                  </p>
                </div>
                <DecisionActions
                  approveUrl={`/api/expenses/${entry.id}/${useAdminApprove ? "admin-approve" : "manager-approve"}`}
                  rejectUrl={`/api/expenses/${entry.id}/reject`}
                  approveLabel={useAdminApprove ? "Approve (Final)" : "Approve"}
                  size="sm"
                  onDone={refetch}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  count,
  children,
}: {
  active: boolean;
  onClick: () => void;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors",
        active ? "bg-white dark:bg-white/15 shadow-sm text-foreground" : "text-muted hover:text-foreground",
      )}
    >
      {children}
      {count > 0 && (
        <span className="rounded-full bg-brand-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-brand-600 dark:text-brand-400">
          {count}
        </span>
      )}
    </button>
  );
}
