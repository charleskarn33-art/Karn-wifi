import "server-only";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

/** Loads the authenticated user's profile for use inside a Route Handler. */
export async function getRequestProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new ApiError("Not authenticated", 401);

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) throw new ApiError("Profile not found", 404);

  return { supabase, profile: profile as Profile };
}

function hasStringMessage(value: unknown): value is { message: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    "message" in value &&
    typeof (value as { message: unknown }).message === "string"
  );
}

export function jsonError(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  // Postgres errors raised via RAISE EXCEPTION in workflow triggers (and
  // RLS policy violations) surface here as the `error` from a Supabase
  // query -- postgrest-js only wraps that in a real `Error` instance when
  // `.throwOnError()` is used, which we don't; otherwise it's a plain
  // { message, details, hint, code } object. Check for a string `message`
  // on ANY object, not just `instanceof Error`, or these get silently
  // replaced with a useless generic fallback.
  const message = error instanceof Error || hasStringMessage(error) ? error.message : "Unexpected error";
  return NextResponse.json({ error: message }, { status: 400 });
}

export function parsePagination(searchParams: URLSearchParams) {
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize")) || 10));
  return { page, pageSize, from: (page - 1) * pageSize, to: (page - 1) * pageSize + pageSize - 1 };
}
