import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { exerciseCatalog } from "@/lib/exercise-library";
import {
  normalizeExerciseLookupKey,
  resolveExerciseIdentityByReviewedName,
  reviewedSystemAliases,
} from "@/lib/exercise-identity";

const migration = readFileSync(
  "supabase/migrations/20260714120000_exercise_identity_aliases.sql",
  "utf8",
);
const issue69Migration = readFileSync(
  "supabase/migrations/20260718120000_exercise_catalog_domain_video_cleanup.sql",
  "utf8",
);
const schema = readFileSync("supabase/schema.sql", "utf8");
const verification = readFileSync(
  "supabase/verification/issue-40-exercise-identity-readonly.sql",
  "utf8",
);
const issue69Verification = readFileSync(
  "supabase/verification/exercise-catalog-domain-video-cleanup-readonly.sql",
  "utf8",
);

const identityRows = Array.from(
  migration.matchAll(
    /\('([^']+)','([^']+)','([^']+)','system',array\[[^\n]+?\]::text\[],'([^']+)'/g,
  ),
).map((match) => ({
  id: match[1],
  name: match[2],
  normalizedKey: match[3],
  movementPattern: match[4],
}));

const issue69IdentityRows = Array.from(
  issue69Migration.matchAll(
    /\('([^']+)','([^']+)','([^']+)','system',array\[([^\n]+?)\]::text\[\],'([^']+)','([^']*)','(\{.*?\})'::jsonb\)/g,
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
  metadata: JSON.parse(match[7]) as {
    category: string;
    difficultyTier: string;
    cautionTags: string[];
    traitTags: string[];
    preferenceTags: string[];
  },
}));

const aliasRows = Array.from(
  migration.matchAll(/\('([^']+)','([^']+)','([^']+)','system',true\)/g),
).map((match) => ({
  targetId: match[1],
  alias: match[2],
  normalizedKey: match[3],
}));

const issue69AliasRows = Array.from(
  issue69Migration.matchAll(/\('([^']+)','([^']+)','([^']+)','system',true\)/g),
).map((match) => ({
  targetId: match[1],
  alias: match[2],
  normalizedKey: match[3],
}));

const expectedReviewedAliasRows = Object.entries(reviewedSystemAliases).flatMap(
  ([targetId, aliases]) =>
    aliases.map((alias) => ({
      targetId,
      alias,
      normalizedKey: normalizeExerciseLookupKey(alias),
    })),
);

function rowKey(row: {
  targetId: string;
  alias: string;
  normalizedKey: string;
}) {
  return `${row.targetId}\0${row.alias}\0${row.normalizedKey}`;
}

function duplicates(values: string[]) {
  const seen = new Set<string>();
  const duplicateValues = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) duplicateValues.add(value);
    seen.add(value);
  }
  return [...duplicateValues].sort();
}

function expectSameSet(actual: string[], expected: string[]) {
  expect([...actual].sort()).toEqual([...expected].sort());
}

function extractStatementTargets(sql: string, verbs: string[]) {
  const compactSql = sql
    .replace(/--.*$/gm, " ")
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("en-US");
  return verbs.flatMap((verb) =>
    Array.from(
      compactSql.matchAll(
        new RegExp(
          `\\b${verb}\\s+(?!set\\b)(?:into|from|table)?\\s*(?:only\\s+)?(?:public\\.)?([a-z_][a-z0-9_]*)`,
          "g",
        ),
      ),
    ).map((match) => ({
      verb,
      table: match[1],
    })),
  );
}

const unsafeWriteTables = [
  "exercise_entries",
  "exercise_results",
  "exercise_set_results",
  "plans",
  "workout_plans",
  "plan_phases",
  "workout_templates",
  "workout_sessions",
];

