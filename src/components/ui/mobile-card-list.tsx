import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/** Wraps a set of MobileCardRow items; shown only below `sm` as the phone-friendly stand-in for a <Table>. */
export function MobileCardList({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("space-y-3 sm:hidden", className)} {...props} />;
}

export function MobileCardRow({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-black/5 dark:border-white/10 bg-white/50 dark:bg-white/5 p-4",
        className,
      )}
      {...props}
    />
  );
}

export function MobileCardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex items-start justify-between gap-3", className)} {...props} />;
}

/** Label/value pair grid used inside a MobileCardRow's body. */
export function MobileCardMeta({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mt-3 grid grid-cols-2 gap-y-2 gap-x-3 text-xs", className)} {...props} />;
}

export function MobileCardMetaItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-muted">{label}</dt>
      <dd className="mt-0.5 font-medium text-foreground">{value}</dd>
    </div>
  );
}

export function MobileCardActions({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mt-3 flex items-center justify-end gap-1.5 border-t border-black/5 dark:border-white/10 pt-3", className)} {...props} />;
}
