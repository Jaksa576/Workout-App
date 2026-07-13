"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch((error: unknown) => {
      if (process.env.NODE_ENV !== "production") {
        console.warn("Service worker registration failed", error);
      }
    });
  }, []);

  return null;
}
