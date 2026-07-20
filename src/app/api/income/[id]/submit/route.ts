import { NextResponse, type NextRequest } from "next/server";
import { getRequestProfile, jsonError } from "@/lib/api-helpers";

interface Params {
  params: Promise<{ id: string }>;
}

// POST /api/income/:id/submit -- owner moves a draft entry to "submitted".
export async function POST(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const { supabase } = await getRequestProfile();
    const { data, error } = await supabase
      .from("income")
      .update({ status: "submitted" })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json({ data });
  } catch (error) {
    return jsonError(error);
  }
}
