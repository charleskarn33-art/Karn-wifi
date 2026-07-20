import { NextResponse, type NextRequest } from "next/server";
import { getRequestProfile, jsonError, parsePagination } from "@/lib/api-helpers";

// GET /api/audit-log?table=&action=&search=&page=&pageSize=
// RLS restricts this table to managers/admins already; this route adds
// filtering/pagination convenience on top of that.
export async function GET(request: NextRequest) {
  try {
    const { supabase } = await getRequestProfile();
    const { searchParams } = new URL(request.url);
    const { page, pageSize, from, to } = parsePagination(searchParams);
    const table = searchParams.get("table");
    const action = searchParams.get("action");
    const search = searchParams.get("search")?.trim();

    let query = supabase
      .from("audit_log")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (table) query = query.eq("table_name", table);
    if (action) query = query.eq("action", action);
    if (search) query = query.ilike("user_email", `%${search}%`);

    const { data, error, count } = await query;
    if (error) throw error;

    return NextResponse.json({ data, count, page, pageSize });
  } catch (error) {
    return jsonError(error);
  }
}
