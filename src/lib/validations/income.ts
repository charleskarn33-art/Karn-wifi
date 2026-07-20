import { z } from "zod";

export const incomeSchema = z.object({
  customer_name: z.string().trim().min(2, "Customer name is required"),
  phone_number: z.string().trim().optional().or(z.literal("")),
  voucher_package: z.string().trim().min(1, "Voucher package is required"),
  amount: z.number().positive("Amount must be greater than 0"),
  payment_method: z.enum(["cash", "mpesa", "bank_transfer", "card", "other"]),
  description: z.string().trim().optional().or(z.literal("")),
  entry_date: z.string().min(1, "Date is required"),
});

export type IncomeFormValues = z.infer<typeof incomeSchema>;

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: "Cash",
  mpesa: "M-Pesa",
  bank_transfer: "Bank Transfer",
  card: "Card",
  other: "Other",
};
