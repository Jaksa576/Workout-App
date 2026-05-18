"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  detectBrowserTimeZone,
  timeZoneCookieName,
  timeZoneStorageKey
} from "@/lib/time-zone";

function readCookie(name: string) {
  const cookie = document.cookie
    .split("; ")
    .find((item) => item.startsWith(`${name}=`));

  return cookie ? decodeURIComponent(cookie.slice(name.length + 1)) : null;
}

function writeTimeZoneCookie(timeZone: string) {
  document.cookie = `${timeZoneCookieName}=${encodeURIComponent(
    timeZone
  )}; Max-Age=31536000; Path=/; SameSite=Lax`;
}

export function TimeZoneDetector() {
  const router = useRouter();

  useEffect(() => {
    const timeZone = detectBrowserTimeZone();

    if (!timeZone) {
      return;
    }

    const currentCookieValue = readCookie(timeZoneCookieName);
    const currentStoredValue = window.localStorage.getItem(timeZoneStorageKey);

    if (currentStoredValue !== timeZone) {
      window.localStorage.setItem(timeZoneStorageKey, timeZone);
    }

    if (currentCookieValue === timeZone) {
      return;
    }

    writeTimeZoneCookie(timeZone);
    router.refresh();
  }, [router]);

  return null;
}