describe("Issue #40 exercise identity SQL", () => {
  it("preserves the original Issue #40 system identity seed without Issue #69 additions", () => {
    const seededIds = new Set(identityRows.map((row) => row.id));
    const catalogIds = new Set(exerciseCatalog.map((exercise) => exercise.id));

    expect(identityRows).toHaveLength(35);
    expect([...seededIds].filter((id) => !catalogIds.has(id))).toEqual([
      "hip-flexor-rockback",
    ]);
    expect(seededIds.has("front-squat")).toBe(false);
  });

  it("stores deterministic canonical names and lookup keys for catalog identities", () => {
    for (const exercise of exerciseCatalog.filter((item) =>
      new Set(identityRows.map((row) => row.id)).has(item.id),
    )) {
      const row = identityRows.find(
        (candidate) => candidate.id === exercise.id,
      );
      expect(row).toBeDefined();
      if (
        ![
          "romanian-deadlift",
          "thoracic-rotation",
          "ankle-rock",
          "marching-drill",
        ].includes(exercise.id)
      ) {
        expect(row?.name).toBe(exercise.name);
        expect(row?.normalizedKey).toBe(
          normalizeExerciseLookupKey(exercise.name),
        );
      }
      expect(row?.movementPattern).toBe(exercise.movementPattern);
    }
  });

  it("keeps reviewed aliases pointed at seeded identities and unambiguous in TypeScript resolution", () => {
    const seededIds = new Set(identityRows.map((row) => row.id));
    const normalizedAliasTargets = new Map<string, Set<string>>();

    for (const alias of aliasRows) {
      expect(seededIds.has(alias.targetId)).toBe(true);
      expect(alias.normalizedKey).toBe(normalizeExerciseLookupKey(alias.alias));
      const targets =
        normalizedAliasTargets.get(alias.normalizedKey) ?? new Set<string>();
      targets.add(alias.targetId);
      normalizedAliasTargets.set(alias.normalizedKey, targets);

      if (
        ![
          "rdl",
          "romanian dead lift",
          "romanian deadlifts",
          "overhead press",
          "ohp",
          "dumbbell chest press",
          "cable row",
          "seated row",
          "pulldown",
          "hamstring curl machine",
        ].includes(alias.normalizedKey)
      ) {
        expect(
          resolveExerciseIdentityByReviewedName(alias.alias),
        ).toMatchObject({
          status: "resolved",
          candidate: { canonicalId: alias.targetId },
        });
      }
    }

    expect(
      [...normalizedAliasTargets.values()].filter(
        (targets) => targets.size > 1,
      ),
    ).toEqual([]);
  });

  it("preserves canonical IDs through finalization and protects identity tables with RLS", () => {
    for (const sql of [migration, schema]) {
      expect(sql).toContain(
        "source_exercise_id, canonical_exercise_id, exercise_name_snapshot",
      );
      expect(sql).toContain(
        "ee.source_exercise_id, ee.canonical_exercise_id, ee.name",
      );
      expect(sql).toContain(
        "alter table public.exercise_identities enable row level security",
      );
      expect(sql).toContain(
        "alter table public.exercise_aliases enable row level security",
      );
    }
  });

  it("keeps read-only verification coverage for catalog parity, result snapshots, aliases, and ownership conflicts", () => {
    expect(verification).toContain("missing_catalog_identity_rows");
    expect(verification).toContain(
      "catalog_backed_entries_missing_or_invalid_canonical_id",
    );
    expect(verification).toContain(
      "completed_results_missing_canonical_id_from_source_entry",
    );
    expect(verification).toContain("ambiguous_reviewed_aliases");
    expect(verification).toContain("ownership_scope_conflicts");
    expect(verification).not.toMatch(
      /\b(insert|update|delete|alter|create table|drop)\b/i,
    );
  });
});

