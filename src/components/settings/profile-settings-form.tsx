"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/input";
import type { Profile } from "@/types/database";

export function ProfileSettingsForm({ profile }: { profile: Profile }) {
  const [saving, setSaving] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ defaultValues: { full_name: profile.full_name, phone: profile.phone ?? "" } });

  async function onSubmit(values: { full_name: string; phone: string }) {
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: values.full_name, phone: values.phone || null })
      .eq("id", profile.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Profile updated");
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="full_name">Full name</Label>
        <Input id="full_name" {...register("full_name", { required: "Name is required" })} />
        <FieldError>{errors.full_name?.message}</FieldError>
      </div>
      <div>
        <Label>Email</Label>
        <Input value={profile.email} disabled />
      </div>
      <div>
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" {...register("phone")} />
      </div>
      <Button type="submit" isLoading={saving}>
        Save changes
      </Button>
    </form>
  );
}
