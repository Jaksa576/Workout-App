import { describe, expect, it } from "vitest";
import {
  applyMetricSetEdit,
  buildCanonicalMetricSetRows,
  calculateSetProgress,
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

describe("set logging metric edit truthfulness", () => {
  it("marks a completed weight_reps row incomplete when load is cleared", () => {
    expect(applyMetricSetEdit("weight_reps", row(), { actualLoad: null }).status).toBe("incomplete");
  });

  it("marks a completed weight_reps row incomplete when reps are cleared", () => {
    expect(applyMetricSetEdit("weight_reps", row(), { actualReps: null }).status).toBe("incomplete");
  });

  it("marks a completed reps_only row incomplete when reps are cleared", () => {
    expect(applyMetricSetEdit("reps_only", row({ actualLoad: null }), { actualReps: null }).status).toBe("incomplete");
  });

  it("keeps a completed row completed when a valid metric is edited", () => {
    expect(applyMetricSetEdit("weight_reps", row(), { actualLoad: 27.5 })).toMatchObject({
      status: "completed",
      actualLoad: 27.5,
      actualReps: 8,
    });
  });

  it("updates progress immediately after an invalid edit changes status", () => {
    const edited = applyMetricSetEdit("weight_reps", row(), { actualReps: null });
    expect(
      calculateSetProgress({
        exercises: [{ id: "exercise-1", sets: 1, trackingType: "weight_reps" }],
        setResults: [edited],
        checkedExerciseIds: [],
      }),
    ).toEqual({ completed: 0, total: 1 });
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
