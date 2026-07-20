import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth";
import { NotificationList } from "@/components/notifications/notification-list";

export const metadata: Metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  await requireAuth();

  return (
    <div className="space-y-6 py-6 max-w-2xl">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Notifications</h2>
        <p className="text-sm text-muted mt-1">Pending approvals, approvals, and rejections.</p>
      </div>
      <NotificationList />
    </div>
  );
}
