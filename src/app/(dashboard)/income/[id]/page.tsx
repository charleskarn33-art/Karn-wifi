import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { IncomeForm } from "@/components/income/income-form";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PAYMENT_METHOD_LABELS } from "@/lib/validations/income";
import type { IncomeWithRelations } from "@/types/database";

export const metadata: Metadata = { title: "Income Entry" };

export default async function IncomeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await requireAuth();
  const supabase = await createClient();

  const { data: income } = await supabase
    .from("income")
    .select("*, recorded_by_profile:profiles!income_recorded_by_fkey(id, full_name, email)")
    .eq("id", id)
    .single();

  if (!income) notFound();

  const entry = income as IncomeWithRelations;
  const isOwner = entry.recorded_by === profile.id;
  // Income has no approval workflow -- the owner or an admin can always
  // edit/correct an entry; anyone else with view access (e.g. a manager
  // reviewing for reporting) sees a read-only summary.
  const editable = isOwner || profile.role === "admin";

  return (
    <div className="space-y-6 py-6 max-w-2xl">
      <div>
        <h2 className="text-xl font-bold tracking-tight">{entry.customer_name}</h2>
        <p className="text-sm text-muted mt-1">{entry.voucher_package}</p>
      </div>

      {editable ? (
        <Card>
          <IncomeForm income={entry} />
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <Detail label="Amount" value={formatCurrency(entry.amount)} />
            <Detail label="Payment method" value={PAYMENT_METHOD_LABELS[entry.payment_method]} />
            <Detail label="Phone" value={entry.phone_number || "—"} />
            <Detail label="Date" value={formatDate(entry.entry_date)} />
            <Detail label="Recorded by" value={entry.recorded_by_profile?.full_name ?? "—"} />
            {entry.description && <Detail label="Description" value={entry.description} full />}
          </dl>
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
