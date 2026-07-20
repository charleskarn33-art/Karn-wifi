import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import type { ExpenseStatus } from "@/types/database";

const toneClasses = {
  neutral: "bg-black/5 dark:bg-white/10 text-muted",
  brand: "bg-brand-500/15 text-brand-600 dark:text-brand-400",
  success: "bg-success-500/15 text-success-500",
  warning: "bg-warning-500/15 text-warning-500",
  danger: "bg-danger-500/15 text-danger-500",
} as const;

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: keyof typeof toneClasses;
}

export function Badge({ className, tone = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap",
        toneClasses[tone],
        className,
      )}
      {...props}
    />
  );
}

const EXPENSE_STATUS_TONE: Record<ExpenseStatus, keyof typeof toneClasses> = {
  draft: "neutral",
  submitted: "warning",
  manager_approved: "brand",
  approved: "success",
  rejected: "danger",
};

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  submitted: "Submitted",
  manager_approved: "Manager Approved",
  approved: "Approved",
  rejected: "Rejected",
};

export function ExpenseStatusBadge({ status }: { status: ExpenseStatus }) {
  return <Badge tone={EXPENSE_STATUS_TONE[status]}>{STATUS_LABEL[status]}</Badge>;
}
