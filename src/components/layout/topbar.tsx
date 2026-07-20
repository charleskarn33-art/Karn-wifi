"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Wifi, X } from "lucide-react";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { UserMenu } from "@/components/layout/user-menu";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { visibleNavItems } from "@/components/layout/nav-items";
import { cn } from "@/lib/utils";
import type { Profile } from "@/types/database";

export function Topbar({ profile }: { profile: Profile }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();
  const items = visibleNavItems(profile.role);
  const current = items.find((i) => pathname === i.href || pathname.startsWith(i.href + "/"));

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 bg-[var(--background)]/70 backdrop-blur-md px-4 pt-[calc(1rem_+_env(safe-area-inset-top))] pb-4 lg:bg-transparent lg:backdrop-blur-none lg:px-6 lg:pt-4">
        <div className="flex items-center gap-3 lg:hidden">
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/5"
            aria-label="Open menu"
          >
            <Menu className="h-4 w-4" />
          </button>
        </div>

        <h1 className="hidden text-lg font-semibold tracking-tight lg:block">
          {current?.label ?? "Dashboard"}
        </h1>

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <NotificationBell userId={profile.id} />
          <UserMenu profile={profile} />
        </div>
      </header>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
          <div
            className="glass absolute left-0 top-0 h-full w-72 max-w-[85vw] overflow-y-auto bg-[var(--background)]/95 p-4 animate-fade-in-up"
            style={{
              paddingTop: "calc(1rem + env(safe-area-inset-top))",
              paddingBottom: "calc(1rem + env(safe-area-inset-bottom))",
            }}
          >
            <div className="mb-6 flex items-center justify-between">
              <Link href="/dashboard" className="flex items-center gap-2" onClick={() => setDrawerOpen(false)}>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white">
                  <Wifi className="h-5 w-5" />
                </div>
                <span className="text-sm font-bold">WiFi Finance</span>
              </Link>
              <button onClick={() => setDrawerOpen(false)} aria-label="Close menu">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="space-y-1">
              {items.map((item) => {
                const active = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setDrawerOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium",
                      active
                        ? "bg-brand-500/15 text-brand-600 dark:text-brand-400"
                        : "text-muted hover:bg-black/5 dark:hover:bg-white/5",
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
