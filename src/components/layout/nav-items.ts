import {
  LayoutDashboard,
  Wallet,
  Receipt,
  CheckSquare,
  BarChart3,
  History,
  Users,
  Settings,
  type LucideIcon,
} from "lucide-react";
import type { UserRole } from "@/types/database";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  roles?: UserRole[];
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/income", label: "Income", icon: Wallet },
  { href: "/expenses", label: "Expenses", icon: Receipt },
  { href: "/approvals", label: "Approvals", icon: CheckSquare, roles: ["manager", "admin"] },
  { href: "/reports", label: "Reports", icon: BarChart3, roles: ["manager", "admin"] },
  { href: "/audit-log", label: "Audit Log", icon: History, roles: ["manager", "admin"] },
  { href: "/users", label: "Users", icon: Users, roles: ["admin"] },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function visibleNavItems(role: UserRole) {
  return NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(role));
}
