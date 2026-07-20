"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Send, Trash2, Pencil, Wallet } from "lucide-react";
import { usePaginatedResource } from "@/hooks/use-paginated-resource";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
import { Select } from "@/components/ui/input";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { IncomeStatusBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { TableSkeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { IncomeWithRelations, UserRole } from "@/types/database";

export function IncomeTable({ currentUserId, role }: { currentUserId: string; role: UserRole }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const { data, count, page, setPage, pageSize, loading, refetch } = usePaginatedResource<IncomeWithRelations>({
    endpoint: "/api/income",
    params: { search, status },
  });

  async function submitEntry(id: string) {
    const res = await fetch(`/api/income/${id}/submit`, { method: "POST" });
    const json = await res.json();
    if (!res.ok) return toast.error(json.error);
    toast.success("Submitted for approval");
    refetch();
  }

  async function deleteEntry(id: string) {
    if (!confirm("Delete this draft income entry?")) return;
    const res = await fetch(`/api/income/${id}`, { method: "DELETE" });
    const json = await res.json();
    if (!res.ok) return toast.error(json.error);
    toast.success("Draft deleted");
    refetch();
  }

  return (
    <Card>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row">
          <SearchInput value={search} onChange={setSearch} placeholder="Search customer, phone, package..." className="sm:max-w-xs" />
          <Select value={status} onChange={(e) => setStatus(e.target.value)} className="sm:max-w-[180px]">
            <option value="">All statuses</option>
            <option value="draft">Draft</option>
            <option value="submitted">Submitted</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </Select>
        </div>
        <Button onClick={() => router.push("/income/new")}>
          <Plus className="h-4 w-4" /> New Income
        </Button>
      </div>

      {loading ? (
        <TableSkeleton rows={6} />
      ) : data.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="No income entries found"
          description="Record your first WiFi voucher sale to get started."
          action={
            <Button size="sm" onClick={() => router.push("/income/new")}>
              <Plus className="h-4 w-4" /> New Income
            </Button>
          }
        />
      ) : (
        <>
          <Table>
            <Thead>
              <Tr>
                <Th>Customer</Th>
                <Th>Package</Th>
                <Th>Amount</Th>
                <Th>Method</Th>
                <Th>Date</Th>
                {role !== "staff" && <Th>Recorded By</Th>}
                <Th>Status</Th>
                <Th className="text-right">Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {data.map((entry) => {
                const isOwner = entry.recorded_by === currentUserId;
                const editable = isOwner && (entry.status === "draft" || entry.status === "rejected");
                return (
                  <Tr key={entry.id}>
                    <Td className="font-medium">
                      <Link href={`/income/${entry.id}`} className="hover:underline">
                        {entry.customer_name}
                      </Link>
                      {entry.phone_number && <p className="text-xs text-muted">{entry.phone_number}</p>}
                    </Td>
                    <Td>{entry.voucher_package}</Td>
                    <Td className="font-medium">{formatCurrency(entry.amount)}</Td>
                    <Td className="capitalize">{entry.payment_method.replace("_", " ")}</Td>
                    <Td>{formatDate(entry.entry_date)}</Td>
                    {role !== "staff" && <Td>{entry.recorded_by_profile?.full_name ?? "—"}</Td>}
                    <Td>
                      <IncomeStatusBadge status={entry.status} />
                    </Td>
                    <Td>
                      <div className="flex justify-end gap-1.5">
                        {editable && (
                          <>
                            <Button size="icon" variant="outline" title="Edit" onClick={() => router.push(`/income/${entry.id}`)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            {entry.status === "draft" && (
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
