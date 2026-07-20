"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { expenseSchema, type ExpenseFormValues, EXPENSE_CATEGORY_LABELS } from "@/lib/validations/expense";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError, Select, Textarea } from "@/components/ui/input";
import { ReceiptUpload } from "@/components/expenses/receipt-upload";
import type { Expense } from "@/types/database";

interface ExpenseFormProps {
  expense?: Expense;
  userId: string;
}

export function ExpenseForm({ expense, userId }: ExpenseFormProps) {
  const router = useRouter();
  const isEdit = Boolean(expense);
  const [receiptPath, setReceiptPath] = useState<string | null>(expense?.receipt_url ?? null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: expense
      ? {
          category: expense.category,
          amount: expense.amount,
          description: expense.description ?? "",
          entry_date: expense.entry_date,
          receipt_url: expense.receipt_url ?? "",
        }
      : {
          category: "other",
          entry_date: new Date().toISOString().slice(0, 10),
        },
  });

  async function save(values: ExpenseFormValues, submit: boolean) {
    try {
      const payload = { ...values, receipt_url: receiptPath || "" };
      const res = await fetch(isEdit ? `/api/expenses/${expense!.id}` : "/api/expenses", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Something went wrong");

      const id = isEdit ? expense!.id : json.data.id;

      if (submit) {
        const submitRes = await fetch(`/api/expenses/${id}/submit`, { method: "POST" });
        const submitJson = await submitRes.json();
        if (!submitRes.ok) throw new Error(submitJson.error || "Could not submit for approval");
        toast.success("Expense submitted for manager approval");
      } else {
        toast.success(isEdit ? "Expense updated" : "Draft saved");
      }

      router.push("/expenses");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    }
  }

  return (
    <form className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="category">Category</Label>
          <Select id="category" {...register("category")}>
            {Object.entries(EXPENSE_CATEGORY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
          <FieldError>{errors.category?.message}</FieldError>
        </div>
        <div>
          <Label htmlFor="amount">Amount</Label>
          <Input id="amount" type="number" step="0.01" min="0" placeholder="0.00" {...register("amount", { valueAsNumber: true })} />
          <FieldError>{errors.amount?.message}</FieldError>
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="entry_date">Date</Label>
          <Input id="entry_date" type="date" {...register("entry_date")} />
          <FieldError>{errors.entry_date?.message}</FieldError>
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" placeholder="What was this expense for?" {...register("description")} />
        <FieldError>{errors.description?.message}</FieldError>
      </div>

      <div>
        <Label>Receipt</Label>
        <Controller
          control={control}
          name="receipt_url"
          render={() => <ReceiptUpload value={receiptPath} onChange={setReceiptPath} userId={userId} />}
        />
      </div>

      <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="secondary"
          isLoading={isSubmitting}
          onClick={handleSubmit((values) => save(values, false))}
        >
          Save as draft
        </Button>
        <Button type="button" isLoading={isSubmitting} onClick={handleSubmit((values) => save(values, true))}>
          Submit for approval
        </Button>
      </div>
    </form>
  );
}
