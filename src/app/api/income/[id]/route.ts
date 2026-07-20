import { NextResponse, type NextRequest } from "next/server";
import { getRequestProfile, jsonError } from "@/lib/api-helpers";
import { incomeSchema } from "@/lib/validations/income";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const { supabase } = await getRequestProfile();
    const { data, error } = await supabase
      .from("income")
      .select(
        "*, recorded_by_profile:profiles!income_recorded_by_fkey(id, full_name, email), approved_by_profile:profiles!income_approved_by_fkey(id, full_name, email)",
      )
      .eq("id", id)
      .single();
    if (error) throw error;
    return NextResponse.json({ data });
  } catch (error) {
    return jsonError(error);
  }
}

// PATCH -- edit a draft/rejected income entry's fields (owner only; RLS +
// enforce_income_workflow trigger reject anything else).
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const { supabase } = await getRequestProfile();
    const body = await request.json();
    const parsed = incomeSchema.partial().safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 422 });
    }

    const { data, error } = await supabase
      .from("income")
      .update({
        ...parsed.data,
        phone_number: parsed.data.phone_number || null,
        description: parsed.data.description || null,
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

// DELETE -- remove a draft income entry (owner) or any entry (admin); RLS enforces this.
export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const { supabase } = await getRequestProfile();
    const { error } = await supabase.from("income").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
