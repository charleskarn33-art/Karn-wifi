"use client";

import { useRouter } from "next/navigation";
import { DecisionActions } from "@/components/shared/decision-actions";

export function DecisionActionsWrapper({ id }: { id: string }) {
  const router = useRouter();
  return (
    <DecisionActions
      approveUrl={`/api/income/${id}/approve`}
      rejectUrl={`/api/income/${id}/reject`}
      onDone={() => router.refresh()}
    />
  );
}
