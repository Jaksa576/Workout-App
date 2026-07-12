import { describe, expect, it } from "vitest";
import {
  activeWorkoutAutoStartRestDefault,
  hasUnfinishedVisibleSets,
  selectExerciseForManualRest,
} from "@/lib/active-workout-rest";
import type { WorkoutSetInput, WorkoutTemplate } from "@/lib/types";

function makeWorkout(): WorkoutTemplate {
  return {
    id: "workout-a",
    phaseId: "phase-a",
    name: "Strength",
    focus: "Strength",
    summary: "Summary",
    readiness: "Ready",
    scheduledDays: ["mon"],
    exercises: [
      {
        id: "squat",
        name: "Squat",
        sets: 3,
        reps: "5",
        rest: "2 min",
        coachingNote: "Brace.",
      },
      {
        id: "press",
        name: "Press",
        sets: 2,
        reps: "8",
        rest: "60 sec",
        coachingNote: "Press.",
      },
    ],
  };
}

function row(input: Partial<WorkoutSetInput> & Pick<WorkoutSetInput, "exerciseEntryId" | "setId" | "setOrder">): WorkoutSetInput {
  return {
    prescribedSetIndex: null,
    setKind: "prescribed",
    status: "incomplete",
    actualLoad: null,
    actualReps: null,
    actualDurationSeconds: null,
    actualDistance: null,
    ...input,
  };
}

describe("active workout rest selection", () => {
  it("defaults new workout drafts to automatic rest starts", () => {
    expect(activeWorkoutAutoStartRestDefault).toBe(true);
  });

  it("keeps manual rest on the current exercise after set 1 of 3 is completed and the timer is skipped", () => {
    const workout = makeWorkout();
    const selected = selectExerciseForManualRest({
      workout,
      currentExerciseId: "squat",
      setResults: [
        row({
          exerciseEntryId: "squat",
          setId: "squat:prescribed:0",
          setOrder: 0,
          prescribedSetIndex: 0,
          status: "completed",
        }),
      ],
    });

    expect(selected?.id).toBe("squat");
  });

  it("moves manual rest to the first incomplete exercise when the current exercise is fully complete", () => {
    const workout = makeWorkout();
    const selected = selectExerciseForManualRest({
      workout,
      currentExerciseId: "squat",
      setResults: [0, 1, 2].map((index) =>
        row({
          exerciseEntryId: "squat",
          setId: `squat:prescribed:${index}`,
          setOrder: index,
          prescribedSetIndex: index,
          status: "completed",
        }),
      ),
    });

    expect(selected?.id).toBe("press");
  });

  it("counts unfinished user-added sets as visible sets", () => {
    const workout = makeWorkout();
    const squat = workout.exercises[0];
    const setResults = [0, 1, 2].map((index) =>
      row({
        exerciseEntryId: "squat",
        setId: `squat:prescribed:${index}`,
        setOrder: index,
        prescribedSetIndex: index,
        status: "completed",
      }),
    );
    setResults.push(
      row({
        exerciseEntryId: "squat",
        setId: "squat:added:1",
        setOrder: 3,
        setKind: "added",
        prescribedSetIndex: null,
        status: "incomplete",
      }),
    );

    expect(hasUnfinishedVisibleSets(squat, setResults)).toBe(true);
    expect(
      selectExerciseForManualRest({
        workout,
        currentExerciseId: "squat",
        setResults,
      })?.id,
    ).toBe("squat");
  });

  it("falls back to the current exercise when all sets are complete before Finish", () => {
    const workout = makeWorkout();
    const setResults = workout.exercises.flatMap((exercise) =>
      Array.from({ length: exercise.sets }, (_, index) =>
        row({
          exerciseEntryId: exercise.id,
          setId: `${exercise.id}:prescribed:${index}`,
          setOrder: index,
          prescribedSetIndex: index,
          status: "completed",
        }),
      ),
    );

    expect(
      selectExerciseForManualRest({
        workout,
        currentExerciseId: "press",
        setResults,
      })?.id,
    ).toBe("press");
  });
});
