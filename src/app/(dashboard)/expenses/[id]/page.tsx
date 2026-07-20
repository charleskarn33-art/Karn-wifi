import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { ExpenseForm } from "@/components/expenses/expense-form";
import { ExpenseStatusBadge } from "@/components/ui/badge";
import { ReceiptViewButton } from "@/components/expenses/receipt-view-button";
import { ExpenseDecisionActionsWrapper } from "./decision-wrapper";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import { EXPENSE_CATEGORY_LABELS } from "@/lib/validations/expense";
import type { ExpenseWithRelations } from "@/types/database";

export const metadata: Metadata = { title: "Expense" };

export default async function ExpenseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await requireAuth();
  const supabase = await createClient();

  const { data } = await supabase
    .from("expenses")
    .select(
      "*, requested_by_profile:profiles!expenses_requested_by_fkey(id, full_name, email), manager_approved_by_profile:profiles!expenses_manager_approved_by_fkey(id, full_name, email), admin_approved_by_profile:profiles!expenses_admin_approved_by_fkey(id, full_name, email)",
    )
    .eq("id", id)
    .single();

  if (!data) notFound();

  const entry = data as ExpenseWithRelations;
  const isOwner = entry.requested_by === profile.id;
  const editable = isOwner && (entry.status === "draft" || entry.status === "rejected");
  const canManagerDecide = profile.role !== "staff" && entry.status === "submitted";
  const canAdminDecide = profile.role === "admin" && entry.status === "manager_approved";

  return (
    <div className="space-y-6 py-6 max-w-2xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight">{EXPENSE_CATEGORY_LABELS[entry.category]}</h2>
          <p className="text-sm text-muted mt-1">{formatCurrency(entry.amount)}</p>
        </div>
        <ExpenseStatusBadge status={entry.status} />
      </div>

      {editable ? (
        <Card>
          <ExpenseForm expense={entry} userId={profile.id} />
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <Detail label="Amount" value={formatCurrency(entry.amount)} />
            <Detail label="Date" value={formatDate(entry.entry_date)} />
            <Detail label="Requested by" value={entry.requested_by_profile?.full_name ?? "—"} />
            <Detail label="Submitted" value={formatDateTime(entry.submitted_at)} />
            {entry.manager_approved_by_profile && (
              <>
                <Detail label="Manager approved by" value={entry.manager_approved_by_profile.full_name} />
                <Detail label="Manager approved at" value={formatDateTime(entry.manager_approved_at)} />
              </>
            )}
            {entry.status === "approved" && (
              <>
                <Detail label="Admin approved by" value={entry.admin_approved_by_profile?.full_name ?? "—"} />
                <Detail label="Admin approved at" value={formatDateTime(entry.admin_approved_at)} />
              </>
            )}
            {entry.status === "rejected" && <Detail label="Rejection reason" value={entry.rejection_reason ?? "—"} full />}
            {entry.description && <Detail label="Description" value={entry.description} full />}
            {entry.receipt_url && (
              <div className="col-span-2">
                <dt className="text-xs text-muted uppercase tracking-wide mb-1">Receipt</dt>
                <ReceiptViewButton expenseId={entry.id} />
              </div>
            )}
          </dl>

          {(canManagerDecide || canAdminDecide) && (
            <div className="mt-6 border-t border-black/5 dark:border-white/10 pt-4">
              <ExpenseDecisionActionsWrapper id={entry.id} status={entry.status} />
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

function Detail({ label, value, full }: { label: string; value: string; full?: boolean }) {
  return (
    <div className={full ? "col-span-2" : undefined}>
      <dt className="text-xs text-muted uppercase tracking-wide">{label}</dt>
      <dd className="mt-0.5 font-medium">{value}</dd>
    </div>
  );
}
