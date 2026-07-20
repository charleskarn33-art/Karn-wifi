"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function AdminDeleteButton({ id }: { id: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function remove() {
    if (!confirm("Permanently delete this expense? This cannot be undone.")) return;
    setLoading(true);
    const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) return toast.error(json.error);
    toast.success("Expense deleted");
    router.push("/expenses");
    router.refresh();
  }

  return (
    <Button variant="outline" size="sm" onClick={remove} isLoading={loading}>
      <Trash2 className="h-4 w-4 text-danger-500" /> Delete
    </Button>
  );
}
