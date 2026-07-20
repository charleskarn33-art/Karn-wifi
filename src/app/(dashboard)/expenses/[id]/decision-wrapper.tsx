"use client";

import { useRouter } from "next/navigation";
import { DecisionActions } from "@/components/shared/decision-actions";
import type { UserRole } from "@/types/database";

export function ExpenseDecisionActionsWrapper({ id, role }: { id: string; role: UserRole }) {
  const router = useRouter();
  // Admins hold full authority at any stage: approving a still-"submitted"
  // expense goes straight to final approval (the DB trigger backfills the
  // manager sign-off automatically) instead of requiring two separate clicks.
  // Managers only ever see this at the "submitted" stage and can only
  // advance it to the manager-approved stage.
  const useAdminApprove = role === "admin";

  return (
    <DecisionActions
      approveUrl={`/api/expenses/${id}/${useAdminApprove ? "admin-approve" : "manager-approve"}`}
      rejectUrl={`/api/expenses/${id}/reject`}
      approveLabel={useAdminApprove ? "Approve (Final)" : "Approve"}
      onDone={() => router.refresh()}
    />
  );
}
