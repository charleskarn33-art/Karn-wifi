import type { UserRole } from "@/types/database";

// Plain constant shared by server and client code -- kept out of lib/auth.ts
// (which imports "server-only") so client components can use it safely.
export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin",
  manager: "Manager",
  staff: "Staff",
};
