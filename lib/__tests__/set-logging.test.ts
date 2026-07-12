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

  it("requires valid type-specific fields before completing duration and distance rows", () => {
    expect(isSetCompleteable("duration", row({ actualLoad: null, actualReps: null, actualDurationSeconds: 45 }))).toBe(true);
    expect(isSetCompleteable("duration", row({ actualLoad: null, actualReps: null, actualDurationSeconds: null }))).toBe(false);
    expect(isSetCompleteable("distance_duration", row({ actualLoad: null, actualReps: null, actualDurationSeconds: 510, actualDistance: 1 }))).toBe(true);
    expect(isSuppliedMetricValuesValid("distance_duration", row({ actualLoad: null, actualReps: null, actualDurationSeconds: 510, actualDistance: -1 }))).toBe(false);
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
