import { describe, expect, it } from "vitest";
import { orderWorkoutsForUpcomingSchedule } from "@/lib/workout-schedule";
import type { WorkoutTemplate } from "@/lib/types";

function workout(input: Partial<WorkoutTemplate> & Pick<WorkoutTemplate, "id" | "name">): WorkoutTemplate {
  return {
    phaseId: "phase-1",
    focus: "Focus",
    summary: "Summary",
    readiness: "Ready",
    scheduledDays: [],
    exercises: [],
    ...input,
  };
}

const monday = new Date("2026-07-13T12:00:00.000Z");

describe("orderWorkoutsForUpcomingSchedule", () => {
  it("puts the recommended local-today workout first and labels it", () => {
    const result = orderWorkoutsForUpcomingSchedule({
      workouts: [workout({ id: "wed", name: "Wed", scheduledDays: ["wed"] }), workout({ id: "mon", name: "Mon", scheduledDays: ["mon"] })],
      recommendedWorkoutId: "mon",
      now: monday,
      timeZone: "UTC",
    });

    expect(result.map((item) => item.workout.id)).toEqual(["mon", "wed"]);
    expect(result[0].scheduleLabel).toBe("TODAY'S WORKOUT");
  });

  it("orders tomorrow, later week, then wrapped workouts", () => {
    const result = orderWorkoutsForUpcomingSchedule({
      workouts: [
        workout({ id: "sun", name: "Sun", scheduledDays: ["sun"] }),
        workout({ id: "thu", name: "Thu", scheduledDays: ["thu"] }),
        workout({ id: "tue", name: "Tue", scheduledDays: ["tue"] }),
        workout({ id: "mon", name: "Mon", scheduledDays: ["mon"] }),
      ],
      recommendedWorkoutId: "mon",
      now: monday,
      timeZone: "UTC",
    });

    expect(result.map((item) => item.workout.id)).toEqual(["mon", "tue", "thu", "sun"]);
    expect(result[1].scheduleLabel).toBe("Tomorrow");
    expect(result[2].scheduleLabel).toBe("Thursday");
    expect(result[3].scheduleLabel).toBe("Sunday");
  });

  it("uses the next occurrence for workouts assigned to multiple days", () => {
    const result = orderWorkoutsForUpcomingSchedule({
      workouts: [workout({ id: "multi", name: "Multi", scheduledDays: ["sun", "tue"] })],
      now: monday,
      timeZone: "UTC",
    });

    expect(result[0].scheduleLabel).toBe("Tomorrow");
  });

  it("keeps unscheduled workouts last by day order then source order without fabricated labels", () => {
    const result = orderWorkoutsForUpcomingSchedule({
      workouts: [
        workout({ id: "b", name: "B", dayOrder: 2 }),
        workout({ id: "a", name: "A", dayOrder: 1 }),
      ],
      now: monday,
      timeZone: "UTC",
    });

    expect(result.map((item) => item.workout.id)).toEqual(["a", "b"]);
    expect(result.map((item) => item.scheduleLabel)).toEqual([null, null]);
  });
});
