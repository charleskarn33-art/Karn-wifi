"use client";

import { useState } from "react";
import { History, Eye } from "lucide-react";
import { usePaginatedResource } from "@/hooks/use-paginated-resource";
import { Card } from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/empty-state";
import { TableSkeleton } from "@/components/ui/skeleton";
import { formatDateTime } from "@/lib/utils";
import type { AuditAction, AuditLogEntry } from "@/types/database";

const ACTION_TONE: Record<AuditAction, "brand" | "success" | "danger" | "warning" | "neutral"> = {
  create: "brand",
  update: "neutral",
  submit: "warning",
  approve: "success",
  reject: "danger",
  delete: "danger",
};

export function AuditLogTable() {
  const [search, setSearch] = useState("");
  const [table, setTable] = useState("");
  const [action, setAction] = useState("");
  const [selected, setSelected] = useState<AuditLogEntry | null>(null);

  const { data, count, page, setPage, pageSize, loading } = usePaginatedResource<AuditLogEntry>({
    endpoint: "/api/audit-log",
    params: { search, table, action },
  });

  return (
    <Card>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput value={search} onChange={setSearch} placeholder="Search by user email..." className="sm:max-w-xs" />
        <Select value={table} onChange={(e) => setTable(e.target.value)} className="sm:max-w-[160px]">
          <option value="">All tables</option>
          <option value="income">Income</option>
          <option value="expenses">Expenses</option>
          <option value="profiles">Profiles</option>
        </Select>
        <Select value={action} onChange={(e) => setAction(e.target.value)} className="sm:max-w-[160px]">
          <option value="">All actions</option>
          <option value="create">Create</option>
          <option value="update">Update</option>
          <option value="submit">Submit</option>
          <option value="approve">Approve</option>
          <option value="reject">Reject</option>
          <option value="delete">Delete</option>
        </Select>
      </div>

      {loading ? (
        <TableSkeleton rows={6} />
      ) : data.length === 0 ? (
        <EmptyState icon={History} title="No audit events found" />
      ) : (
        <>
          <MobileCardList>
            {data.map((entry) => (
              <MobileCardRow key={entry.id}>
                <MobileCardHeader>
                  <div className="min-w-0">
                    <p className="font-medium capitalize">{entry.table_name}</p>
                    <p className="text-xs text-muted">{entry.user_email ?? "System"}</p>
                  </div>
                  <Badge tone={ACTION_TONE[entry.action]} className="capitalize">
                    {entry.action}
                  </Badge>
                </MobileCardHeader>
                <MobileCardMeta>
                  <MobileCardMetaItem label="Timestamp" value={formatDateTime(entry.created_at)} />
                  <MobileCardMetaItem label="Record" value={<span className="font-mono">{entry.record_id?.slice(0, 8) ?? "—"}</span>} />
                </MobileCardMeta>
                <MobileCardActions>
                  <Button size="sm" variant="outline" onClick={() => setSelected(entry)}>
                    <Eye className="h-4 w-4" /> Details
                  </Button>
                </MobileCardActions>
              </MobileCardRow>
            ))}
          </MobileCardList>

          <Table>
            <Thead>
              <Tr>
                <Th>Timestamp</Th>
                <Th>User</Th>
                <Th>Action</Th>
                <Th>Table</Th>
                <Th>Record</Th>
                <Th className="text-right">Details</Th>
              </Tr>
            </Thead>
            <Tbody>
              {data.map((entry) => (
                <Tr key={entry.id}>
                  <Td>{formatDateTime(entry.created_at)}</Td>
                  <Td>{entry.user_email ?? "System"}</Td>
                  <Td>
                    <Badge tone={ACTION_TONE[entry.action]} className="capitalize">
                      {entry.action}
                    </Badge>
                  </Td>
                  <Td className="capitalize">{entry.table_name}</Td>
                  <Td className="font-mono text-xs text-muted">{entry.record_id?.slice(0, 8) ?? "—"}</Td>
                  <Td className="text-right">
                    <Button size="icon" variant="outline" onClick={() => setSelected(entry)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
          <Pagination page={page} pageSize={pageSize} total={count} onPageChange={setPage} />
        </>
      )}

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Audit event details" className="sm:max-w-2xl">
        {selected && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <Info label="Action" value={selected.action} />
              <Info label="Table" value={selected.table_name} />
              <Info label="User" value={selected.user_email ?? "System"} />
              <Info label="Time" value={formatDateTime(selected.created_at)} />
            </div>
            {selected.old_data && (
              <div>
                <p className="mb-1 text-xs font-medium text-muted uppercase tracking-wide">Before</p>
                <pre className="max-h-48 overflow-auto rounded-xl bg-black/5 dark:bg-white/5 p-3 text-xs">
                  {JSON.stringify(selected.old_data, null, 2)}
                </pre>
              </div>
            )}
            {selected.new_data && (
              <div>
                <p className="mb-1 text-xs font-medium text-muted uppercase tracking-wide">After</p>
                <pre className="max-h-48 overflow-auto rounded-xl bg-black/5 dark:bg-white/5 p-3 text-xs">
                  {JSON.stringify(selected.new_data, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </Modal>
    </Card>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted uppercase tracking-wide">{label}</p>
      <p className="font-medium capitalize">{value}</p>
    </div>
  );
}
