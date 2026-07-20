import type { Metadata } from "next";
import { Wallet, TrendingUp, Receipt, PiggyBank, Clock, ClipboardList, Landmark } from "lucide-react";
import { getDashboardData } from "@/lib/dashboard";
import { requireAuth } from "@/lib/auth";
import { StatCard } from "@/components/ui/stat-card";
import { TrendChart } from "@/components/dashboard/trend-chart";
import { formatCurrency, cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const profile = await requireAuth();
  const { stats, daily, weekly, monthly } = await getDashboardData();

  return (
    <div className="space-y-6 py-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight">
          Welcome back, {profile.full_name?.split(" ")[0] || "there"} 👋
        </h2>
        <p className="text-sm text-muted mt-1">
          Here&apos;s what&apos;s happening with your WiFi business finances today.
        </p>
      </div>

      <div
        className={cn(
          "glass-card flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between",
          "bg-gradient-to-br",
          stats.balance >= 0
            ? "from-brand-500/10 to-success-500/5"
            : "from-brand-500/10 to-danger-500/5",
        )}
      >
        <div className="flex items-center gap-4">
          <div
            className={cn(
              "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg",
              stats.balance >= 0 ? "from-success-500 to-emerald-700" : "from-danger-500 to-red-700",
            )}
          >
            <Landmark className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted uppercase tracking-wide">Current Balance</p>
            <p className="mt-1 text-3xl font-bold tracking-tight">{formatCurrency(stats.balance)}</p>
            <p className="mt-1 text-xs text-muted">All approved income minus all approved expenses, to date</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <StatCard
          label="Income Today"
          value={formatCurrency(stats.incomeToday)}
          icon={Wallet}
          tone="brand"
        />
        <StatCard
          label="Income This Month"
          value={formatCurrency(stats.incomeThisMonth)}
          icon={TrendingUp}
          tone="success"
        />
        <StatCard
          label="Expenses This Month"
          value={formatCurrency(stats.expensesThisMonth)}
          icon={Receipt}
          tone="danger"
        />
        <StatCard
          label="Net Profit"
          value={formatCurrency(stats.netProfit)}
          icon={PiggyBank}
          tone={stats.netProfit >= 0 ? "success" : "danger"}
        />
        <StatCard
          label="Pending Income"
          value={String(stats.pendingIncomeCount)}
          hint={formatCurrency(stats.pendingIncomeAmount)}
          icon={Clock}
          tone="warning"
        />
        <StatCard
          label="Pending Expense Requests"
          value={String(stats.pendingExpenseCount)}
          hint={formatCurrency(stats.pendingExpenseAmount)}
          icon={ClipboardList}
          tone="warning"
        />
      </div>

      <TrendChart daily={daily} weekly={weekly} monthly={monthly} />
    </div>
  );
}
