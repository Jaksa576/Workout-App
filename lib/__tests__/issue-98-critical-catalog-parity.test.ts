import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { exerciseCatalog } from "@/lib/exercise-library";
import {
  normalizeExerciseLookupKey,
  reviewedSystemAliases,
} from "@/lib/exercise-identity";

type ManifestExercise = {
  id: string;
  name: string;
  category: string;
  movementPattern: string;
  equipmentTags: string[];
  goalTags: string[];
  difficultyTier: string;
  cautionTags: string[];
  traitTags: string[];
  preferenceTags: string[];
  sets: number;
  reps: string;
  rest: string;
  coachingNote: string;
  videoUrl: null;
  videoReviewStatus: "not_reviewed";
  tracking: {
    trackingType: string;
    unilateralMode: string;
    loadUnit: string | null;
    supportedLoadUnits: string[];
    distanceUnit: string | null;
    supportedDistanceUnits: string[];
    primaryValueLabel: string | null;
    secondaryValueLabel: string | null;
  };
};

const manifestPath =
  "docs/exercise-catalog-inputs/issue-98/exercise-catalog-batch-5-critical-37.manifest.json";
const migrationPath =
  "supabase/migrations/20260728120000_issue98_critical_36_identities.sql";
const verificationPath =
  "supabase/verification/issue-98-critical-36-readonly.sql";
const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as {
  summary: {
    count: number;
    sections: Record<string, number>;
    videoUrlsBlank: number;
  };
  exercises: ManifestExercise[];
};
const migration = readFileSync(migrationPath, "utf8");
const verification = readFileSync(verificationPath, "utf8");
const ids = manifest.exercises.map((exercise) => exercise.id);

function sql(value: string) {
  return value.replaceAll("'", "''");
}

function expectedIdentityTuple(exercise: ManifestExercise) {
  const equipment = exercise.equipmentTags
    .map((tag) => `'${sql(tag)}'`)
    .join(",");
  const qualifier = [
    exercise.equipmentTags.join("/"),
    exercise.tracking.unilateralMode.replaceAll("_", " "),
    exercise.movementPattern,
  ]
    .filter(Boolean)
    .join(" · ");
  const metadata = JSON.stringify({
    category: exercise.category,
    difficultyTier: exercise.difficultyTier,
    cautionTags: exercise.cautionTags,
    traitTags: exercise.traitTags,
    preferenceTags: exercise.preferenceTags,
  });
  return `('${sql(exercise.id)}','${sql(exercise.name)}','${sql(normalizeExerciseLookupKey(exercise.name))}','system',array[${equipment}]::text[],'${sql(exercise.movementPattern)}','${sql(qualifier)}','${sql(metadata)}'::jsonb,true,null)`;
}

