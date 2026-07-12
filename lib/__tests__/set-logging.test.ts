import { describe, expect, it } from "vitest";
import {
  applyMetricSetEdit,
  buildCanonicalMetricSetRows,
  calculateSetProgress,
  formatDurationInput,
  getInitialSetValues,
  isSetCompleteable,
  isSuppliedMetricValuesValid,
  parseDeterministicPrescriptionReps,
  parseDurationInput,
} from "@/lib/set-logging";
import type { WorkoutSetInput } from "@/lib/types";

function row(overrides: Partial<WorkoutSetInput> = {}): WorkoutSetInput {
  return {
    exerciseEntryId: "exercise-1",
    setId: "local-row",
    setOrder: 0,
    prescribedSetIndex: 0,
    setKind: "prescribed",
    status: "completed",
    actualLoad: 25,
    actualReps: 8,
    ...overrides,
  };
}

describe("optional metric set completion", () => {
  it("allows blank weight_reps metrics to be completed", () => {
    expect(isSuppliedMetricValuesValid("weight_reps", row({ actualLoad: null, actualReps: null }))).toBe(true);
  });

  it("allows blank reps_only metrics to be completed", () => {
    expect(isSuppliedMetricValuesValid("reps_only", row({ actualLoad: null, actualReps: null }))).toBe(true);
  });

  it("keeps a completed row completed when load or reps are cleared", () => {
    expect(applyMetricSetEdit("weight_reps", row(), { actualLoad: null })).toMatchObject({ status: "completed", actualLoad: null });
    expect(applyMetricSetEdit("weight_reps", row(), { actualReps: null })).toMatchObject({ status: "completed", actualReps: null });
  });

  it("supports deliberate complete/uncomplete progress toggles", () => {
    expect(
      calculateSetProgress({
        exercises: [{ id: "exercise-1", sets: 1, trackingType: "weight_reps" }],
        setResults: [row({ status: "completed", actualLoad: null, actualReps: null })],
        checkedExerciseIds: [],
      }),
    ).toEqual({ completed: 1, total: 1 });
    expect(
      calculateSetProgress({
        exercises: [{ id: "exercise-1", sets: 1, trackingType: "weight_reps" }],
        setResults: [row({ status: "incomplete", actualLoad: null, actualReps: null })],
        checkedExerciseIds: [],
      }),
    ).toEqual({ completed: 0, total: 1 });
  });

  it("retains numeric validation when values are supplied", () => {
    expect(isSuppliedMetricValuesValid("weight_reps", row({ actualLoad: -1 }))).toBe(false);
    expect(isSuppliedMetricValuesValid("reps_only", row({ actualLoad: 10 }))).toBe(false);
    expect(isSuppliedMetricValuesValid("reps_only", row({ actualLoad: null, actualReps: 2.5 }))).toBe(false);
    expect(isSuppliedMetricValuesValid("weight_reps", row({ actualLoad: 20.5, actualReps: 8 }))).toBe(true);
  });
});

describe("duration and distance tracking", () => {
  it("parses and formats human-readable durations", () => {
    expect(parseDurationInput("0:45")).toBe(45);
    expect(parseDurationInput("1:02:03")).toBe(3723);
    expect(parseDurationInput("1:99")).toBeNaN();
    expect(formatDurationInput(65)).toBe("1:05");
  });

  it("allows blank completed metric rows while validating supplied duration and distance values", () => {
    expect(isSetCompleteable("duration", row({ actualLoad: null, actualReps: null, actualDurationSeconds: 45 }))).toBe(true);
    expect(isSetCompleteable("duration", row({ actualLoad: null, actualReps: null, actualDurationSeconds: null }))).toBe(true);
    expect(isSetCompleteable("distance", row({ actualLoad: null, actualReps: null, actualDistance: 20 }))).toBe(true);
    expect(isSetCompleteable("distance_duration", row({ actualLoad: null, actualReps: null, actualDurationSeconds: 510, actualDistance: 1 }))).toBe(true);
    expect(isSuppliedMetricValuesValid("distance", row({ actualLoad: null, actualReps: null, actualDistance: -1 }))).toBe(false);
    expect(isSuppliedMetricValuesValid("distance_duration", row({ actualLoad: null, actualReps: null, actualDurationSeconds: 510, actualDistance: -1 }))).toBe(false);
  });

  it("rejects partial independent-side distance completion", () => {
    expect(isSetCompleteable("distance", row({ actualLoad: null, actualReps: null, actualLeftDistance: 20, actualRightDistance: null }), "independent_sides")).toBe(false);
    expect(isSetCompleteable("distance", row({ actualLoad: null, actualReps: null, actualLeftDistance: 20, actualRightDistance: 20 }), "independent_sides")).toBe(true);
  });

  it("keeps independent-side values side-specific", () => {
    expect(isSetCompleteable("reps_only", row({ actualLoad: null, actualReps: null, actualLeftReps: 8, actualRightReps: 7 }), "independent_sides")).toBe(true);
    expect(isSuppliedMetricValuesValid("reps_only", row({ actualLoad: null, actualReps: 8, actualLeftReps: 8, actualRightReps: 7 }), "independent_sides")).toBe(false);
  });
});

