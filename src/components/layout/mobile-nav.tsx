"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { visibleNavItems } from "@/components/layout/nav-items";
import type { UserRole } from "@/types/database";

export function MobileNav({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const items = visibleNavItems(role).slice(0, 5);

  return (
    <nav
      className="glass fixed inset-x-3 z-40 flex items-center justify-around rounded-2xl px-2 py-2 lg:hidden"
      style={{ bottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
    >
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 rounded-xl py-1.5 text-[10px] font-medium transition-colors",
              active ? "text-brand-600 dark:text-brand-400" : "text-muted",
            )}
          >
            <item.icon className={cn("h-5 w-5", active && "drop-shadow-sm")} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
