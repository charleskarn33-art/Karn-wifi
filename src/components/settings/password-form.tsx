"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/input";

export function PasswordForm() {
  const [saving, setSaving] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ defaultValues: { password: "" } });

  async function onSubmit(values: { password: string }) {
    if (values.password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: values.password });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Password updated");
    reset();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="password">New password</Label>
        <Input id="password" type="password" placeholder="••••••••" {...register("password")} />
        <FieldError>{errors.password?.message}</FieldError>
      </div>
      <Button type="submit" isLoading={saving}>
        Update password
      </Button>
    </form>
  );
}
