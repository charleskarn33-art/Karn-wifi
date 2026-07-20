"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wifi } from "lucide-react";
import { cn } from "@/lib/utils";
import { visibleNavItems } from "@/components/layout/nav-items";
import type { UserRole } from "@/types/database";

export function Sidebar({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const items = visibleNavItems(role);

  return (
    <aside className="hidden lg:flex lg:w-64 lg:shrink-0 lg:flex-col lg:gap-6 lg:p-5">
      <div className="glass-card flex h-full flex-col p-4">
        <Link href="/dashboard" className="mb-6 flex items-center gap-2 px-2 pt-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-lg shadow-brand-500/30">
            <Wifi className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-bold">WiFi Finance</p>
            <p className="text-[11px] text-muted">Business Manager</p>
          </div>
        </Link>

        <nav className="flex-1 space-y-1">
          {items.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-gradient-to-r from-brand-500/15 to-transparent text-brand-600 dark:text-brand-400"
                    : "text-muted hover:bg-black/5 dark:hover:bg-white/5 hover:text-foreground",
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
