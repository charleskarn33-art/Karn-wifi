import { NextResponse, type NextRequest } from "next/server";
import { getRequestProfile, jsonError, parsePagination } from "@/lib/api-helpers";
import { expenseSchema } from "@/lib/validations/expense";

// GET /api/expenses?status=&search=&from=&to=&page=&pageSize=
// RLS on `expenses` scopes rows to what the caller may see (own for staff,
// all for manager/admin who need visibility to review submissions).
export async function GET(request: NextRequest) {
  try {
    const { supabase } = await getRequestProfile();
    const { searchParams } = new URL(request.url);
    const { page, pageSize, from, to } = parsePagination(searchParams);
    const status = searchParams.get("status");
    const category = searchParams.get("category");
    const search = searchParams.get("search")?.trim();
    const dateFrom = searchParams.get("from");
    const dateTo = searchParams.get("to");

    let query = supabase
      .from("expenses")
      .select(
        "*, requested_by_profile:profiles!expenses_requested_by_fkey(id, full_name, email), manager_approved_by_profile:profiles!expenses_manager_approved_by_fkey(id, full_name, email), admin_approved_by_profile:profiles!expenses_admin_approved_by_fkey(id, full_name, email)",
        { count: "exact" },
      )
      .order("created_at", { ascending: false })
      .range(from, to);

    if (status) query = query.eq("status", status);
    if (category) query = query.eq("category", category);
    if (dateFrom) query = query.gte("entry_date", dateFrom);
    if (dateTo) query = query.lte("entry_date", dateTo);
    if (search) query = query.ilike("description", `%${search}%`);

    const { data, error, count } = await query;
    if (error) throw error;

    return NextResponse.json({ data, count, page, pageSize });
  } catch (error) {
    return jsonError(error);
  }
}

// POST /api/expenses -- creates a new draft expense owned by the caller.
export async function POST(request: NextRequest) {
  try {
    const { supabase, profile } = await getRequestProfile();
    const body = await request.json();
    const parsed = expenseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 422 });
    }

    const { data, error } = await supabase
      .from("expenses")
      .insert({
        ...parsed.data,
        description: parsed.data.description || null,
        receipt_url: parsed.data.receipt_url || null,
        requested_by: profile.id,
        status: "draft",
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
