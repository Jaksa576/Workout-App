import { addDaysToDateKey, formatDateKeyInTimeZone, getWeekdayFromDateKey, resolveSafeTimeZone } from "@/lib/time-zone";
import type { Weekday, WorkoutTemplate } from "@/lib/types";

const weekdayLabels: Record<Weekday, string> = {
  sun: "Sunday",
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
};

export type OrderedWorkout = {
  workout: WorkoutTemplate;
  scheduleLabel: string | null;
  isTodayWorkout: boolean;
};

function getNextOccurrence(workout: WorkoutTemplate, todayKey: string) {
  const uniqueDays = Array.from(new Set(workout.scheduledDays));
  if (!uniqueDays.length) return null;

  for (let offset = 0; offset < 7; offset += 1) {
    const dateKey = addDaysToDateKey(todayKey, offset);
    const weekday = getWeekdayFromDateKey(dateKey);
    if (uniqueDays.includes(weekday)) {
      return { offset, weekday };
    }
  }

  return null;
}

function getScheduleLabel(offset: number, weekday: Weekday, isTodayWorkout: boolean) {
  if (isTodayWorkout) return "TODAY'S WORKOUT";
  if (offset === 1) return "Tomorrow";
  return weekdayLabels[weekday];
}

export function orderWorkoutsForUpcomingSchedule(input: {
  workouts: WorkoutTemplate[];
  recommendedWorkoutId?: string | null;
  now?: Date;
  timeZone?: string | null;
}): OrderedWorkout[] {
  const todayKey = formatDateKeyInTimeZone(input.now ?? new Date(), resolveSafeTimeZone(input.timeZone));
  const today = getWeekdayFromDateKey(todayKey);
  const recommendedWorkoutId = input.recommendedWorkoutId ?? null;
  const hasScheduledToday = input.workouts.some((workout) => workout.scheduledDays.includes(today));

  return input.workouts
    .map((workout, sourceIndex) => {
      const occurrence = getNextOccurrence(workout, todayKey);
      const isTodayWorkout = workout.id === recommendedWorkoutId && (!hasScheduledToday || workout.scheduledDays.includes(today));
      return {
        workout,
        scheduleLabel: occurrence ? getScheduleLabel(occurrence.offset, occurrence.weekday, isTodayWorkout) : isTodayWorkout ? "TODAY'S WORKOUT" : null,
        isTodayWorkout,
        sortBucket: isTodayWorkout ? 0 : occurrence ? 1 : 2,
        sortOffset: occurrence?.offset ?? Number.POSITIVE_INFINITY,
        sourceIndex,
      };
    })
    .sort((a, b) => a.sortBucket - b.sortBucket || a.sortOffset - b.sortOffset || (a.workout.dayOrder ?? a.sourceIndex) - (b.workout.dayOrder ?? b.sourceIndex) || a.sourceIndex - b.sourceIndex)
    .map(({ workout, scheduleLabel, isTodayWorkout }) => ({ workout, scheduleLabel, isTodayWorkout }));
}
