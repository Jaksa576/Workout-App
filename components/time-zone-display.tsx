"use client";

import { useEffect, useState } from "react";
import { detectBrowserTimeZone, fallbackTimeZone, timeZoneStorageKey } from "@/lib/time-zone";

export function TimeZoneDisplay() {
  const [timeZone, setTimeZone] = useState<string | null>(null);

  useEffect(() => {
    const detectedTimeZone = detectBrowserTimeZone();
    const storedTimeZone = window.localStorage.getItem(timeZoneStorageKey);
    setTimeZone(detectedTimeZone ?? storedTimeZone ?? fallbackTimeZone);
  }, []);

  return (
    <p className="text-sm font-semibold text-copy">
      {timeZone ?? "Detecting timezone..."}
    </p>
  );
}
