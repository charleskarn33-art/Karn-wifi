import { NextResponse, type NextRequest } from "next/server";
import { getRequestProfile, jsonError, ApiError } from "@/lib/api-helpers";
import { createAdminClient } from "@/lib/supabase/admin";

interface Params {
  params: Promise<{ id: string }>;
}

// PATCH /api/users/:id -- admin updates a user's role or active status.
// Goes through the normal session-scoped client so RLS (profiles_update_admin)
// and the guard_profile_privileges trigger still apply as a defense in depth.
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const { supabase, profile } = await getRequestProfile();
    if (profile.role !== "admin") throw new ApiError("Admins only", 403);

    const body = await request.json();
    const updates: Record<string, unknown> = {};
    if (body.role) updates.role = body.role;
    if (typeof body.is_active === "boolean") updates.is_active = body.is_active;
    if (body.full_name) updates.full_name = body.full_name;

    const { data, error } = await supabase.from("profiles").update(updates).eq("id", id).select().single();
    if (error) throw error;
    return NextResponse.json({ data });
  } catch (error) {
    return jsonError(error);
  }
}

// DELETE /api/users/:id -- admin permanently removes a user (auth.users cascade removes the profile).
export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const { profile } = await getRequestProfile();
    if (profile.role !== "admin") throw new ApiError("Admins only", 403);
    if (id === profile.id) throw new ApiError("You cannot delete your own account", 400);

    const admin = createAdminClient();
    const { error } = await admin.auth.admin.deleteUser(id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
