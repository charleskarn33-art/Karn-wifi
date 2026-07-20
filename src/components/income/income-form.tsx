"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { incomeSchema, type IncomeFormValues, PAYMENT_METHOD_LABELS } from "@/lib/validations/income";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError, Select, Textarea } from "@/components/ui/input";
import type { Income } from "@/types/database";

interface IncomeFormProps {
  income?: Income;
  onSaved?: () => void;
}

export function IncomeForm({ income, onSaved }: IncomeFormProps) {
  const router = useRouter();
  const isEdit = Boolean(income);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<IncomeFormValues>({
    resolver: zodResolver(incomeSchema),
    defaultValues: income
      ? {
          customer_name: income.customer_name,
          phone_number: income.phone_number ?? "",
          voucher_package: income.voucher_package,
          amount: income.amount,
          payment_method: income.payment_method,
          description: income.description ?? "",
          entry_date: income.entry_date,
        }
      : {
          payment_method: "cash",
          entry_date: new Date().toISOString().slice(0, 10),
        },
  });

  async function save(values: IncomeFormValues, submit: boolean) {
    try {
      const res = await fetch(isEdit ? `/api/income/${income!.id}` : "/api/income", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Something went wrong");

      const id = isEdit ? income!.id : json.data.id;

      if (submit) {
        const submitRes = await fetch(`/api/income/${id}/submit`, { method: "POST" });
        const submitJson = await submitRes.json();
        if (!submitRes.ok) throw new Error(submitJson.error || "Could not submit for approval");
        toast.success("Income entry submitted for approval");
      } else {
        toast.success(isEdit ? "Income entry updated" : "Draft saved");
      }

      onSaved?.();
      router.push("/income");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    }
  }

  return (
    <form className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="customer_name">Customer name</Label>
          <Input id="customer_name" placeholder="Jane Doe" {...register("customer_name")} />
          <FieldError>{errors.customer_name?.message}</FieldError>
        </div>
        <div>
          <Label htmlFor="phone_number">Phone number</Label>
          <Input id="phone_number" placeholder="+254 7xx xxx xxx" {...register("phone_number")} />
          <FieldError>{errors.phone_number?.message}</FieldError>
        </div>
        <div>
          <Label htmlFor="voucher_package">Voucher package</Label>
          <Input id="voucher_package" placeholder="Daily 5GB" {...register("voucher_package")} />
          <FieldError>{errors.voucher_package?.message}</FieldError>
        </div>
        <div>
          <Label htmlFor="amount">Amount</Label>
          <Input id="amount" type="number" step="0.01" min="0" placeholder="0.00" {...register("amount", { valueAsNumber: true })} />
          <FieldError>{errors.amount?.message}</FieldError>
        </div>
        <div>
          <Label htmlFor="payment_method">Payment method</Label>
          <Select id="payment_method" {...register("payment_method")}>
            {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
          <FieldError>{errors.payment_method?.message}</FieldError>
        </div>
        <div>
          <Label htmlFor="entry_date">Date</Label>
          <Input id="entry_date" type="date" {...register("entry_date")} />
          <FieldError>{errors.entry_date?.message}</FieldError>
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" placeholder="Optional notes" {...register("description")} />
        <FieldError>{errors.description?.message}</FieldError>
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