describe("initial set value defaults", () => {
  it("prefills exact previous set position first", () => {
    expect(
      getInitialSetValues({
        setIndex: 1,
        previousSetDefaults: [
          { actualLoad: 20, actualReps: 8 },
          { actualLoad: 25, actualReps: 6 },
        ],
        prescribedReps: "10",
      }),
    ).toEqual({ actualLoad: 25, actualReps: 6 });
  });

  it("falls back to the most recent applicable set when exact position is missing", () => {
    expect(
      getInitialSetValues({
        setIndex: 2,
        previousSetDefaults: [{ actualLoad: 20, actualReps: 8 }],
        prescribedReps: "10",
      }),
    ).toEqual({ actualLoad: 20, actualReps: 8 });
  });

  it("prefills first-time prescribed reps with the lower deterministic bound", () => {
    expect(parseDeterministicPrescriptionReps("8-12")).toBe(8);
    expect(getInitialSetValues({ setIndex: 0, prescribedReps: "8-12" })).toEqual({ actualLoad: null, actualReps: 8 });
  });

  it("preserves draft submitted rows over generated defaults", () => {
    const result = buildCanonicalMetricSetRows({
      exerciseEntryId: "exercise-1",
      prescribedSetCount: 1,
      defaults: [{ actualLoad: 20, actualReps: 8 }],
      submittedRows: [row({ actualLoad: null, actualReps: 5, status: "incomplete" })],
    });
    expect(result).toMatchObject({ ok: true });
    if (!result.ok) throw new Error(result.error);
    expect(result.rows[0]).toMatchObject({ actualLoad: null, actualReps: 5, status: "incomplete" });
  });
});

describe("canonical prescribed set merging", () => {
  it("overlays a valid prescribed row by prescribedSetIndex despite a different client setId", () => {
    const result = buildCanonicalMetricSetRows({
      exerciseEntryId: "exercise-1",
      prescribedSetCount: 2,
      submittedRows: [row({ setId: "draft-random", prescribedSetIndex: 1, setOrder: 99, actualLoad: 30 })],
    });
    expect(result).toMatchObject({ ok: true });
    if (!result.ok) throw new Error(result.error);
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0]).toMatchObject({ prescribedSetIndex: 0, setOrder: 0, status: "incomplete" });
    expect(result.rows[1]).toMatchObject({ prescribedSetIndex: 1, setOrder: 1, setId: "draft-random", actualLoad: 30, status: "completed" });
  });

  it("rejects duplicate prescribed indexes", () => {
    const result = buildCanonicalMetricSetRows({
      exerciseEntryId: "exercise-1",
      prescribedSetCount: 2,
      submittedRows: [row({ setId: "a", prescribedSetIndex: 0 }), row({ setId: "b", prescribedSetIndex: 0 })],
    });
    expect(result).toEqual({ ok: false, error: "Duplicate prescribed set indexes are not allowed." });
  });

  it("rejects out-of-range prescribed indexes", () => {
    const result = buildCanonicalMetricSetRows({
      exerciseEntryId: "exercise-1",
      prescribedSetCount: 2,
      submittedRows: [row({ prescribedSetIndex: 2 })],
    });
    expect(result).toEqual({ ok: false, error: "Submitted prescribed set index is invalid." });
  });

  it("keeps untouched prescribed rows incomplete and emits exactly one row per index", () => {
    const result = buildCanonicalMetricSetRows({ exerciseEntryId: "exercise-1", prescribedSetCount: 3, submittedRows: [] });
    expect(result).toMatchObject({ ok: true });
    if (!result.ok) throw new Error(result.error);
    expect(result.rows.map((item) => item.prescribedSetIndex)).toEqual([0, 1, 2]);
    expect(result.rows.every((item) => item.status === "incomplete")).toBe(true);
  });

  it("appends added rows after prescribed rows with canonical order", () => {
    const result = buildCanonicalMetricSetRows({
      exerciseEntryId: "exercise-1",
      prescribedSetCount: 2,
      submittedRows: [row({ setKind: "added", prescribedSetIndex: null, setOrder: 0, setId: "added-1" })],
    });
    expect(result).toMatchObject({ ok: true });
    if (!result.ok) throw new Error(result.error);
    expect(result.rows.map((item) => [item.setKind, item.setOrder, item.prescribedSetIndex])).toEqual([
      ["prescribed", 0, 0],
      ["prescribed", 1, 1],
      ["added", 2, null],
    ]);
  });
});

