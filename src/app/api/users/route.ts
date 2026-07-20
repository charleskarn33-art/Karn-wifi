import { NextResponse, type NextRequest } from "next/server";
import { getRequestProfile, jsonError, ApiError } from "@/lib/api-helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { createUserSchema } from "@/lib/validations/user";

// GET /api/users -- list all profiles (admin only management view).
export async function GET() {
  try {
    const { supabase, profile } = await getRequestProfile();
    if (profile.role !== "admin") throw new ApiError("Admins only", 403);

    const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json({ data });
  } catch (error) {
    return jsonError(error);
  }
}

// POST /api/users -- admin provisions a new staff/manager/admin account.
// Uses the service-role client only for the auth.users creation step, which
// requires elevated privileges; the resulting profile row's role is then
// set explicitly (handle_new_user always defaults new signups to 'staff').
export async function POST(request: NextRequest) {
  try {
    const { profile } = await getRequestProfile();
    if (profile.role !== "admin") throw new ApiError("Admins only", 403);

    const body = await request.json();
    const parsed = createUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 422 });
    }

    const admin = createAdminClient();
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email: parsed.data.email,
      password: parsed.data.password,
      email_confirm: true,
      user_metadata: { full_name: parsed.data.full_name },
    });
    if (createError) throw createError;

    const { error: profileError } = await admin
      .from("profiles")
      .update({ role: parsed.data.role, full_name: parsed.data.full_name })
      .eq("id", created.user.id);
    if (profileError) throw profileError;

    return NextResponse.json({ data: { id: created.user.id } }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
