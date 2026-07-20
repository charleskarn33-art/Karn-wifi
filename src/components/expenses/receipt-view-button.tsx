"use client";

import { FileText } from "lucide-react";
import { toast } from "sonner";

export function ReceiptViewButton({ expenseId }: { expenseId: string }) {
  async function view() {
    const res = await fetch(`/api/expenses/${expenseId}/receipt-url`);
    const json = await res.json();
    if (!res.ok) return toast.error(json.error);
    window.open(json.url, "_blank", "noopener,noreferrer");
  }

  return (
    <button onClick={view} className="flex items-center gap-1.5 text-sm font-medium text-brand-600 dark:text-brand-400 hover:underline">
      <FileText className="h-4 w-4" /> View receipt
    </button>
  );
}
