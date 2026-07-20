"use client";

import { useEffect, useState } from "react";
import { startOfDay, startOfWeek, startOfMonth, endOfDay, format } from "date-fns";
import { FileSpreadsheet, FileText, TrendingDown, TrendingUp, PiggyBank } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { StatCard } from "@/components/ui/stat-card";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/table";
import { TableSkeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { exportReportToExcel } from "@/lib/export/excel";
import { exportReportToPdf } from "@/lib/export/pdf";
import { EXPENSE_CATEGORY_LABELS } from "@/lib/validations/expense";

type Preset = "daily" | "weekly" | "monthly" | "custom";

interface ReportRow {
  income: Array<{ id: string; entry_date: string; customer_name: string; voucher_package: string; amount: number; payment_method: string; recorded_by_profile?: { full_name: string } | null }>;
  expenses: Array<{ id: string; entry_date: string; category: string; amount: number; description: string | null; requested_by_profile?: { full_name: string } | null }>;
  totals: { income: number; expenses: number; netProfit: number };
}

const today = new Date();

function presetRange(preset: Preset): { from: string; to: string } {
  const to = format(endOfDay(today), "yyyy-MM-dd");
  if (preset === "daily") return { from: format(startOfDay(today), "yyyy-MM-dd"), to };
  if (preset === "weekly") return { from: format(startOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd"), to };
  return { from: format(startOfMonth(today), "yyyy-MM-dd"), to };
}

export function ReportsView() {
  const [preset, setPreset] = useState<Preset>("monthly");
  const [from, setFrom] = useState(presetRange("monthly").from);
  const [to, setTo] = useState(presetRange("monthly").to);
  const [report, setReport] = useState<ReportRow | null>(null);
  const [loading, setLoading] = useState(true);

  function applyPreset(p: Preset) {
    setPreset(p);
    if (p !== "custom") {
      const range = presetRange(p);
      setFrom(range.from);
      setTo(range.to);
    }
  }

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetch(`/api/reports/summary?from=${from}&to=${to}`)
      .then((res) => res.json())
      .then((json) => active && setReport(json))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [from, to]);

  const rangeLabel = `${formatDate(from)} to ${formatDate(to)}`;

  function handleExportExcel() {
    if (!report) return;
    exportReportToExcel({ ...report, rangeLabel });
  }

  function handleExportPdf() {
    if (!report) return;
    exportReportToPdf({ ...report, rangeLabel });
  }

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {(["daily", "weekly", "monthly", "custom"] as Preset[]).map((p) => (
              <button
                key={p}
                onClick={() => applyPreset(p)}
                className={cn(
                  "rounded-xl px-3.5 py-2 text-sm font-medium capitalize transition-colors",
                  preset === p ? "bg-brand-500 text-white shadow-md shadow-brand-500/25" : "bg-black/5 dark:bg-white/5 text-muted hover:text-foreground",
                )}
              >
                {p}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <Label htmlFor="from">From</Label>
              <Input
                id="from"
                type="date"
                value={from}
                onChange={(e) => {
                  setPreset("custom");
                  setFrom(e.target.value);
                }}
              />
            </div>
            <div>
              <Label htmlFor="to">To</Label>
              <Input
                id="to"
                type="date"
                value={to}
                onChange={(e) => {
                  setPreset("custom");
                  setTo(e.target.value);
                }}
              />
            </div>
            <Button variant="secondary" onClick={handleExportExcel} disabled={!report}>
              <FileSpreadsheet className="h-4 w-4" /> Excel
            </Button>
            <Button variant="secondary" onClick={handleExportPdf} disabled={!report}>
              <FileText className="h-4 w-4" /> PDF
            </Button>
          </div>
        </div>
      </Card>

      {loading || !report ? (
        <TableSkeleton rows={4} />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard label="Total Income" value={formatCurrency(report.totals.income)} icon={TrendingUp} tone="success" />
            <StatCard label="Total Expenses" value={formatCurrency(report.totals.expenses)} icon={TrendingDown} tone="danger" />
            <StatCard
              label="Net Profit"
              value={formatCurrency(report.totals.netProfit)}
              icon={PiggyBank}
              tone={report.totals.netProfit >= 0 ? "success" : "danger"}
            />
          </div>

          <Card>
            <h3 className="mb-4 text-base font-semibold">Income ({report.income.length})</h3>
            <Table>
              <Thead>
                <Tr>
                  <Th>Date</Th>
                  <Th>Customer</Th>
                  <Th>Package</Th>
                  <Th>Recorded By</Th>
                  <Th className="text-right">Amount</Th>
                </Tr>
              </Thead>
              <Tbody>
                {report.income.map((r) => (
                  <Tr key={r.id}>
                    <Td>{formatDate(r.entry_date)}</Td>
                    <Td>{r.customer_name}</Td>
                    <Td>{r.voucher_package}</Td>
                    <Td>{r.recorded_by_profile?.full_name ?? "—"}</Td>
                    <Td className="text-right font-medium">{formatCurrency(r.amount)}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Card>

          <Card>
            <h3 className="mb-4 text-base font-semibold">Expenses ({report.expenses.length})</h3>
            <Table>
              <Thead>
                <Tr>
                  <Th>Date</Th>
                  <Th>Category</Th>
                  <Th>Requested By</Th>
                  <Th className="text-right">Amount</Th>
                </Tr>
              </Thead>
              <Tbody>
                {report.expenses.map((r) => (
                  <Tr key={r.id}>
                    <Td>{formatDate(r.entry_date)}</Td>
                    <Td>{EXPENSE_CATEGORY_LABELS[r.category] ?? r.category}</Td>
                    <Td>{r.requested_by_profile?.full_name ?? "—"}</Td>
                    <Td className="text-right font-medium">{formatCurrency(r.amount)}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Card>
        </>
      )}
    </div>
  );
}
