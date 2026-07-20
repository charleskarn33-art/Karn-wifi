import "server-only";
import {
  startOfDay,
  startOfMonth,
  endOfMonth,
  subDays,
  subMonths,
  startOfWeek,
  subWeeks,
  format,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
} from "date-fns";
import { createClient } from "@/lib/supabase/server";

export interface DashboardStats {
  incomeToday: number;
  incomeThisMonth: number;
  expensesThisMonth: number;
  netProfit: number;
  balance: number;
  pendingIncomeCount: number;
  pendingIncomeAmount: number;
  pendingExpenseCount: number;
  pendingExpenseAmount: number;
}

export interface TrendPoint {
  label: string;
  income: number;
  expenses: number;
  profit: number;
}

export interface DashboardData {
  stats: DashboardStats;
  daily: TrendPoint[];
  weekly: TrendPoint[];
  monthly: TrendPoint[];
}

export async function getDashboardData(): Promise<DashboardData> {
  const supabase = await createClient();

  const now = new Date();
  const todayStart = startOfDay(now).toISOString();
  const monthStart = startOfMonth(now).toISOString();
  const monthEnd = endOfMonth(now).toISOString();
  const yearAgo = subMonths(startOfMonth(now), 11).toISOString();

  const [
    incomeTodayRes,
    incomeMonthRes,
    expensesMonthRes,
    pendingIncomeRes,
    pendingExpenseRes,
    incomeYearRes,
    expensesYearRes,
    incomeAllTimeRes,
    expensesAllTimeRes,
  ] = await Promise.all([
    supabase
      .from("income")
      .select("amount")
      .eq("status", "approved")
      .gte("entry_date", todayStart.slice(0, 10)),
    supabase
      .from("income")
      .select("amount")
      .eq("status", "approved")
      .gte("entry_date", monthStart.slice(0, 10))
      .lte("entry_date", monthEnd.slice(0, 10)),
    supabase
      .from("expenses")
      .select("amount")
      .eq("status", "approved")
      .gte("entry_date", monthStart.slice(0, 10))
      .lte("entry_date", monthEnd.slice(0, 10)),
    supabase.from("income").select("amount").eq("status", "submitted"),
    supabase
      .from("expenses")
      .select("amount")
      .in("status", ["submitted", "manager_approved"]),
    supabase
      .from("income")
      .select("amount, entry_date")
      .eq("status", "approved")
      .gte("entry_date", yearAgo.slice(0, 10)),
    supabase
      .from("expenses")
      .select("amount, entry_date")
      .eq("status", "approved")
      .gte("entry_date", yearAgo.slice(0, 10)),
    // All-time totals (no date filter) to compute the running account balance.
    supabase.from("income").select("amount").eq("status", "approved"),
    supabase.from("expenses").select("amount").eq("status", "approved"),
  ]);

  const sum = (rows: { amount: number }[] | null) =>
    (rows ?? []).reduce((acc, r) => acc + Number(r.amount), 0);

  const incomeToday = sum(incomeTodayRes.data);
  const incomeThisMonth = sum(incomeMonthRes.data);
  const expensesThisMonth = sum(expensesMonthRes.data);

  const balance = sum(incomeAllTimeRes.data) - sum(expensesAllTimeRes.data);

  const stats: DashboardStats = {
    incomeToday,
    incomeThisMonth,
    expensesThisMonth,
    netProfit: incomeThisMonth - expensesThisMonth,
    balance,
    pendingIncomeCount: pendingIncomeRes.data?.length ?? 0,
    pendingIncomeAmount: sum(pendingIncomeRes.data),
    pendingExpenseCount: pendingExpenseRes.data?.length ?? 0,
    pendingExpenseAmount: sum(pendingExpenseRes.data),
  };

  const incomeRows = incomeYearRes.data ?? [];
  const expenseRows = expensesYearRes.data ?? [];

  const daily = buildTrend(
    eachDayOfInterval({ start: subDays(now, 13), end: now }),
    (d) => format(d, "yyyy-MM-dd"),
    (d) => format(d, "EEE d"),
    incomeRows,
    expenseRows,
  );

  const weekly = buildTrend(
    eachWeekOfInterval({ start: subWeeks(now, 11), end: now }, { weekStartsOn: 1 }),
    (d) => format(startOfWeek(d, { weekStartsOn: 1 }), "yyyy-MM-dd"),
    (d) => `Wk ${format(d, "MMM d")}`,
    incomeRows,
    expenseRows,
    "week",
  );

  const monthly = buildTrend(
    eachMonthOfInterval({ start: subMonths(startOfMonth(now), 11), end: now }),
    (d) => format(d, "yyyy-MM"),
    (d) => format(d, "MMM yy"),
    incomeRows,
    expenseRows,
    "month",
  );

  return { stats, daily, weekly, monthly };
}

function buildTrend(
  buckets: Date[],
  keyFn: (d: Date) => string,
  labelFn: (d: Date) => string,
  incomeRows: { amount: number; entry_date: string }[],
  expenseRows: { amount: number; entry_date: string }[],
  granularity: "day" | "week" | "month" = "day",
): TrendPoint[] {
  const bucketKeyForDate = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    if (granularity === "month") return format(d, "yyyy-MM");
    if (granularity === "week") return format(startOfWeek(d, { weekStartsOn: 1 }), "yyyy-MM-dd");
    return format(d, "yyyy-MM-dd");
  };

  const incomeByBucket = new Map<string, number>();
  for (const row of incomeRows) {
    const key = bucketKeyForDate(row.entry_date);
    incomeByBucket.set(key, (incomeByBucket.get(key) ?? 0) + Number(row.amount));
  }

  const expensesByBucket = new Map<string, number>();
  for (const row of expenseRows) {
    const key = bucketKeyForDate(row.entry_date);
    expensesByBucket.set(key, (expensesByBucket.get(key) ?? 0) + Number(row.amount));
  }

  return buckets.map((d) => {
    const key = keyFn(d);
    const income = incomeByBucket.get(key) ?? 0;
    const expenses = expensesByBucket.get(key) ?? 0;
    return { label: labelFn(d), income, expenses, profit: income - expenses };
  });
}
