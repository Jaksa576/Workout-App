import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { exerciseCatalog } from "@/lib/exercise-library";
import {
  normalizeExerciseLookupKey,
  reviewedSystemAliases,
} from "@/lib/exercise-identity";

const ids = [
  "incline-barbell-bench-press",
  "chin-up",
  "t-bar-row",
  "close-grip-barbell-bench-press",
  "barbell-shrug",
  "ez-bar-curl",
  "chest-dip",
] as const;
const migration = readFileSync(
  "supabase/migrations/20260726120000_issue92_catalog_batch_1_identities.sql",
  "utf8",
);
const verification = readFileSync(
  "supabase/verification/issue-92-catalog-batch-1-readonly.sql",
  "utf8",
);

const rows = Array.from(
  migration.matchAll(
    /\('([^']+)','([^']+)','([^']+)','system',array\[([^\n]+?)\]::text\[\],'([^']+)','([^']*)','(\{.*?\})'::jsonb,true,null\)/g,
  ),
).map((match) => ({
  id: match[1],
  name: match[2],
  normalizedKey: match[3],
  equipmentTags: Array.from(match[4].matchAll(/'([^']+)'/g)).map(
    (item) => item[1],
  ),
  movementPattern: match[5],
  qualifierText: match[6],
  metadata: JSON.parse(match[7]),
}));

describe("Issue #92 catalog identity parity", () => {
  it("seeds exactly the seven reviewed rows in exact library metadata parity", () => {
    expect(rows.map((row) => row.id)).toEqual(ids);

    for (const row of rows) {
      const exercise = exerciseCatalog.find((item) => item.id === row.id);
      expect(exercise).toBeDefined();
      expect(row).toEqual({
        id: exercise?.id,
        name: exercise?.name,
        normalizedKey: normalizeExerciseLookupKey(exercise?.name ?? ""),
        equipmentTags: exercise?.equipmentTags,
        movementPattern: exercise?.movementPattern,
        qualifierText: [
          exercise?.equipmentTags.join("/"),
          exercise?.unilateralMode.replace(/_/g, " "),
          exercise?.movementPattern,
        ]
          .filter(Boolean)
          .join(" · "),
        metadata: {
          category: exercise?.category,
          difficultyTier: exercise?.difficultyTier,
          cautionTags: exercise?.cautionTags,
          traitTags: exercise?.traitTags,
          preferenceTags: exercise?.preferenceTags,
        },
      });
    }
  });

  it("has no canonical-name or reviewed-alias collisions", () => {
    const owners = new Map<string, Set<string>>();
    for (const exercise of exerciseCatalog) {
      for (const name of [exercise.name, ...(reviewedSystemAliases[exercise.id] ?? [])]) {
        const key = normalizeExerciseLookupKey(name);
        owners.set(key, (owners.get(key) ?? new Set()).add(exercise.id));
      }
    }

    expect(
      [...owners.entries()].filter(([, targets]) => targets.size > 1),
    ).toEqual([]);
    for (const id of ids) {
      const exercise = exerciseCatalog.find((item) => item.id === id)!;
      expect(owners.get(normalizeExerciseLookupKey(exercise.name))).toEqual(
        new Set([id]),
      );
      expect(reviewedSystemAliases[id]).toBeUndefined();
    }
  });

  it("is additive, idempotent, system-only, and collision guarded", () => {
    expect(migration).toContain("on conflict (id) do update");
    expect(migration).toContain(
      "where public.exercise_identities.owner_scope = 'system'",
    );
    expect(migration).toContain("canonical-name collision");
    expect(migration).toContain("reviewed-alias collision");
    expect(migration).toMatch(
      /existing\.normalized_lookup_key = expected\.normalized_lookup_key\s+and existing\.active\s+and existing\.id <> expected\.id/,
    );
    expect(migration).not.toMatch(
      /existing\.normalized_lookup_key = expected\.normalized_lookup_key\s+and existing\.owner_scope = 'system'/,
    );
    expect(migration).not.toMatch(
      /\b(delete|truncate|drop|alter|create|merge)\b/i,
    );
    expect(migration).not.toMatch(
      /\b(insert\s+into|update)\s+public\.(exercise_entries|exercise_results|exercise_set_results|workout_plans|plan_phases|workout_templates|workout_sessions|exercise_aliases)\b/i,
    );
  });

  it("provides read-only parity and collision verification for all seven IDs", () => {
    for (const id of ids) expect(verification).toContain(`('${id}'`);
    expect(verification).toContain("missing_or_mismatched_issue92_identities");
    expect(verification).toContain("canonical_name_collisions");
    expect(verification).toContain("reviewed_alias_collisions");
    expect(verification).toContain("unexpected_user_ownership");
    expect(verification).toMatch(
      /where i\.active and i\.id <> e\.id\s+union all/,
    );
    expect(verification).not.toMatch(
      /canonical_name_collisions'[\s\S]*?where i\.owner_scope = 'system'/,
    );
    expect(verification).not.toMatch(
      /\b(insert|update|delete|alter|create table|drop|truncate|merge)\b/i,
    );
  });
});
