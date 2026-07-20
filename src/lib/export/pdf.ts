"use client";

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { formatCurrency } from "@/lib/utils";
import type { ReportExportData } from "@/lib/export/excel";

export function exportReportToPdf({ income, expenses, totals, rangeLabel }: ReportExportData) {
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text("WiFi Business Finance Manager", 14, 18);
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Profit & Loss Report — ${rangeLabel}`, 14, 25);

  autoTable(doc, {
    startY: 32,
    head: [["", "Amount"]],
    body: [
      ["Total Income", formatCurrency(totals.income)],
      ["Total Expenses", formatCurrency(totals.expenses)],
      ["Net Profit", formatCurrency(totals.netProfit)],
    ],
    theme: "grid",
    styles: { fontSize: 10 },
    headStyles: { fillColor: [59, 130, 246] },
  });

  const afterSummaryY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  doc.setFontSize(12);
  doc.text("Income", 14, afterSummaryY);
  autoTable(doc, {
    startY: afterSummaryY + 4,
    head: [["Date", "Customer", "Package", "Method", "Amount"]],
    body: income.map((r) => [r.entry_date, r.customer_name, r.voucher_package, r.payment_method, formatCurrency(r.amount)]),
    theme: "striped",
    styles: { fontSize: 9 },
    headStyles: { fillColor: [59, 130, 246] },
  });

  const afterIncomeY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  doc.setFontSize(12);
  doc.text("Expenses", 14, afterIncomeY);
  autoTable(doc, {
    startY: afterIncomeY + 4,
    head: [["Date", "Category", "Description", "Amount"]],
    body: expenses.map((r) => [r.entry_date, r.category, r.description ?? "", formatCurrency(r.amount)]),
    theme: "striped",
    styles: { fontSize: 9 },
    headStyles: { fillColor: [239, 68, 68] },
  });

  doc.save(`finance-report-${rangeLabel.replace(/\s+/g, "-")}.pdf`);
}
