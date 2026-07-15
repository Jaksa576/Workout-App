import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { getExerciseSearchKeys, normalizeExerciseLookupKey, resolveExerciseIdentityByReviewedName, resolveSystemExerciseIdentity } from "@/lib/exercise-identity";
import { exerciseCatalog } from "@/lib/exercise-library";

const migration = readFileSync("supabase/migrations/20260715120000_issue42b_approved_exercise_entry_identity_repair.sql", "utf8");
const verification = readFileSync("supabase/verification/issue-42b-approved-exercise-identity-repair-readonly.sql", "utf8");

const approvedMappings = [
  ["dead bug", "dead-bug", 10],
  ["step up", "step-up", 8],
  ["farmer carry", "farmer-carry", 7],
  ["side plank", "side-plank", 7],
  ["dumbbell row", "dumbbell-row", 5],
  ["lateral shuffle", "lateral-shuffle", 5],
  ["push up", "push-up", 5],
  ["calf raise", "calf-raise", 4],
  ["easy run", "easy-run", 4],
  ["walking lunge", "walking-lunge", 4],
  ["bird dog", "bird-dog", 3],
  ["glute bridge", "glute-bridge", 3],
  ["reverse lunge", "reverse-lunge", 3],
  ["band row", "band-row", 1],
  ["bodyweight squat", "bodyweight-squat", 1],
  ["box squat", "box-squat", 1],
  ["lateral lunge", "lateral-lunge", 1]
] as const;

describe("Issue #42B approved exercise identity repair", () => {
  it("contains only the 17 approved mappings with an aggregate count of 72", () => {
    expect(approvedMappings).toHaveLength(17);
    expect(approvedMappings.reduce((total, mapping) => total + mapping[2], 0)).toBe(72);

    for (const [normalizedName, canonicalId, count] of approvedMappings) {
      expect(migration).toContain(`('${normalizedName}','${canonicalId}',${count})`);
    }

    expect(migration).toContain("approved_groups <> 17 or approved_total <> 72");
    expect(migration).not.toContain("romanian-deadlift',");
    expect(migration).not.toContain("goblet-squat',");
  });

  it("guards preconditions and supports idempotent reruns", () => {
    expect(migration).toContain("per-group unresolved candidate count mismatch");
    expect(migration).toContain("missing, inactive, superseded, user-owned");
    expect(migration).toContain("does not resolve to exactly one active system target");
    expect(migration).toContain("ambiguous reviewed aliases");
    expect(migration).toContain("explicit user-owned canonical identity");
    expect(migration).toContain("unresolved_total = approved_total");
    expect(migration).toContain("unresolved_total = 0 and already_linked_total = approved_total");
    expect(migration).toContain("zero additional exercise_entries changed");
  });

  it("preserves entry metadata and historical display snapshots while doing deterministic result backfill", () => {
    expect(migration).toContain("set canonical_exercise_id = m.canonical_id");
    expect(migration).toContain("er.exercise_entry_id = ee.id");
    expect(migration).not.toMatch(/set\s+name\s*=/i);
    expect(migration).not.toMatch(/exercise_name_snapshot\s*=/i);
    expect(migration).not.toMatch(/tracking_type\s*=/i);
    expect(migration).not.toMatch(/source_exercise_id\s*=/i);
  });

  it("adds readonly verification for repair counts, aliases, references, history, custom preservation, and rerun state", () => {
    for (const marker of [
      "approved_entry_updates_by_mapping",
      "remaining_unresolved",
      "wrong_target",
      "total_approved_rows_linked_and_idempotent_state",
      "ambiguous_reviewed_aliases",
      "orphaned_canonical_entry_references",
      "orphaned_canonical_result_references",
      "inactive_or_superseded_identities_actively_referenced",
      "historical_result_canonical_backfill_totals",
      "historical_display_name_invariants",
      "custom_user_owned_identity_preservation"
    ]) {
      expect(verification).toContain(marker);
    }

    expect(verification).not.toMatch(/\b(insert|update|delete|alter|create table|drop)\b/i);
  });
});

describe("Issue #42C deterministic resolver and search behavior", () => {
  it("resolves exact canonical ids, exact canonical names, reviewed aliases, punctuation, and case", () => {
    expect(resolveSystemExerciseIdentity({ canonicalId: "push-up", displayName: "ignored" })).toMatchObject({ status: "resolved", candidate: { canonicalId: "push-up" } });
    expect(resolveSystemExerciseIdentity({ displayName: "Push-up" })).toMatchObject({ status: "resolved", candidate: { canonicalId: "push-up" } });
    expect(resolveSystemExerciseIdentity({ displayName: "Push Up" })).toMatchObject({ status: "resolved", candidate: { canonicalId: "push-up" } });
    expect(resolveExerciseIdentityByReviewedName("PUSH--UP!!")).toMatchObject({ status: "resolved", candidate: { canonicalId: "push-up" } });
    expect(normalizeExerciseLookupKey("Dumbbell Row")).toBe("dumbbell row");
  });

  it("leaves unknown custom and materially distinct variants unresolved instead of silently attaching", () => {
    expect(resolveSystemExerciseIdentity({ displayName: "My rehab wall press" })).toMatchObject({ status: "unresolved" });
    expect(resolveSystemExerciseIdentity({ displayName: "Incline pushup" })).toMatchObject({ status: "unresolved" });
  });

  it("allows alias-aware search to return the canonical row once without alias rows", () => {
    const pushup = exerciseCatalog.find((exercise) => exercise.id === "push-up")!;
    const incline = exerciseCatalog.find((exercise) => exercise.id === "incline-push-up")!;
    expect(getExerciseSearchKeys(pushup)).toContain("push up");
    expect(getExerciseSearchKeys(pushup)).toContain("pushup");
    expect(getExerciseSearchKeys(incline)).not.toContain("pushup");
  });
});
