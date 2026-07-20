"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Check, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Textarea, Label, FieldError } from "@/components/ui/input";
import { rejectionSchema, type RejectionFormValues } from "@/lib/validations/auth";

interface DecisionActionsProps {
  approveUrl: string;
  rejectUrl: string;
  approveLabel?: string;
  size?: "sm" | "md";
  onDone?: () => void;
}

/** Approve/Reject button pair shared by income, expenses, and the Approvals inbox. */
export function DecisionActions({ approveUrl, rejectUrl, approveLabel = "Approve", size = "md", onDone }: DecisionActionsProps) {
  const [rejectOpen, setRejectOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<RejectionFormValues>({ resolver: zodResolver(rejectionSchema) });

  async function approve() {
    setLoading(true);
    const res = await fetch(approveUrl, { method: "POST" });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) return toast.error(json.error);
    toast.success(`${approveLabel} successful`);
    onDone?.();
  }

  async function reject(values: RejectionFormValues) {
    setLoading(true);
    const res = await fetch(rejectUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) return toast.error(json.error);
    toast.success("Rejected");
    setRejectOpen(false);
    reset();
    onDone?.();
  }

  return (
    <div className="flex gap-2">
      <Button variant="danger" size={size} onClick={() => setRejectOpen(true)} isLoading={loading}>
        <X className="h-4 w-4" /> Reject
      </Button>
      <Button size={size} onClick={approve} isLoading={loading}>
        <Check className="h-4 w-4" /> {approveLabel}
      </Button>

      <Modal open={rejectOpen} onClose={() => setRejectOpen(false)} title="Reason for rejection">
        <form onSubmit={handleSubmit(reject)} className="space-y-3">
          <div>
            <Label htmlFor="rejection_reason">Reason</Label>
            <Textarea id="rejection_reason" placeholder="Explain why this is being rejected" {...register("rejection_reason")} />
            <FieldError>{errors.rejection_reason?.message}</FieldError>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setRejectOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="danger" isLoading={loading}>
              Confirm rejection
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
