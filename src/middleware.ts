import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static, _next/image (static assets)
     * - favicon, icons, manifest, service worker
     */
    "/((?!_next/static|_next/image|icons/|favicon.ico|manifest.webmanifest|sw.js).*)",
  ],
};