describe("Issue #98 Slice 1 critical catalog parity", () => {
  it("keeps exactly 36 unique corrected manifest rows", () => {
    expect(manifest.summary.count).toBe(36);
    expect(manifest.summary.sections.hip_adduction).toBe(3);
    expect(manifest.summary.videoUrlsBlank).toBe(36);
    expect(manifest.exercises).toHaveLength(36);
    expect(new Set(ids)).toHaveLength(36);
    expect(
      new Set(
        manifest.exercises.map((exercise) =>
          normalizeExerciseLookupKey(exercise.name),
        ),
      ),
    ).toHaveLength(36);
    expect(ids).not.toContain("hip-adduction-machine");
  });

  it("matches every manifest field in the runtime catalog exactly", () => {
    for (const expectedWithAuthoringFields of manifest.exercises) {
      const {
        section: _section,
        videoReviewStatus: _videoStatus,
        ...expected
      } = expectedWithAuthoringFields as ManifestExercise & { section: string };
      const actual = exerciseCatalog.find(
        (exercise) => exercise.id === expected.id,
      );
      expect(actual).toBeDefined();
      expect({
        id: actual?.id,
        name: actual?.name,
        category: actual?.category,
        movementPattern: actual?.movementPattern,
        equipmentTags: actual?.equipmentTags,
        goalTags: actual?.goalTags,
        difficultyTier: actual?.difficultyTier,
        cautionTags: actual?.cautionTags,
        traitTags: actual?.traitTags,
        preferenceTags: actual?.preferenceTags,
        sets: actual?.sets,
        reps: actual?.reps,
        rest: actual?.rest,
        coachingNote: actual?.coachingNote,
        videoUrl: actual?.videoUrl ?? null,
        tracking: {
          trackingType: actual?.trackingType,
          unilateralMode: actual?.unilateralMode,
          loadUnit: actual?.loadUnit,
          supportedLoadUnits: actual?.supportedLoadUnits,
          distanceUnit: actual?.distanceUnit,
          supportedDistanceUnits: actual?.supportedDistanceUnits,
          primaryValueLabel: actual?.primaryValueLabel,
          secondaryValueLabel: actual?.secondaryValueLabel,
        },
      }).toEqual(expected);
    }
  });

  it("has exact SQL identity metadata parity for all 36 rows", () => {
    for (const exercise of manifest.exercises) {
      expect(migration).toContain(expectedIdentityTuple(exercise));
      expect(verification).toContain(
        expectedIdentityTuple(exercise).replace(",true,null)", ")"),
      );
    }
    expect(ids.filter((id) => migration.includes(`('${id}','`))).toHaveLength(
      36,
    );
  });

  it("has no local canonical-name or reviewed-alias collision", () => {
    const owners = new Map<string, Set<string>>();
    for (const exercise of exerciseCatalog) {
      for (const name of [
        exercise.name,
        ...(reviewedSystemAliases[exercise.id] ?? []),
      ]) {
        const key = normalizeExerciseLookupKey(name);
        owners.set(key, (owners.get(key) ?? new Set()).add(exercise.id));
      }
    }
    expect([...owners.values()].filter((targets) => targets.size > 1)).toEqual(
      [],
    );
    for (const exercise of manifest.exercises) {
      expect(owners.get(normalizeExerciseLookupKey(exercise.name))).toEqual(
        new Set([exercise.id]),
      );
      expect(reviewedSystemAliases[exercise.id]).toBeUndefined();
    }
  });

  it("is additive, idempotent, system-only, and protects every identity namespace", () => {
    expect(migration).toContain("on conflict (id) do update");
    expect(migration).toContain(
      "where public.exercise_identities.owner_scope = 'system'",
    );
    expect(migration).toContain("existing.owner_scope <> 'system'");
    expect(migration).toContain("canonical-name collision");
    expect(migration).toContain("reviewed-alias collision");
    expect(migration).toMatch(
      /existing\.normalized_lookup_key = expected\.normalized_lookup_key\s+and existing\.active\s+and existing\.id <> expected\.id/,
    );
    expect(migration).not.toMatch(
      /existing\.normalized_lookup_key = expected\.normalized_lookup_key\s+and existing\.owner_scope = 'system'/,
    );
    expect(migration).toMatch(
      /alias\.normalized_lookup_key = expected\.normalized_lookup_key\s+and alias\.reviewed/,
    );
    expect(migration).not.toMatch(
      /alias\.normalized_lookup_key = expected\.normalized_lookup_key\s+and alias\.owner_scope = 'system'/,
    );
    expect(migration).not.toMatch(
      /\b(delete|truncate|drop|alter|create|merge)\b/i,
    );
    expect(migration).not.toMatch(
      /\b(insert\s+into|update)\s+public\.(exercise_entries|exercise_results|exercise_set_results|workout_plans|plan_phases|workout_templates|workout_sessions|exercise_aliases)\b/i,
    );
  });

  it("provides read-only hosted parity, ownership, and collision verification", () => {
    for (const id of ids) expect(verification).toContain(`('${id}','`);
    expect(verification).toContain("missing_or_mismatched_issue98_identities");
    expect(verification).toContain("canonical_name_collisions");
    expect(verification).toContain("reviewed_alias_collisions");
    expect(verification).toContain("unexpected_user_ownership");
    expect(verification).not.toMatch(
      /\b(insert|update|delete|alter|create table|drop|truncate|merge)\b/i,
    );
  });
});
