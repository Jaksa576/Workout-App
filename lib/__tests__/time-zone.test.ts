import { describe, expect, it } from "vitest";
import {
  addDaysToDateKey,
  fallbackTimeZone,
  formatDateKeyInTimeZone,
  getWeekdayFromDateKey,
  isPastOrTodayDateKey,
  resolveSafeTimeZone
} from "@/lib/time-zone";
import { getTodayDateString, isValidCompletedOn } from "@/lib/validation";

describe("timezone date helpers", () => {
  it("formats today as a local date key in the requested timezone", () => {
    const utcMonday = new Date("2026-05-18T02:30:00.000Z");

    expect(formatDateKeyInTimeZone(utcMonday, "UTC")).toBe("2026-05-18");
    expect(formatDateKeyInTimeZone(utcMonday, "America/Los_Angeles")).toBe("2026-05-17");
    expect(getTodayDateString("America/Los_Angeles", utcMonday)).toBe("2026-05-17");
  });

  it("derives weekday and adjacent date keys from local calendar dates", () => {
    expect(getWeekdayFromDateKey("2026-05-17")).toBe("sun");
    expect(addDaysToDateKey("2026-05-17", 1)).toBe("2026-05-18");
    expect(addDaysToDateKey("2026-05-17", -1)).toBe("2026-05-16");
  });

  it("falls back safely for missing or invalid timezones", () => {
    const utcMonday = new Date("2026-05-18T02:30:00.000Z");

    expect(resolveSafeTimeZone("Not/AZone")).toBe(fallbackTimeZone);
    expect(formatDateKeyInTimeZone(utcMonday, "Not/AZone")).toBe("2026-05-18");
  });

  it("validates completed-on against local today instead of UTC today", () => {
    const utcMonday = new Date("2026-05-18T02:30:00.000Z");

    expect(isPastOrTodayDateKey("2026-05-17", "America/Los_Angeles", utcMonday)).toBe(true);
    expect(isValidCompletedOn("2026-05-17", "America/Los_Angeles", utcMonday)).toBe(true);
    expect(isValidCompletedOn("2026-05-18", "America/Los_Angeles", utcMonday)).toBe(false);
  });
});
