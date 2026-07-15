import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { getExerciseSearchKeys, normalizeExerciseLookupKey, resolveExerciseIdentityByReviewedName, resolveSystemExerciseIdentity } from "@/lib/exercise-identity";
import { exerciseCatalog } from "@/lib/exercise-library";

const migration = readFileSync("supabase/migrations/20260715120000_issue42b_approved_exercise_entry_identity_repair.sql", "utf8");
const verification = readFileSync("supabase/verification/issue-42b-approved-exercise-identity-repair-readonly.sql", "utf8");
const planWrite = readFileSync("lib/plan-write.ts", "utf8");
const planBuilderForm = readFileSync("components/plan-builder-form.tsx", "utf8");

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

  it("guards preconditions and supports idempotent zero-change reruns", () => {
    expect(migration).toContain("per-group unresolved candidate count mismatch");
    expect(migration).toContain("missing, inactive, superseded, user-owned");
    expect(migration).toContain("combined canonical/alias namespace");
    expect(migration).toContain("inactive, superseded, or user-owned resolver target");
    expect(migration).toContain("explicit user-owned canonical identity");
    expect(migration).toContain("wrong-target partial state detected");
    expect(migration).toContain("unresolved_total = approved_total");
    expect(migration).toContain("unresolved_total = 0 and already_linked_total = approved_total");
    expect(migration).toContain("zero additional exercise_entries and zero exercise_results changed");
    expect(migration).toContain("idempotent rerun unexpectedly captured repaired entries");
  });

  it("uses the shared audited SQL normalization contract including whitespace collapse", () => {
    const sqlNormalizer = "btrim(regexp_replace(regexp_replace(regexp_replace(lower(btrim(ee.name)), '[''’]', '', 'g'), '[^a-z0-9]+', ' ', 'g'), '\\s+', ' ', 'g'))";
    expect(migration).toContain(sqlNormalizer);
    expect(verification).toContain(sqlNormalizer);
    expect(normalizeExerciseLookupKey("  Push - up  ")).toBe("push up");
    expect(normalizeExerciseLookupKey("PUSH----UP!!")).toBe("push up");
    expect(normalizeExerciseLookupKey("Dumbbell   Row")).toBe("dumbbell row");
    expect(normalizeExerciseLookupKey("Farmer’s Carry")).toBe("farmers carry");
  });

  it("captures repaired entries and scopes result backfill only to those entry IDs", () => {
    expect(migration).toContain("create temp table issue42b_repaired_entries");
    expect(migration).toContain("returning ee.id as exercise_entry_id, ee.canonical_exercise_id, m.normalized_name");
    expect(migration).toContain("from issue42b_repaired_entries repaired");
    expect(migration).toContain("er.exercise_entry_id = repaired.exercise_entry_id");
    expect(migration).not.toContain("join issue42b_approved_mappings m on m.canonical_id = ee.canonical_exercise_id");
  });

  it("preserves entry metadata and historical display snapshots and metrics", () => {
    expect(migration).toContain("set canonical_exercise_id = m.canonical_id");
    for (const forbidden of [
      /set\s+name\s*=/i,
      /exercise_name_snapshot\s*=/i,
      /tracking_type\s*=/i,
      /source_exercise_id\s*=/i,
      /completed\s*=/i,
      /actual_(load|reps|distance|duration|time)\s*=/i,
      /pain\s*=/i,
      /difficulty\s*=/i,
      /notes\s*=/i,
      /progression/i
    ]) {
      expect(migration).not.toMatch(forbidden);
    }
  });

  it("adds readonly verification for repair counts, aliases, references, history, custom preservation, and rerun state", () => {
    for (const marker of [
      "approved_entry_updates_by_mapping",
      "remaining_unresolved",
      "wrong_target",
      "total_approved_rows_linked_and_idempotent_state",
      "combined_canonical_alias_namespace_validation",
      "orphaned_canonical_entry_references",
      "orphaned_canonical_result_references",
      "inactive_or_superseded_identities_actively_referenced",
      "repaired_entry_result_backfill_counts",
      "remaining_null_result_canonical_ids_for_repaired_entries",
      "unrelated_already_canonical_results",
      "historical_snapshot_blank_health_count",
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
    expect(resolveExerciseIdentityByReviewedName("  push   up  ")).toMatchObject({ status: "resolved", candidate: { canonicalId: "push-up" } });
    expect(resolveExerciseIdentityByReviewedName("Dumbbell Row")).toMatchObject({ status: "resolved", candidate: { canonicalId: "dumbbell-row" } });
    expect(normalizeExerciseLookupKey("Dumbbell Row")).toBe("dumbbell row");
  });

  it("leaves unknown custom and materially distinct variants unresolved instead of silently attaching", () => {
    expect(resolveSystemExerciseIdentity({ displayName: "My rehab wall press" })).toMatchObject({ status: "unresolved" });
    expect(resolveSystemExerciseIdentity({ displayName: "Incline pushup" })).toMatchObject({ status: "unresolved" });
  });

  it("allows alias-aware search to return one canonical row while preserving filters and distinct variants", () => {
    const search = (query: string, category = "all") => {
      const normalizedSearch = normalizeExerciseLookupKey(query);
      const exactResolution = normalizedSearch ? resolveExerciseIdentityByReviewedName(normalizedSearch) : null;
      return exerciseCatalog.filter((exercise) => {
        const matchesCategory = category === "all" || exercise.category === category;
        const searchKeys = getExerciseSearchKeys(exercise);
        const matchesSearch = !normalizedSearch
          ? true
          : exactResolution?.status === "resolved"
            ? exactResolution.candidate.canonicalId === exercise.id
            : searchKeys.some((key) => key.includes(normalizedSearch));
        return matchesCategory && matchesSearch;
      });
    };

    expect(search("pushup").map((exercise) => exercise.id)).toEqual(["push-up"]);
    expect(search("Push-up").map((exercise) => exercise.id)).toEqual(["push-up"]);
    expect(search("DUMB").some((exercise) => exercise.equipmentTags.some((tag) => tag.toLowerCase().includes("dumbbell")))).toBe(true);
    expect(search("row", "strength").every((exercise) => exercise.category === "strength")).toBe(true);
    expect(search("squat").map((exercise) => exercise.id)).toEqual(expect.arrayContaining(["bodyweight-squat", "box-squat"]));
    expect(search("")).toHaveLength(exerciseCatalog.length);

    const pushup = exerciseCatalog.find((exercise) => exercise.id === "push-up")!;
    const incline = exerciseCatalog.find((exercise) => exercise.id === "incline-push-up")!;
    expect(getExerciseSearchKeys(pushup)).toContain("push up");
    expect(getExerciseSearchKeys(pushup)).toContain("pushup");
    expect(getExerciseSearchKeys(incline)).not.toContain("pushup");
    expect(planBuilderForm).toContain("const exactResolution = normalizedSearch ? resolveExerciseIdentityByReviewedName(normalizedSearch) : null");
  });

  it("keeps supported plan persistence paths on the shared deterministic resolver boundary", () => {
    expect(planWrite).toContain("resolveSystemExerciseIdentity");
    expect(planWrite).toContain("canonicalExerciseId: identityResolution.status === \"resolved\"");
    expect(planWrite).toContain("name: exercise.name.trim()");
    expect(planWrite).toContain("createStructuredPlanForUser");
    expect(planWrite).toContain("updateStructuredPlanForUser");
  });
});
