"use client";

import { useRouter } from "next/navigation";
import { DecisionActions } from "@/components/shared/decision-actions";
import type { ExpenseStatus } from "@/types/database";

export function ExpenseDecisionActionsWrapper({ id, status }: { id: string; status: ExpenseStatus }) {
  const router = useRouter();
  const isManagerStage = status === "submitted";

  return (
    <DecisionActions
      approveUrl={`/api/expenses/${id}/${isManagerStage ? "manager-approve" : "admin-approve"}`}
      rejectUrl={`/api/expenses/${id}/reject`}
      approveLabel={isManagerStage ? "Approve (Manager)" : "Approve (Final)"}
      onDone={() => router.refresh()}
    />
  );
}
