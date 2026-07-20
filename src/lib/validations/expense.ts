import { z } from "zod";

export const expenseSchema = z.object({
  category: z.enum([
    "router_equipment",
    "internet_bill",
    "electricity",
    "rent",
    "salaries",
    "maintenance",
    "marketing",
    "transport",
    "other",
  ]),
  amount: z.number().positive("Amount must be greater than 0"),
  description: z.string().trim().optional().or(z.literal("")),
  entry_date: z.string().min(1, "Date is required"),
  receipt_url: z.string().trim().optional().or(z.literal("")),
});

export type ExpenseFormValues = z.infer<typeof expenseSchema>;

export const EXPENSE_CATEGORY_LABELS: Record<string, string> = {
  router_equipment: "Router / Equipment",
  internet_bill: "Internet Bill",
  electricity: "Electricity",
  rent: "Rent",
  salaries: "Salaries",
  maintenance: "Maintenance",
  marketing: "Marketing",
  transport: "Transport",
  other: "Other",
};
