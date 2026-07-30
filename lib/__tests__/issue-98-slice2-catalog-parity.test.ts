import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { exerciseCatalog } from "@/lib/exercise-library";
import {
  normalizeExerciseLookupKey,
  reviewedSystemAliases,
} from "@/lib/exercise-identity";

type ManifestExercise = Record<string, unknown> & {
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
  tracking: Record<string, unknown>;
};
const paths = [2, 3, 4].map(
  (batch) =>
    `docs/exercise-catalog-inputs/issue-98/exercise-catalog-batch-${batch}-100.manifest.json`,
);
const manifests = paths.map(
  (path) =>
    JSON.parse(readFileSync(path, "utf8")) as {
      summary: { count: number; videoUrlsBlank: number };
      exercises: ManifestExercise[];
    },
);
const exercises = manifests.flatMap((manifest) => manifest.exercises);
const migration = readFileSync(
  "supabase/migrations/20260730120000_issue98_slice2_295_identities.sql",
  "utf8",
);
const verification = readFileSync(
  "supabase/verification/issue-98-slice2-295-readonly.sql",
  "utf8",
);
const sql = (value: string) => value.replaceAll("'", "''");
function tuple(exercise: ManifestExercise) {
  const equipment = exercise.equipmentTags
    .map((tag) => `'${sql(tag)}'`)
    .join(",");
  const tracking = exercise.tracking as { unilateralMode: string };
  const qualifier = [
    exercise.equipmentTags.join("/"),
    tracking.unilateralMode.replaceAll("_", " "),
    exercise.movementPattern,
  ].join(" · ");
  const metadata = JSON.stringify({
    category: exercise.category,
    difficultyTier: exercise.difficultyTier,
    cautionTags: exercise.cautionTags,
    traitTags: exercise.traitTags,
    preferenceTags: exercise.preferenceTags,
  });
  return `('${sql(exercise.id)}','${sql(exercise.name)}','${sql(normalizeExerciseLookupKey(exercise.name))}','system',array[${equipment}]::text[],'${sql(exercise.movementPattern)}','${sql(qualifier)}','${sql(metadata)}'::jsonb,true,null)`;
}

describe("Issue #98 Slice 2 retained catalog parity", () => {
  it("retains exact 95/100/100 and combined uniqueness", () => {
    expect(manifests.map((m) => m.summary.count)).toEqual([95, 100, 100]);
    expect(manifests.map((m) => m.exercises.length)).toEqual([95, 100, 100]);
    expect(manifests.map((m) => m.summary.videoUrlsBlank)).toEqual([
      95, 100, 100,
    ]);
    expect(exercises).toHaveLength(295);
    expect(new Set(exercises.map((x) => x.id))).toHaveLength(295);
    expect(
      new Set(exercises.map((x) => normalizeExerciseLookupKey(x.name))),
    ).toHaveLength(295);
  });
  it("matches every manifest and tracking field in the runtime catalog", () => {
    for (const authored of exercises) {
      const {
        section: _section,
        videoReviewStatus: _status,
        tracking,
        ...base
      } = authored;
      const actual = exerciseCatalog.find((x) => x.id === authored.id);
      expect(actual).toBeDefined();
      expect({ ...actual, videoUrl: actual?.videoUrl ?? null }).toEqual({
        ...base,
        ...tracking,
      });
    }
  });
  it("has exact TypeScript-to-SQL identity parity", () => {
    for (const exercise of exercises) {
      expect(migration).toContain(tuple(exercise));
      expect(verification).toContain(
        tuple(exercise).replace(",true,null)", ")"),
      );
    }
    expect(
      exercises.filter((exercise) => migration.includes(`('${exercise.id}','`)),
    ).toHaveLength(295);
  });
  it("has no catalog or reviewed-alias collisions", () => {
    const owners = new Map<string, Set<string>>();
    for (const item of exerciseCatalog)
      for (const name of [
        item.name,
        ...(reviewedSystemAliases[item.id] ?? []),
      ]) {
        const key = normalizeExerciseLookupKey(name);
        owners.set(key, (owners.get(key) ?? new Set()).add(item.id));
      }
    expect([...owners.values()].filter((x) => x.size > 1)).toEqual([]);
    for (const item of exercises)
      expect(reviewedSystemAliases[item.id]).toBeUndefined();
  });
  it("is guarded, idempotent, system-only, and protected-table safe", () => {
    expect(migration).toContain("on conflict (id) do update");
    expect(migration).toContain(
      "where public.exercise_identities.owner_scope = 'system'",
    );
    expect(migration).toContain("existing.owner_scope <> 'system'");
    expect(migration).toMatch(
      /existing\.normalized_lookup_key = expected\.normalized_lookup_key and existing\.active and existing\.id <> expected\.id/,
    );
    expect(migration).toMatch(
      /alias\.normalized_lookup_key = expected\.normalized_lookup_key and alias\.reviewed/,
    );
    expect(migration).not.toMatch(
      /\b(insert\s+into|update|delete\s+from)\s+public\.(exercise_entries|exercise_results|exercise_set_results|workout_plans|plan_phases|workout_templates|workout_sessions|exercise_aliases)\b/i,
    );
  });
  it("provides read-only complete hosted verification", () => {
    expect(verification).toContain(
      "missing_or_mismatched_issue98_slice2_identities",
    );
    expect(verification).toContain("canonical_name_collisions");
    expect(verification).toContain("reviewed_alias_collisions");
    expect(verification).toContain("unexpected_user_ownership");
    expect(verification.replace(/--.*$/gm, "")).not.toMatch(
      /^\s*(insert|update|delete|alter|create table|drop|truncate|merge)\b/im,
    );
  });
});
