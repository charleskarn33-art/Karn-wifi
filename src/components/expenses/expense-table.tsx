"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Send, Trash2, Pencil, Receipt } from "lucide-react";
import { usePaginatedResource } from "@/hooks/use-paginated-resource";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
import { Select } from "@/components/ui/input";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/table";
import {
  MobileCardList,
  MobileCardRow,
  MobileCardHeader,
  MobileCardMeta,
  MobileCardMetaItem,
  MobileCardActions,
} from "@/components/ui/mobile-card-list";
import { Pagination } from "@/components/ui/pagination";
import { ExpenseStatusBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { TableSkeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate } from "@/lib/utils";
import { EXPENSE_CATEGORY_LABELS } from "@/lib/validations/expense";
import type { ExpenseWithRelations, UserRole } from "@/types/database";

export function ExpenseTable({ currentUserId, role }: { currentUserId: string; role: UserRole }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");

  const { data, count, page, setPage, pageSize, loading, refetch } = usePaginatedResource<ExpenseWithRelations>({
    endpoint: "/api/expenses",
    params: { search, status, category },
  });

  async function submitEntry(id: string) {
    const res = await fetch(`/api/expenses/${id}/submit`, { method: "POST" });
    const json = await res.json();
    if (!res.ok) return toast.error(json.error);
    toast.success("Submitted for manager approval");
    refetch();
  }

  async function deleteEntry(id: string) {
    if (!confirm("Delete this expense? This cannot be undone.")) return;
    const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
    const json = await res.json();
    if (!res.ok) return toast.error(json.error);
    toast.success("Expense deleted");
    refetch();
  }

  return (
    <Card>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row">
          <SearchInput value={search} onChange={setSearch} placeholder="Search description..." className="sm:max-w-xs" />
          <Select value={category} onChange={(e) => setCategory(e.target.value)} className="sm:max-w-[180px]">
            <option value="">All categories</option>
            {Object.entries(EXPENSE_CATEGORY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
          <Select value={status} onChange={(e) => setStatus(e.target.value)} className="sm:max-w-[180px]">
            <option value="">All statuses</option>
            <option value="draft">Draft</option>
            <option value="submitted">Submitted</option>
            <option value="manager_approved">Manager Approved</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </Select>
        </div>
        <Button className="w-full sm:w-auto" onClick={() => router.push("/expenses/new")}>
          <Plus className="h-4 w-4" /> New Expense
        </Button>
      </div>

      {loading ? (
        <TableSkeleton rows={6} />
      ) : data.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No expenses found"
          description="Log a business expense to get started."
          action={
            <Button size="sm" onClick={() => router.push("/expenses/new")}>
              <Plus className="h-4 w-4" /> New Expense
            </Button>
          }
        />
      ) : (
        <>
          <MobileCardList>
            {data.map((entry) => {
              const isOwner = entry.requested_by === currentUserId;
              const ownerEditable = isOwner && (entry.status === "draft" || entry.status === "rejected");
              // Admins can correct or delete any expense regardless of its
              // stage; the owner-only Submit action doesn't apply to them.
              const adminEditable = role === "admin" && !ownerEditable;
              return (
                <MobileCardRow key={entry.id}>
                  <MobileCardHeader>
                    <div className="min-w-0">
                      <Link href={`/expenses/${entry.id}`} className="font-medium hover:underline">
                        {EXPENSE_CATEGORY_LABELS[entry.category]}
                      </Link>
                      {entry.description && <p className="text-xs text-muted truncate">{entry.description}</p>}
                    </div>
                    <ExpenseStatusBadge status={entry.status} />
                  </MobileCardHeader>
                  <MobileCardMeta>
                    <MobileCardMetaItem label="Amount" value={formatCurrency(entry.amount)} />
                    <MobileCardMetaItem label="Date" value={formatDate(entry.entry_date)} />
                    {role !== "staff" && (
                      <MobileCardMetaItem label="Requested By" value={entry.requested_by_profile?.full_name ?? "—"} />
                    )}
                  </MobileCardMeta>
                  {(ownerEditable || adminEditable) && (
                    <MobileCardActions>
                      <Button size="icon" variant="outline" title="Edit" onClick={() => router.push(`/expenses/${entry.id}`)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {ownerEditable && entry.status === "draft" && (
                        <Button size="icon" variant="outline" title="Submit" onClick={() => submitEntry(entry.id)}>
                          <Send className="h-4 w-4" />
                        </Button>
                      )}
                      <Button size="icon" variant="outline" title="Delete" onClick={() => deleteEntry(entry.id)}>
                        <Trash2 className="h-4 w-4 text-danger-500" />
                      </Button>
                    </MobileCardActions>
                  )}
                </MobileCardRow>
              );
            })}
          </MobileCardList>

          <Table>
            <Thead>
              <Tr>
                <Th>Category</Th>
                <Th>Description</Th>
                <Th>Amount</Th>
                <Th>Date</Th>
                {role !== "staff" && <Th>Requested By</Th>}
                <Th>Status</Th>
                <Th className="text-right">Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {data.map((entry) => {
                const isOwner = entry.requested_by === currentUserId;
                const ownerEditable = isOwner && (entry.status === "draft" || entry.status === "rejected");
                const adminEditable = role === "admin" && !ownerEditable;
                return (
                  <Tr key={entry.id}>
                    <Td className="font-medium">
                      <Link href={`/expenses/${entry.id}`} className="hover:underline">
                        {EXPENSE_CATEGORY_LABELS[entry.category]}
                      </Link>
                    </Td>
                    <Td className="max-w-[220px] truncate text-muted">{entry.description || "—"}</Td>
                    <Td className="font-medium">{formatCurrency(entry.amount)}</Td>
                    <Td>{formatDate(entry.entry_date)}</Td>
                    {role !== "staff" && <Td>{entry.requested_by_profile?.full_name ?? "—"}</Td>}
                    <Td>
                      <ExpenseStatusBadge status={entry.status} />
                    </Td>
                    <Td>
                      <div className="flex justify-end gap-1.5">
                        {(ownerEditable || adminEditable) && (
                          <>
                            <Button size="icon" variant="outline" title="Edit" onClick={() => router.push(`/expenses/${entry.id}`)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            {ownerEditable && entry.status === "draft" && (
                              <Button size="icon" variant="outline" title="Submit" onClick={() => submitEntry(entry.id)}>
                                <Send className="h-4 w-4" />
                              </Button>
                            )}
                            <Button size="icon" variant="outline" title="Delete" onClick={() => deleteEntry(entry.id)}>
                              <Trash2 className="h-4 w-4 text-danger-500" />
                            </Button>
                          </>
                        )}
                      </div>
                    </Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
          <Pagination page={page} pageSize={pageSize} total={count} onPageChange={setPage} />
        </>
      )}
    </Card>
  );
}
