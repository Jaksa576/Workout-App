import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { exerciseCatalog } from "@/lib/exercise-library";
import { normalizeExerciseLookupKey, resolveExerciseIdentityByReviewedName } from "@/lib/exercise-identity";

const migration = readFileSync("supabase/migrations/20260714120000_exercise_identity_aliases.sql", "utf8");
const issue69Migration = readFileSync("supabase/migrations/20260717120000_issue69_exercise_catalog_expansion.sql", "utf8");
const schema = readFileSync("supabase/schema.sql", "utf8");
const verification = readFileSync("supabase/verification/issue-40-exercise-identity-readonly.sql", "utf8");
const issue69Verification = readFileSync("supabase/verification/issue-69-exercise-catalog-expansion-readonly.sql", "utf8");

const identityRows = Array.from(
  migration.matchAll(/\('([^']+)','([^']+)','([^']+)','system',array\[[^\n]+?\]::text\[],'([^']+)'/g)
).map((match) => ({ id: match[1], name: match[2], normalizedKey: match[3], movementPattern: match[4] }));

const issue69IdentityRows = Array.from(
  issue69Migration.matchAll(/\('([^']+)','([^']+)','([^']+)','system',array\[([^\n]+?)\]::text\[\],'([^']+)','([^']*)','(\{.*?\})'::jsonb\)/g)
).map((match) => ({
  id: match[1],
  name: match[2],
  normalizedKey: match[3],
  equipmentTags: Array.from(match[4].matchAll(/'([^']+)'/g)).map((item) => item[1]),
  movementPattern: match[5],
  qualifierText: match[6],
  metadata: JSON.parse(match[7]) as { category: string; difficultyTier: string; cautionTags: string[]; traitTags: string[]; preferenceTags: string[] }
}));

const aliasRows = Array.from(
  migration.matchAll(/\('([^']+)','([^']+)','([^']+)','system',true\)/g)
).map((match) => ({ targetId: match[1], alias: match[2], normalizedKey: match[3] }));

const issue69AliasRows = Array.from(
  issue69Migration.matchAll(/\('([^']+)','([^']+)','([^']+)','system',true\)/g)
).map((match) => ({ targetId: match[1], alias: match[2], normalizedKey: match[3] }));

describe("Issue #40 exercise identity SQL", () => {
  it("preserves the original Issue #40 system identity seed without Issue #69 additions", () => {
    const seededIds = new Set(identityRows.map((row) => row.id));
    const catalogIds = new Set(exerciseCatalog.map((exercise) => exercise.id));

    expect(identityRows).toHaveLength(35);
    expect([...seededIds].filter((id) => !catalogIds.has(id))).toEqual([]);
    expect(seededIds.has("front-squat")).toBe(false);
  });

  it("stores deterministic canonical names and lookup keys for catalog identities", () => {
    for (const exercise of exerciseCatalog.filter((item) => new Set(identityRows.map((row) => row.id)).has(item.id))) {
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


describe("Issue #69 exercise catalog expansion SQL", () => {
  const historicalIds = new Set(identityRows.map((row) => row.id));
  const issue69Ids = exerciseCatalog.map((exercise) => exercise.id).filter((id) => !historicalIds.has(id));

  it("restores the historical identity migration to the pre-Issue #69 contents", () => {
    const preIssue69Migration = execFileSync("git", ["show", "54fe2c6:supabase/migrations/20260714120000_exercise_identity_aliases.sql"], { encoding: "utf8" });

    expect(migration).toBe(preIssue69Migration);
    expect(migration).not.toContain("front-squat");
    expect(migration).not.toContain("suitcase-carry");
  });

  it("keeps the additive Issue #69 identity seed in exact catalog metadata parity", () => {
    const rowsById = new Map(issue69IdentityRows.map((row) => [row.id, row]));

    expect(issue69Ids).toHaveLength(36);
    for (const exercise of exerciseCatalog.filter((item) => issue69Ids.includes(item.id))) {
      const row = rowsById.get(exercise.id);
      expect(row).toBeDefined();
      expect(row?.name).toBe(exercise.name);
      expect(row?.normalizedKey).toBe(normalizeExerciseLookupKey(exercise.name));
      expect(row?.equipmentTags).toEqual(exercise.equipmentTags);
      expect(row?.movementPattern).toBe(exercise.movementPattern);
      expect(row?.qualifierText).toBe([exercise.equipmentTags.join("/"), exercise.unilateralMode.replace(/_/g, " "), exercise.movementPattern].filter(Boolean).join(" · "));
      expect(row?.metadata).toEqual({
        category: exercise.category,
        difficultyTier: exercise.difficultyTier,
        cautionTags: exercise.cautionTags,
        traitTags: exercise.traitTags,
        preferenceTags: exercise.preferenceTags
      });
    }

    for (const row of issue69IdentityRows.filter((item) => issue69Ids.includes(item.id))) {
expect(row.metadata.traitTags.length + row.metadata.preferenceTags.length + row.metadata.cautionTags.length).toBeGreaterThan(0);
    }
  });

  it("seeds reviewed aliases idempotently without missing targets or alias collisions", () => {
    const seededIds = new Set(issue69IdentityRows.map((row) => row.id));
    const normalizedAliasTargets = new Map<string, Set<string>>();

    for (const alias of issue69AliasRows) {
      expect(seededIds.has(alias.targetId)).toBe(true);
      expect(alias.normalizedKey).toBe(normalizeExerciseLookupKey(alias.alias));
      const targets = normalizedAliasTargets.get(alias.normalizedKey) ?? new Set<string>();
      targets.add(alias.targetId);
      normalizedAliasTargets.set(alias.normalizedKey, targets);
    }

    expect([...normalizedAliasTargets.values()].filter((targets) => targets.size > 1)).toEqual([]);
    expect(issue69Migration).toContain("on conflict (id) do update");
    expect(issue69Migration).toContain("where public.exercise_identities.owner_scope = 'system'");
    expect(issue69Migration).toContain("on conflict (normalized_lookup_key) where owner_scope = 'system' and reviewed do update");
  });

  it("keeps Issue #69 read-only verification coverage aligned with migration risks", () => {
    expect(issue69Verification).toContain("missing_new_canonical_identities");
    expect(issue69Verification).toContain("wrong_catalog_metadata_json");
    expect(issue69Verification).toContain("alias_to_canonical_collisions");
    expect(issue69Verification).toContain("user_owned_identities_affected");
    expect(issue69Verification).toContain("historical_snapshots_touched");
    expect(issue69Verification).toContain("idempotency_rerun_blockers");
    expect(issue69Verification).not.toMatch(/\b(insert|update|delete|alter|create table|drop)\b/i);
  });
});
