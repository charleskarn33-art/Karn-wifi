"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Inbox } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { DecisionActions } from "@/components/shared/decision-actions";
import { EmptyState } from "@/components/ui/empty-state";
import { TableSkeleton } from "@/components/ui/skeleton";
import { EXPENSE_CATEGORY_LABELS } from "@/lib/validations/expense";
import type { ExpenseWithRelations, UserRole } from "@/types/database";

// Income has no approval workflow (it's recorded and counted immediately),
// so this inbox only ever has expenses awaiting a manager/admin decision.
export function ApprovalsInbox({ role }: { role: UserRole }) {
  const [expenses, setExpenses] = useState<ExpenseWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);

    const endpoint =
      role === "admin" ? "/api/expenses?pageSize=50" : "/api/expenses?status=submitted&pageSize=50";

    fetch(endpoint)
      .then((r) => r.json())
      .then((expenseJson) => {
        if (!active) return;
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

  if (loading) return <TableSkeleton rows={4} />;

  if (expenses.length === 0) {
    return <EmptyState icon={Inbox} title="No expenses awaiting approval" />;
  }

  return (
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
  );
}
