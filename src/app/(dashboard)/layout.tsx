import { requireAuth } from "@/lib/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { MobileNav } from "@/components/layout/mobile-nav";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireAuth();

  return (
    <div className="mx-auto flex min-h-dvh max-w-[1600px]">
      <Sidebar role={profile.role} />
      <div className="flex min-h-dvh flex-1 flex-col">
        <Topbar profile={profile} />
        <main className="flex-1 px-4 pb-24 lg:px-6 lg:pb-8">{children}</main>
      </div>
      <MobileNav role={profile.role} />
    </div>
  );
}
