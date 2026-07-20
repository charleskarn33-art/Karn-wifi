import { NextResponse, type NextRequest } from "next/server";
import { getRequestProfile, jsonError } from "@/lib/api-helpers";
import { rejectionSchema } from "@/lib/validations/auth";

interface Params {
  params: Promise<{ id: string }>;
}

// POST /api/income/:id/reject -- manager/admin rejects a submitted entry with a reason.
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const { supabase } = await getRequestProfile();
    const body = await request.json();
    const parsed = rejectionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "A rejection reason is required" }, { status: 422 });
    }

    const { data, error } = await supabase
      .from("income")
      .update({ status: "rejected", rejection_reason: parsed.data.rejection_reason })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json({ data });
  } catch (error) {
    return jsonError(error);
  }
}
