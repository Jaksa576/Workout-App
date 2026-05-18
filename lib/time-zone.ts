import type { Weekday } from "@/lib/types";

export const timeZoneCookieName = "workout-app-time-zone";
export const timeZoneStorageKey = "workout-app-time-zone";
export const fallbackTimeZone = "UTC";

const dateKeyPattern = /^\d{4}-\d{2}-\d{2}$/;
const weekdayByIndex: Weekday[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

export function isValidTimeZone(value: string | null | undefined): value is string {
  if (!value) {
    return false;
  }

  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value }).format();
    return true;
  } catch {
    return false;
  }
}

export function resolveSafeTimeZone(value: string | null | undefined) {
  return isValidTimeZone(value) ? value : fallbackTimeZone;
}

export function detectBrowserTimeZone() {
  if (typeof Intl === "undefined") {
    return null;
  }

  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return isValidTimeZone(timeZone) ? timeZone : null;
}

export function formatDateKeyInTimeZone(date = new Date(), timeZone = fallbackTimeZone) {
  const safeTimeZone = resolveSafeTimeZone(timeZone);
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: safeTimeZone,
    year: "numeric"
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return `${values.year}-${values.month}-${values.day}`;
}

export function isValidDateKey(value: string) {
  if (!dateKeyPattern.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function addDaysToDateKey(dateKey: string, days: number) {
  const date = new Date(`${dateKey}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function getWeekdayFromDateKey(dateKey: string): Weekday {
  const date = new Date(`${dateKey}T00:00:00.000Z`);
  return weekdayByIndex[date.getUTCDay()];
}

export function formatShortDateLabel(dateKey: string) {
  return new Date(`${dateKey}T00:00:00.000Z`).toLocaleDateString("en-US", {
    day: "numeric",
    month: "numeric",
    timeZone: "UTC"
  });
}

export function formatWeekLabelFromDateKey(dateKey: string) {
  return new Date(`${dateKey}T00:00:00.000Z`).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    timeZone: "UTC"
  });
}

export function getMondayDateKey(dateKey: string) {
  const weekday = getWeekdayFromDateKey(dateKey);
  const daysFromMonday = weekday === "sun" ? 6 : weekdayByIndex.indexOf(weekday) - 1;
  return addDaysToDateKey(dateKey, -daysFromMonday);
}

export function getDateKeyDaysAgo(daysAgo: number, timeZone = fallbackTimeZone, now = new Date()) {
  return addDaysToDateKey(formatDateKeyInTimeZone(now, timeZone), -daysAgo);
}

export function isPastOrTodayDateKey(value: string, timeZone = fallbackTimeZone, now = new Date()) {
  return isValidDateKey(value) && value <= formatDateKeyInTimeZone(now, timeZone);
}
