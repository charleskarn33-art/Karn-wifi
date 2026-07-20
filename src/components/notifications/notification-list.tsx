"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, Check, CheckCheck, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatDateTime, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { TableSkeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import type { Notification, NotificationType } from "@/types/database";

const TYPE_TONE: Record<NotificationType, "warning" | "success" | "danger" | "neutral"> = {
  pending_approval: "warning",
  approved: "success",
  rejected: "danger",
  info: "neutral",
};

export function NotificationList() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(100);
    setNotifications((data as Notification[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function markRead(id: string) {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  }

  async function markAllRead() {
    await supabase.from("notifications").update({ is_read: true }).eq("is_read", false);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  }

  async function remove(id: string) {
    await supabase.from("notifications").delete().eq("id", id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }

  const relatedHref = (n: Notification) => {
    if (!n.related_table || !n.related_id) return null;
    return `/${n.related_table}/${n.related_id}`;
  };

  if (loading) return <TableSkeleton rows={6} />;

  if (notifications.length === 0) {
    return <EmptyState icon={Bell} title="No notifications yet" description="You'll see approval updates here." />;
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={markAllRead}>
          <CheckCheck className="h-4 w-4" /> Mark all as read
        </Button>
      </div>
      {notifications.map((n) => {
        const href = relatedHref(n);
        return (
          <div
            key={n.id}
            className={cn("glass-card flex items-start justify-between gap-3 p-4", !n.is_read && "ring-1 ring-brand-500/30")}
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium">{n.title}</p>
                <Badge tone={TYPE_TONE[n.type]}>{n.type.replace("_", " ")}</Badge>
              </div>
              <p className="mt-1 text-sm text-muted">{n.message}</p>
              <p className="mt-1.5 text-xs text-muted">{formatDateTime(n.created_at)}</p>
              {href && (
                <Link href={href} className="mt-1.5 inline-block text-xs font-medium text-brand-600 dark:text-brand-400 hover:underline">
                  View record →
                </Link>
              )}
            </div>
            <div className="flex shrink-0 gap-1">
              {!n.is_read && (
                <Button size="icon" variant="outline" title="Mark read" onClick={() => markRead(n.id)}>
                  <Check className="h-4 w-4" />
                </Button>
              )}
              <Button size="icon" variant="outline" title="Delete" onClick={() => remove(n.id)}>
                <Trash2 className="h-4 w-4 text-danger-500" />
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
