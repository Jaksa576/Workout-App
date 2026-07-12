import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const schema = readFileSync("supabase/schema.sql", "utf8");
const migration = readFileSync("supabase/migrations/20260712133000_issue14_finalize_metric_persistence.sql", "utf8");

describe("Issue #14 finalize metric persistence", () => {
  it("persists duration, distance, and independent side fields in the schema snapshot RPC", () => {
    for (const column of [
      "prescribed_load",
      "prescribed_reps",
      "prescribed_duration_seconds",
      "prescribed_distance",
      "actual_duration_seconds",
      "actual_distance",
      "actual_left_load",
      "actual_left_reps",
      "actual_left_duration_seconds",
      "actual_left_distance",
      "actual_right_load",
      "actual_right_reps",
      "actual_right_duration_seconds",
      "actual_right_distance",
    ]) {
      expect(schema).toContain(column);
      expect(migration).toContain(column);
    }
  });
});
