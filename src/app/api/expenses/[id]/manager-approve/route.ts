import { NextResponse, type NextRequest } from "next/server";
import { getRequestProfile, jsonError } from "@/lib/api-helpers";

interface Params {
  params: Promise<{ id: string }>;
}

// POST /api/expenses/:id/manager-approve -- manager/admin advances a submitted expense.
export async function POST(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const { supabase } = await getRequestProfile();
    const { data, error } = await supabase
      .from("expenses")
      .update({ status: "manager_approved" })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json({ data });
  } catch (error) {
    return jsonError(error);
  }
}
