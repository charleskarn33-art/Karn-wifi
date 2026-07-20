import { NextResponse, type NextRequest } from "next/server";
import { getRequestProfile, jsonError, ApiError } from "@/lib/api-helpers";

interface Params {
  params: Promise<{ id: string }>;
}

// GET /api/expenses/:id/receipt-url -- short-lived signed URL for the private receipt file.
export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const { supabase } = await getRequestProfile();

    const { data: expense, error: fetchError } = await supabase
      .from("expenses")
      .select("receipt_url")
      .eq("id", id)
      .single();
    if (fetchError) throw fetchError;
    if (!expense?.receipt_url) throw new ApiError("No receipt uploaded for this expense", 404);

    const { data, error } = await supabase.storage
      .from("receipts")
      .createSignedUrl(expense.receipt_url, 60 * 5);
    if (error) throw error;

    return NextResponse.json({ url: data.signedUrl });
  } catch (error) {
    return jsonError(error);
  }
}
