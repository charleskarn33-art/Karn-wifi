"use client";

import * as XLSX from "xlsx";

export interface ReportExportData {
  income: Array<{ entry_date: string; customer_name: string; voucher_package: string; amount: number; payment_method: string; recorded_by_profile?: { full_name: string } | null }>;
  expenses: Array<{ entry_date: string; category: string; amount: number; description: string | null; requested_by_profile?: { full_name: string } | null }>;
  totals: { income: number; expenses: number; netProfit: number };
  rangeLabel: string;
}

export function exportReportToExcel({ income, expenses, totals, rangeLabel }: ReportExportData) {
  const wb = XLSX.utils.book_new();

  const incomeSheet = XLSX.utils.json_to_sheet(
    income.map((r) => ({
      Date: r.entry_date,
      Customer: r.customer_name,
      Package: r.voucher_package,
      "Payment Method": r.payment_method,
      "Recorded By": r.recorded_by_profile?.full_name ?? "",
      Amount: Number(r.amount),
    })),
  );
  XLSX.utils.book_append_sheet(wb, incomeSheet, "Income");

  const expenseSheet = XLSX.utils.json_to_sheet(
    expenses.map((r) => ({
      Date: r.entry_date,
      Category: r.category,
      Description: r.description ?? "",
      "Requested By": r.requested_by_profile?.full_name ?? "",
      Amount: Number(r.amount),
    })),
  );
  XLSX.utils.book_append_sheet(wb, expenseSheet, "Expenses");

  const summarySheet = XLSX.utils.aoa_to_sheet([
    ["WiFi Business Finance Manager — Profit & Loss"],
    ["Period", rangeLabel],
    [],
    ["Total Income", totals.income],
    ["Total Expenses", totals.expenses],
    ["Net Profit", totals.netProfit],
  ]);
  XLSX.utils.book_append_sheet(wb, summarySheet, "Summary");

  XLSX.writeFile(wb, `finance-report-${rangeLabel.replace(/\s+/g, "-")}.xlsx`);
}
