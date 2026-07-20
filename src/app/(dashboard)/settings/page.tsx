import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ProfileSettingsForm } from "@/components/settings/profile-settings-form";
import { PasswordForm } from "@/components/settings/password-form";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const profile = await requireAuth();

  return (
    <div className="space-y-6 py-6 max-w-2xl">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Settings</h2>
        <p className="text-sm text-muted mt-1">Manage your profile, security, and appearance preferences.</p>
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Update your personal details.</CardDescription>
          </div>
        </CardHeader>
        <ProfileSettingsForm profile={profile} />
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Security</CardTitle>
            <CardDescription>Change your account password.</CardDescription>
          </div>
        </CardHeader>
        <PasswordForm />
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>Switch between light and dark mode.</CardDescription>
          </div>
          <ThemeToggle />
        </CardHeader>
      </Card>
    </div>
  );
}
