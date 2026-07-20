import { NextResponse, type NextRequest } from "next/server";
import { getRequestProfile, jsonError } from "@/lib/api-helpers";
import { expenseSchema } from "@/lib/validations/expense";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const { supabase } = await getRequestProfile();
    const { data, error } = await supabase
      .from("expenses")
      .select(
        "*, requested_by_profile:profiles!expenses_requested_by_fkey(id, full_name, email), manager_approved_by_profile:profiles!expenses_manager_approved_by_fkey(id, full_name, email), admin_approved_by_profile:profiles!expenses_admin_approved_by_fkey(id, full_name, email)",
      )
      .eq("id", id)
      .single();
    if (error) throw error;
    return NextResponse.json({ data });
  } catch (error) {
    return jsonError(error);
  }
}

// PATCH -- edit a draft/rejected expense (owner only; RLS + enforce_expense_workflow trigger reject anything else).
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const { supabase } = await getRequestProfile();
    const body = await request.json();
    const parsed = expenseSchema.partial().safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 422 });
    }

    const { data, error } = await supabase
      .from("expenses")
      .update({
        ...parsed.data,
        description: parsed.data.description || null,
        receipt_url: parsed.data.receipt_url || null,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ data });
  } catch (error) {
    return jsonError(error);
  }
}

// DELETE -- remove a draft expense (owner) or any expense (admin); RLS enforces this.
export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const { supabase } = await getRequestProfile();
    const { error } = await supabase.from("expenses").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