describe("completion set rows", () => {
  it("creates one prescribed row for a one-set completion exercise", () => {
    const result = buildCanonicalMetricSetRows({ exerciseEntryId: "completion-1", prescribedSetCount: 1, submittedRows: [], trackingType: "completion" });
    expect(result).toMatchObject({ ok: true });
    if (!result.ok) throw new Error(result.error);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]).toMatchObject({ setOrder: 0, prescribedSetIndex: 0, setKind: "prescribed", status: "incomplete", actualLoad: null, actualReps: null, actualDurationSeconds: null, actualDistance: null });
  });

  it("creates four prescribed rows for a four-set completion exercise", () => {
    const result = buildCanonicalMetricSetRows({ exerciseEntryId: "completion-4", prescribedSetCount: 4, submittedRows: [], trackingType: "completion" });
    expect(result).toMatchObject({ ok: true });
    if (!result.ok) throw new Error(result.error);
    expect(result.rows.map((row) => row.prescribedSetIndex)).toEqual([0, 1, 2, 3]);
  });

  it("reports partial completion as truthful completed and total set counts", () => {
    expect(calculateSetProgress({
      exercises: [{ id: "completion-4", sets: 4, trackingType: "completion" }],
      setResults: [0, 1, 2].map((index) => row({ exerciseEntryId: "completion-4", setId: `c-${index}`, prescribedSetIndex: index, setOrder: index, status: "completed", actualLoad: null, actualReps: null })),
      checkedExerciseIds: [],
    })).toEqual({ completed: 3, total: 4 });
  });

  it("supports out-of-order completion and uncompletion", () => {
    const completedOutOfOrder = row({ exerciseEntryId: "completion-4", setId: "c-2", prescribedSetIndex: 2, setOrder: 2, status: "completed", actualLoad: null, actualReps: null });
    const result = buildCanonicalMetricSetRows({ exerciseEntryId: "completion-4", prescribedSetCount: 4, submittedRows: [completedOutOfOrder], trackingType: "completion" });
    expect(result).toMatchObject({ ok: true });
    if (!result.ok) throw new Error(result.error);
    expect(result.rows.map((item) => item.status)).toEqual(["incomplete", "incomplete", "completed", "incomplete"]);
    expect(buildCanonicalMetricSetRows({ exerciseEntryId: "completion-4", prescribedSetCount: 4, submittedRows: [{ ...completedOutOfOrder, status: "incomplete" }], trackingType: "completion" })).toMatchObject({ ok: true, rows: expect.arrayContaining([expect.objectContaining({ prescribedSetIndex: 2, status: "incomplete" })]) });
  });

  it("counts added completion sets in progress", () => {
    expect(calculateSetProgress({
      exercises: [{ id: "completion-1", sets: 1, trackingType: "completion" }],
      setResults: [row({ exerciseEntryId: "completion-1", setId: "added", setKind: "added", prescribedSetIndex: null, setOrder: 1, status: "completed", actualLoad: null, actualReps: null })],
      checkedExerciseIds: [],
    })).toEqual({ completed: 1, total: 2 });
  });

  it("migrates legacy checked and unchecked completion exercises into rows", async () => {
    const { migrateLegacyCompletionRows } = await import("@/lib/set-logging");
    const migrated = migrateLegacyCompletionRows({ exercises: [{ id: "checked", sets: 2, trackingType: "completion" }, { id: "unchecked", sets: 1, trackingType: "completion" }], setResults: [], checkedExerciseIds: ["checked"] });
    expect(migrated.checkedExerciseIds).toEqual([]);
    expect(migrated.setResults.filter((item) => item.exerciseEntryId === "checked").map((item) => item.status)).toEqual(["completed", "completed"]);
    expect(migrated.setResults.filter((item) => item.exerciseEntryId === "unchecked").map((item) => item.status)).toEqual(["incomplete"]);
  });

  it("derives exercise status from prescribed rows", async () => {
    const { deriveExerciseCompletionStatus } = await import("@/lib/set-logging");
    expect(deriveExerciseCompletionStatus([row({ status: "completed" }), row({ setId: "b", prescribedSetIndex: 1, setOrder: 1, status: "incomplete" })])).toBe("partial");
    expect(deriveExerciseCompletionStatus([row({ status: "completed" })])).toBe("completed");
  });

  it("calculates mixed workout progress from rows", () => {
    expect(calculateSetProgress({
      exercises: [{ id: "metric", sets: 2, trackingType: "reps_only" }, { id: "done", sets: 1, trackingType: "completion" }],
      setResults: [row({ exerciseEntryId: "metric", setId: "m-0", prescribedSetIndex: 0, setOrder: 0, status: "completed", actualLoad: null, actualReps: 8 }), row({ exerciseEntryId: "done", setId: "d-0", prescribedSetIndex: 0, setOrder: 0, status: "completed", actualLoad: null, actualReps: null })],
      checkedExerciseIds: [],
    })).toEqual({ completed: 2, total: 3 });
  });
});
