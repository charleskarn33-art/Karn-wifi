"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { ExpenseForm } from "@/components/expenses/expense-form";
import type { Expense } from "@/types/database";

// Lets an admin correct any expense's fields regardless of its approval
// stage, without disturbing that stage (no submit/approve side effect) and
// without hiding the approve/reject actions the detail page also renders.
export function AdminEditModal({ expense, userId }: { expense: Expense; userId: string }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Pencil className="h-4 w-4" /> Edit
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Edit expense" description="Admin correction -- this does not change its approval stage." className="sm:max-w-xl">
        <ExpenseForm
          expense={expense}
          userId={userId}
          mode="correction"
          onSaved={() => {
            setOpen(false);
            router.refresh();
          }}
        />
      </Modal>
    </>
  );
}
