import { NextResponse, type NextRequest } from "next/server";
import { getRequestProfile, jsonError, parsePagination } from "@/lib/api-helpers";
import { incomeSchema } from "@/lib/validations/income";

// GET /api/income?search=&from=&to=&page=&pageSize=
// RLS on the `income` table already scopes rows to what the caller may see
// (own entries for staff, all entries for manager/admin) -- this route just
// adds search/filter/pagination convenience on top. Income has no approval
// workflow, so there's no status filter -- every entry is recorded and
// counted immediately.
export async function GET(request: NextRequest) {
  try {
    const { supabase } = await getRequestProfile();
    const { searchParams } = new URL(request.url);
    const { page, pageSize, from, to } = parsePagination(searchParams);
    const search = searchParams.get("search")?.trim();
    const dateFrom = searchParams.get("from");
    const dateTo = searchParams.get("to");

    let query = supabase
      .from("income")
      .select(
        "*, recorded_by_profile:profiles!income_recorded_by_fkey(id, full_name, email)",
        { count: "exact" },
      )
      .order("created_at", { ascending: false })
      .range(from, to);

    if (dateFrom) query = query.gte("entry_date", dateFrom);
    if (dateTo) query = query.lte("entry_date", dateTo);
    if (search) {
      query = query.or(
        `customer_name.ilike.%${search}%,phone_number.ilike.%${search}%,voucher_package.ilike.%${search}%`,
      );
    }

    const { data, error, count } = await query;
    if (error) throw error;

    return NextResponse.json({ data, count, page, pageSize });
  } catch (error) {
    return jsonError(error);
  }
}

// POST /api/income -- records a new income entry, counted immediately (no approval step).
export async function POST(request: NextRequest) {
  try {
    const { supabase, profile } = await getRequestProfile();
    const body = await request.json();
    const parsed = incomeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 422 });
    }

    const { data, error } = await supabase
      .from("income")
      .insert({
        ...parsed.data,
        phone_number: parsed.data.phone_number || null,
        description: parsed.data.description || null,
        recorded_by: profile.id,
        status: "approved",
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
