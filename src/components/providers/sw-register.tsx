"use client";

import { useEffect } from "react";

/** Registers the PWA service worker once the app has hydrated. */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      process.env.NODE_ENV === "production"
    ) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Non-fatal: app still works fully online without the SW.
      });
    }
  }, []);

  return null;
}
