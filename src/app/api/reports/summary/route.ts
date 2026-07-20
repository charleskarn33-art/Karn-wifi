import { NextResponse, type NextRequest } from "next/server";
import { getRequestProfile, jsonError, ApiError } from "@/lib/api-helpers";

// GET /api/reports/summary?from=YYYY-MM-DD&to=YYYY-MM-DD
// Returns approved income + expense rows in range for reporting/export.
// RLS still applies: staff only ever see their own records here.
export async function GET(request: NextRequest) {
  try {
    const { supabase, profile } = await getRequestProfile();
    if (profile.role === "staff") {
      throw new ApiError("Reports are only available to managers and admins", 403);
    }

    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    if (!from || !to) throw new ApiError("Both 'from' and 'to' dates are required", 422);

    const [incomeRes, expenseRes] = await Promise.all([
      supabase
        .from("income")
        .select("id, customer_name, voucher_package, amount, payment_method, entry_date, recorded_by_profile:profiles!income_recorded_by_fkey(full_name)")
        .eq("status", "approved")
        .gte("entry_date", from)
        .lte("entry_date", to)
        .order("entry_date", { ascending: true }),
      supabase
        .from("expenses")
        .select("id, category, amount, description, entry_date, requested_by_profile:profiles!expenses_requested_by_fkey(full_name)")
        .eq("status", "approved")
        .gte("entry_date", from)
        .lte("entry_date", to)
        .order("entry_date", { ascending: true }),
    ]);

    if (incomeRes.error) throw incomeRes.error;
    if (expenseRes.error) throw expenseRes.error;

    const totalIncome = (incomeRes.data ?? []).reduce((acc, r) => acc + Number(r.amount), 0);
    const totalExpenses = (expenseRes.data ?? []).reduce((acc, r) => acc + Number(r.amount), 0);

    return NextResponse.json({
      income: incomeRes.data,
      expenses: expenseRes.data,
      totals: {
        income: totalIncome,
        expenses: totalExpenses,
        netProfit: totalIncome - totalExpenses,
      },
    });
  } catch (error) {
    return jsonError(error);
  }
}
