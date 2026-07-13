import { describe, expect, it } from "vitest";
import {
  addRestTime,
  deriveRestTimerState,
  formatRestTimer,
  idleRestTimerState,
  getRestDurationSeconds,
  parseRestDurationSeconds,
  pauseRestTimer,
  resumeRestTimer,
  shouldEmitRestTimerCompletionFeedback,
  startRestTimer,
} from "@/lib/rest-timer";
import { resolveRestDurationSeconds } from "@/lib/workout-timer-settings";

describe("rest timer", () => {
  it("resolves workout, exercise, global, then app fallback rest precedence", () => {
    expect(resolveRestDurationSeconds({ workoutOverrideSeconds: 120, exerciseRest: "45 sec", globalDefaultSeconds: 90 })).toBe(120);
    expect(resolveRestDurationSeconds({ workoutOverrideSeconds: null, exerciseRest: "45 sec", globalDefaultSeconds: 90 })).toBe(45);
    expect(resolveRestDurationSeconds({ exerciseRest: "as needed", globalDefaultSeconds: 75 })).toBe(75);
    expect(resolveRestDurationSeconds({ exerciseRest: "as needed", globalDefaultSeconds: null })).toBe(90);
  });
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


  it("emits one natural completion feedback event per timer lifecycle", () => {
    const start = new Date("2026-07-12T12:00:00.000Z");
    const timer = startRestTimer({ durationSeconds: 5, now: start, setId: "set-1" });
    const expired = deriveRestTimerState(timer, new Date("2026-07-12T12:00:05.000Z"));
    const emitted = new Set<string>();
    const eventId = shouldEmitRestTimerCompletionFeedback({
      previousTimer: timer,
      currentTimer: expired,
      emittedEventIds: emitted,
    });
    expect(eventId).toBe("2026-07-12T12:00:00.000Z:2026-07-12T12:00:05.000Z:set-1");
    emitted.add(eventId ?? "");
    expect(
      shouldEmitRestTimerCompletionFeedback({
        previousTimer: timer,
        currentTimer: expired,
        emittedEventIds: emitted,
      }),
    ).toBeNull();
  });

  it("does not replay feedback for recovered expired or skipped timers", () => {
    const timer = startRestTimer({
      durationSeconds: 5,
      now: new Date("2026-07-12T12:00:00.000Z"),
      setId: "set-1",
    });
    const recoveredExpired = deriveRestTimerState(
      timer,
      new Date("2026-07-12T12:01:00.000Z"),
    );
    expect(
      shouldEmitRestTimerCompletionFeedback({
        previousTimer: recoveredExpired,
        currentTimer: recoveredExpired,
        emittedEventIds: new Set(),
      }),
    ).toBeNull();
    expect(
      shouldEmitRestTimerCompletionFeedback({
        previousTimer: timer,
        currentTimer: idleRestTimerState,
        emittedEventIds: new Set(),
      }),
    ).toBeNull();
  });

  it("creates a new completion event after extending an expired timer", () => {
    const start = new Date("2026-07-12T12:00:00.000Z");
    const timer = startRestTimer({ durationSeconds: 5, now: start, setId: "set-1" });
    const expired = deriveRestTimerState(timer, new Date("2026-07-12T12:00:05.000Z"));
    const extended = addRestTime(expired, 15, new Date("2026-07-12T12:00:10.000Z"));
    expect(extended.status).toBe("running");
    const expiredAgain = deriveRestTimerState(extended, new Date("2026-07-12T12:00:25.000Z"));
    expect(
      shouldEmitRestTimerCompletionFeedback({
        previousTimer: extended,
        currentTimer: expiredAgain,
        emittedEventIds: new Set(),
      }),
    ).toBe("2026-07-12T12:00:10.000Z:2026-07-12T12:00:25.000Z:set-1");
  });

  it("formats compact countdown text", () => {
    expect(formatRestTimer(77)).toBe("1:17");
    expect(formatRestTimer(0)).toBe("0:00");
  });
});
