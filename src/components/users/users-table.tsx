"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus, Trash2, UserCog, Users as UsersIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input, Label, FieldError, Select } from "@/components/ui/input";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/table";
import {
  MobileCardList,
  MobileCardRow,
  MobileCardHeader,
  MobileCardMeta,
  MobileCardMetaItem,
  MobileCardActions,
} from "@/components/ui/mobile-card-list";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { TableSkeleton } from "@/components/ui/skeleton";
import { initials, formatDate } from "@/lib/utils";
import { ROLE_LABELS } from "@/lib/roles";
import { createUserSchema, type CreateUserFormValues } from "@/lib/validations/user";
import type { Profile, UserRole } from "@/types/database";

export function UsersTable({ currentUserId }: { currentUserId: string }) {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/users");
    const json = await res.json();
    if (res.ok) setUsers(json.data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function updateRole(id: string, role: UserRole) {
    const res = await fetch(`/api/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    const json = await res.json();
    if (!res.ok) return toast.error(json.error);
    toast.success("Role updated");
    load();
  }

  async function toggleActive(id: string, is_active: boolean) {
    const res = await fetch(`/api/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active }),
    });
    const json = await res.json();
    if (!res.ok) return toast.error(json.error);
    toast.success(is_active ? "User activated" : "User deactivated");
    load();
  }

  async function removeUser(id: string) {
    if (!confirm("Permanently delete this user? This cannot be undone.")) return;
    const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
    const json = await res.json();
    if (!res.ok) return toast.error(json.error);
    toast.success("User deleted");
    load();
  }

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted">{users.length} user{users.length !== 1 ? "s" : ""}</p>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" /> New User
        </Button>
      </div>

      {loading ? (
        <TableSkeleton rows={4} />
      ) : users.length === 0 ? (
        <EmptyState icon={UsersIcon} title="No users yet" />
      ) : (
        <>
        <MobileCardList>
          {users.map((u) => (
            <MobileCardRow key={u.id}>
              <MobileCardHeader>
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-accent-500 text-xs font-semibold text-white">
                    {initials(u.full_name || u.email)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{u.full_name || "—"}</p>
                    <p className="truncate text-xs text-muted">{u.email}</p>
                  </div>
                </div>
                <button onClick={() => toggleActive(u.id, !u.is_active)} disabled={u.id === currentUserId} className="shrink-0">
                  <Badge tone={u.is_active ? "success" : "neutral"}>{u.is_active ? "Active" : "Inactive"}</Badge>
                </button>
              </MobileCardHeader>
              <MobileCardMeta>
                <MobileCardMetaItem
                  label="Role"
                  value={
                    <Select
                      value={u.role}
                      disabled={u.id === currentUserId}
                      onChange={(e) => updateRole(u.id, e.target.value as UserRole)}
                      className="mt-0.5 w-full py-1.5 text-xs"
                    >
                      {Object.entries(ROLE_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </Select>
                  }
                />
                <MobileCardMetaItem label="Joined" value={formatDate(u.created_at)} />
              </MobileCardMeta>
              <MobileCardActions>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={u.id === currentUserId}
                  onClick={() => removeUser(u.id)}
                >
                  <Trash2 className="h-4 w-4 text-danger-500" /> Delete
                </Button>
              </MobileCardActions>
            </MobileCardRow>
          ))}
        </MobileCardList>

        <Table>
          <Thead>
            <Tr>
              <Th>User</Th>
              <Th>Role</Th>
              <Th>Status</Th>
              <Th>Joined</Th>
              <Th className="text-right">Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {users.map((u) => (
              <Tr key={u.id}>
                <Td>
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-accent-500 text-xs font-semibold text-white">
                      {initials(u.full_name || u.email)}
                    </span>
                    <div>
                      <p className="font-medium">{u.full_name || "—"}</p>
                      <p className="text-xs text-muted">{u.email}</p>
                    </div>
                  </div>
                </Td>
                <Td>
                  <Select
                    value={u.role}
                    disabled={u.id === currentUserId}
                    onChange={(e) => updateRole(u.id, e.target.value as UserRole)}
                    className="w-36 py-1.5"
                  >
                    {Object.entries(ROLE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </Select>
                </Td>
                <Td>
                  <button onClick={() => toggleActive(u.id, !u.is_active)} disabled={u.id === currentUserId}>
                    <Badge tone={u.is_active ? "success" : "neutral"}>{u.is_active ? "Active" : "Inactive"}</Badge>
                  </button>
                </Td>
                <Td>{formatDate(u.created_at)}</Td>
                <Td className="text-right">
                  <Button
                    size="icon"
                    variant="outline"
                    disabled={u.id === currentUserId}
                    onClick={() => removeUser(u.id)}
                    title="Delete user"
                  >
                    <Trash2 className="h-4 w-4 text-danger-500" />
                  </Button>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
        </>
      )}

      <CreateUserModal open={createOpen} onClose={() => setCreateOpen(false)} onCreated={load} />
    </Card>
  );
}

function CreateUserModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateUserFormValues>({ resolver: zodResolver(createUserSchema), defaultValues: { role: "staff" } });

  async function onSubmit(values: CreateUserFormValues) {
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const json = await res.json();
    if (!res.ok) return toast.error(json.error);
    toast.success("User created");
    reset();
    onClose();
    onCreated();
  }

  return (
    <Modal open={open} onClose={onClose} title="Create user" description="Provision a new team member with a role.">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="full_name">Full name</Label>
          <Input id="full_name" {...register("full_name")} />
          <FieldError>{errors.full_name?.message}</FieldError>
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" {...register("email")} />
          <FieldError>{errors.email?.message}</FieldError>
        </div>
        <div>
          <Label htmlFor="password">Temporary password</Label>
          <Input id="password" type="text" {...register("password")} />
          <FieldError>{errors.password?.message}</FieldError>
        </div>
        <div>
          <Label htmlFor="role">Role</Label>
          <Select id="role" {...register("role")}>
            <option value="staff">Staff</option>
            <option value="manager">Manager</option>
            <option value="admin">Admin</option>
          </Select>
          <FieldError>{errors.role?.message}</FieldError>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            <UserCog className="h-4 w-4" /> Create user
          </Button>
        </div>
      </form>
    </Modal>
  );
}
