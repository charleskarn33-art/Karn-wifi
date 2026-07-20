import { WifiOff } from "lucide-react";

export const metadata = { title: "Offline" };

export default function OfflinePage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-500">
        <WifiOff className="h-7 w-7" />
      </div>
      <div>
        <h1 className="text-lg font-semibold">You&apos;re offline</h1>
        <p className="mt-1 max-w-sm text-sm text-muted">
          Check your internet connection and try again. Financial data always requires a live connection to stay accurate.
        </p>
      </div>
    </div>
  );
}
