import type { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { UsersTable } from "@/components/users/users-table";

export const metadata: Metadata = { title: "Users" };

export default async function UsersPage() {
  const profile = await requireRole("admin");

  return (
    <div className="space-y-6 py-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Users</h2>
        <p className="text-sm text-muted mt-1">Manage team accounts and role-based access.</p>
      </div>
      <UsersTable currentUserId={profile.id} />
    </div>
  );
}