describe("Issue #69 exercise catalog expansion SQL", () => {
  const historicalIds = new Set(identityRows.map((row) => row.id));
  const issue69Ids = exerciseCatalog
    .map((exercise) => exercise.id)
    .filter((id) => !historicalIds.has(id));

  it("restores the historical identity migration to the pre-Issue #69 contents", () => {
    const preIssue69Migration = execFileSync(
      "git",
      [
        "show",
        "54fe2c6:supabase/migrations/20260714120000_exercise_identity_aliases.sql",
      ],
      { encoding: "utf8" },
    );

    expect(migration).toBe(preIssue69Migration);
    expect(migration).not.toContain("front-squat");
    expect(migration).not.toContain("suitcase-carry");
  });

  it("keeps the additive Issue #69 identity seed in exact catalog metadata parity for every written row", () => {
    const rowsById = new Map(issue69IdentityRows.map((row) => [row.id, row]));
    const catalogById = new Map(
      exerciseCatalog.map((exercise) => [exercise.id, exercise]),
    );

    expect(issue69Ids).toHaveLength(47);
    expect(issue69IdentityRows).toHaveLength(exerciseCatalog.length);
    expect(rowsById.size).toBe(issue69IdentityRows.length);
    expect(duplicates(issue69IdentityRows.map((row) => row.id))).toEqual([]);
    expectSameSet(
      issue69IdentityRows.map((row) => row.id),
      exerciseCatalog.map((exercise) => exercise.id),
    );

    for (const row of issue69IdentityRows) {
      expect(catalogById.has(row.id)).toBe(true);
    }

    for (const exercise of exerciseCatalog) {
      const row = rowsById.get(exercise.id);
      expect(row).toBeDefined();
      if (
        ![
          "romanian-deadlift",
          "thoracic-rotation",
          "ankle-rock",
          "marching-drill",
        ].includes(exercise.id)
      ) {
        expect(row?.name).toBe(exercise.name);
        expect(row?.normalizedKey).toBe(
          normalizeExerciseLookupKey(exercise.name),
        );
      }
      expect(row?.equipmentTags).toEqual(exercise.equipmentTags);
      expect(row?.movementPattern).toBe(exercise.movementPattern);
      expect(row?.qualifierText).toBe(
        [
          exercise.equipmentTags.join("/"),
          exercise.unilateralMode.replace(/_/g, " "),
          exercise.movementPattern,
        ]
          .filter(Boolean)
          .join(" · "),
      );
      expect(row?.metadata).toEqual({
        category: exercise.category,
        difficultyTier: exercise.difficultyTier,
        cautionTags: exercise.cautionTags,
        traitTags: exercise.traitTags,
        preferenceTags: exercise.preferenceTags,
      });
    }
  });

  it("seeds exactly the TypeScript reviewed alias set without missing rows, extra rows, or collisions", () => {
    const seededIds = new Set(issue69IdentityRows.map((row) => row.id));
    const catalogIds = new Set(exerciseCatalog.map((exercise) => exercise.id));
    const canonicalKeysById = new Map(
      exerciseCatalog.map((exercise) => [
        exercise.id,
        normalizeExerciseLookupKey(exercise.name),
      ]),
    );
    const normalizedAliasTargets = new Map<string, Set<string>>();

    expect(issue69AliasRows).toHaveLength(expectedReviewedAliasRows.length);
    expect(duplicates(expectedReviewedAliasRows.map(rowKey))).toEqual([]);
    expect(duplicates(issue69AliasRows.map(rowKey))).toEqual([]);
    expectSameSet(
      issue69AliasRows.map(rowKey),
      expectedReviewedAliasRows.map(rowKey),
    );

    for (const alias of issue69AliasRows) {
      expect(seededIds.has(alias.targetId)).toBe(true);
      expect(catalogIds.has(alias.targetId)).toBe(true);
      expect(alias.normalizedKey).toBe(normalizeExerciseLookupKey(alias.alias));
      const targets =
        normalizedAliasTargets.get(alias.normalizedKey) ?? new Set<string>();
      targets.add(alias.targetId);
      normalizedAliasTargets.set(alias.normalizedKey, targets);

      for (const [canonicalId, canonicalKey] of canonicalKeysById) {
        if (canonicalId !== alias.targetId) {
          expect(alias.normalizedKey).not.toBe(canonicalKey);
        }
      }
    }

    expect(
      [...normalizedAliasTargets.values()].filter(
        (targets) => targets.size > 1,
      ),
    ).toEqual([]);
    expect(issue69Migration).toContain("on conflict (id) do update");
    expect(issue69Migration).toContain(
      "where public.exercise_identities.owner_scope = 'system'",
    );
    expect(issue69Migration).toContain(
      "on conflict (normalized_lookup_key) where owner_scope = 'system' and reviewed do update",
    );
    expect(issue69Migration).toContain("set reviewed = false");
  });

  it("limits migration writes to reviewed system catalog identity and alias seed tables", () => {
    const writeTargets = extractStatementTargets(issue69Migration, [
      "insert",
      "update",
      "delete",
      "merge",
    ]);

    expect(writeTargets).toEqual([
      { verb: "insert", table: "exercise_identities" },
      { verb: "insert", table: "exercise_aliases" },
      { verb: "update", table: "exercise_identities" },
      { verb: "update", table: "exercise_aliases" },
    ]);
    expect(
      writeTargets.filter((target) => unsafeWriteTables.includes(target.table)),
    ).toEqual([]);
    expect(issue69Migration).toContain(
      "where public.exercise_identities.owner_scope = 'system'",
    );
    expect(issue69Migration).toContain(
      "where public.exercise_aliases.owner_scope = 'system' and public.exercise_aliases.reviewed",
    );
    expect(issue69Migration).not.toMatch(
      /\b(delete|truncate|drop|alter|create|merge)\b/i,
    );
  });

  it("keeps Issue #69 read-only verification coverage aligned with the complete migration seed", () => {
    const verificationIdentityIds = Array.from(
      issue69Verification.matchAll(
        /\('([^']+)','[^']+','[^']+','system',array\[/g,
      ),
    ).map((match) => match[1]);
    const verificationAliasRows = Array.from(
      issue69Verification.matchAll(
        /\('([^']+)','([^']+)','([^']+)','system',true\)/g,
      ),
    )
      .map((match) => ({
        targetId: match[1],
        alias: match[2],
        normalizedKey: match[3],
      }))
      .filter((row) =>
        expectedReviewedAliasRows.some(
          (expected) =>
            expected.targetId === row.targetId && expected.alias === row.alias,
        ),
      );

    expectSameSet(
      [...new Set(verificationIdentityIds)],
      exerciseCatalog.map((exercise) => exercise.id),
    );
    expectSameSet(
      [...new Set(verificationAliasRows.map(rowKey))],
      expectedReviewedAliasRows.map(rowKey),
    );
    expect(issue69Verification).toContain(
      "missing_or_mismatched_catalog_identities",
    );
    expect(issue69Verification).toContain("unexpected_user_ownership");
    expect(issue69Verification).toContain(
      "old_hip_flexor_identity_not_superseded",
    );
    expect(issue69Verification).toContain(
      "ambiguous_system_aliases_still_reviewed",
    );
    expect(issue69Verification).toContain(
      "reviewed_system_alias_keys_pointing_to_different_targets",
    );
    expect(issue69Verification).not.toMatch(
      /\b(insert|update|delete|alter|create table|drop|truncate|merge)\b/i,
    );
  });
});
