import { describe, expect, it } from "vitest";
import {
  addRestTime,
  deriveRestTimerState,
  formatRestTimer,
  getRestDurationSeconds,
  parseRestDurationSeconds,
  pauseRestTimer,
  resumeRestTimer,
  startRestTimer,
} from "@/lib/rest-timer";

describe("rest timer", () => {
  it("parses prescribed rest with deterministic fallback precedence", () => {
    expect(parseRestDurationSeconds("90 sec")).toBe(90);
    expect(parseRestDurationSeconds("2-3 min")).toBe(180);
    expect(parseRestDurationSeconds("As needed")).toBeNull();
    expect(
      getRestDurationSeconds({
        sessionOverrideSeconds: null,
        exerciseRest: "",
        userDefaultSeconds: 75,
      }),
    ).toBe(75);
    expect(
      getRestDurationSeconds({
        sessionOverrideSeconds: 45,
        exerciseRest: "90 sec",
        userDefaultSeconds: 75,
      }),
    ).toBe(45);
  });

  it("uses absolute timestamps for running, expiry, pause, resume, and add time", () => {
    const start = new Date("2026-07-12T12:00:00.000Z");
    const timer = startRestTimer({
      durationSeconds: 90,
      now: start,
      exerciseEntryId: "ex1",
      exerciseName: "Goblet Squat",
      autoStarted: true,
      setId: "s1",
    });
    expect(
      deriveRestTimerState(timer, new Date("2026-07-12T12:00:30.000Z"))
        .remainingSeconds,
    ).toBe(60);
    const paused = pauseRestTimer(timer, new Date("2026-07-12T12:00:30.000Z"));
    expect(paused.status).toBe("paused");
    expect(paused.remainingSeconds).toBe(60);
    const resumed = resumeRestTimer(
      paused,
      new Date("2026-07-12T12:01:00.000Z"),
    );
    expect(resumed.endsAt).toBe("2026-07-12T12:02:00.000Z");
    const added = addRestTime(
      resumed,
      15,
      new Date("2026-07-12T12:01:30.000Z"),
    );
    expect(added.remainingSeconds).toBe(45);
    expect(
      deriveRestTimerState(added, new Date("2026-07-12T12:02:15.000Z")).status,
    ).toBe("expired");
  });

  it("formats compact countdown text", () => {
    expect(formatRestTimer(77)).toBe("1:17");
    expect(formatRestTimer(0)).toBe("0:00");
  });
});
