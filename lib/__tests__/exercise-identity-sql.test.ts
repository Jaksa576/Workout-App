import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { exerciseCatalog } from "@/lib/exercise-library";
import { normalizeExerciseLookupKey, resolveExerciseIdentityByReviewedName } from "@/lib/exercise-identity";

const migration = readFileSync("supabase/migrations/20260714120000_exercise_identity_aliases.sql", "utf8");
const schema = readFileSync("supabase/schema.sql", "utf8");
const verification = readFileSync("supabase/verification/issue-40-exercise-identity-readonly.sql", "utf8");

const identityRows = Array.from(
  migration.matchAll(/\('([^']+)','([^']+)','([^']+)','system',array\[[^\n]+?\]::text\[],'([^']+)'/g)
).map((match) => ({ id: match[1], name: match[2], normalizedKey: match[3], movementPattern: match[4] }));

const aliasRows = Array.from(
  migration.matchAll(/\('([^']+)','([^']+)','([^']+)','system',true\)/g)
).map((match) => ({ targetId: match[1], alias: match[2], normalizedKey: match[3] }));

describe("Issue #40 exercise identity SQL", () => {
  it("seeds exactly one system identity for every current catalog exercise", () => {
    const seededIds = new Set(identityRows.map((row) => row.id));
    const catalogIds = new Set(exerciseCatalog.map((exercise) => exercise.id));

    expect(identityRows).toHaveLength(exerciseCatalog.length);
    expect([...catalogIds].filter((id) => !seededIds.has(id))).toEqual([]);
    expect([...seededIds].filter((id) => !catalogIds.has(id))).toEqual([]);
  });

  it("stores deterministic canonical names and lookup keys for catalog identities", () => {
    for (const exercise of exerciseCatalog) {
      const row = identityRows.find((candidate) => candidate.id === exercise.id);
      expect(row).toBeDefined();
      expect(row?.name).toBe(exercise.name);
      expect(row?.normalizedKey).toBe(normalizeExerciseLookupKey(exercise.name));
      expect(row?.movementPattern).toBe(exercise.movementPattern);
    }
  });

  it("keeps reviewed aliases pointed at seeded identities and unambiguous in TypeScript resolution", () => {
    const seededIds = new Set(identityRows.map((row) => row.id));
    const normalizedAliasTargets = new Map<string, Set<string>>();

    for (const alias of aliasRows) {
      expect(seededIds.has(alias.targetId)).toBe(true);
      expect(alias.normalizedKey).toBe(normalizeExerciseLookupKey(alias.alias));
      const targets = normalizedAliasTargets.get(alias.normalizedKey) ?? new Set<string>();
      targets.add(alias.targetId);
      normalizedAliasTargets.set(alias.normalizedKey, targets);

      expect(resolveExerciseIdentityByReviewedName(alias.alias)).toMatchObject({
        status: "resolved",
        candidate: { canonicalId: alias.targetId }
      });
    }

    expect([...normalizedAliasTargets.values()].filter((targets) => targets.size > 1)).toEqual([]);
  });

  it("preserves canonical IDs through finalization and protects identity tables with RLS", () => {
    for (const sql of [migration, schema]) {
      expect(sql).toContain("source_exercise_id, canonical_exercise_id, exercise_name_snapshot");
      expect(sql).toContain("ee.source_exercise_id, ee.canonical_exercise_id, ee.name");
      expect(sql).toContain("alter table public.exercise_identities enable row level security");
      expect(sql).toContain("alter table public.exercise_aliases enable row level security");
    }
  });

  it("keeps read-only verification coverage for catalog parity, result snapshots, aliases, and ownership conflicts", () => {
    expect(verification).toContain("missing_catalog_identity_rows");
    expect(verification).toContain("catalog_backed_entries_missing_or_invalid_canonical_id");
    expect(verification).toContain("completed_results_missing_canonical_id_from_source_entry");
    expect(verification).toContain("ambiguous_reviewed_aliases");
    expect(verification).toContain("ownership_scope_conflicts");
    expect(verification).not.toMatch(/\b(insert|update|delete|alter|create table|drop)\b/i);
  });
});
