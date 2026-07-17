# Exercise Catalog Maintenance

Issue #69 keeps the exercise catalog code-owned and deterministic. The authoritative canonical catalog is `exerciseCatalog` in `lib/exercise-library.ts`; the authoritative reviewed alias map is `reviewedSystemAliases` in `lib/exercise-identity.ts`. Do not create a second registry, matcher, fuzzy resolver, generated-name inference layer, or product-facing catalog-maintenance UI.

## Add a canonical exercise

1. Add one stable kebab-case ID and display name to `exerciseCatalogBase`.
2. Choose category, movement pattern, equipment, goal, difficulty, caution, trait, and preference tags from existing conventions.
3. Add concise sets/reps/rest defaults and a short coaching note.
4. Add a `catalogMetadataOverrides` entry when the default `reps_only` metadata is not correct.
5. Keep materially distinct equipment, stance, grip, body position, range-of-motion, loading-position, machine/free-weight, seated/standing, incline/flat, and unilateral variants as separate canonical exercises.

## Add a reviewed alias

Add an alias to `reviewedSystemAliases` only when the alias is an established unambiguous name for exactly one active canonical exercise. Good aliases include safe abbreviations (`DB`, `BB`, `KB`, `RDL`), plural/singular variants, and common reordered names. Do not use an alias to hide a materially different exercise.

## Classify ambiguous generic names

Generic names such as `Row`, `Press`, `Shoulder Press`, `Curl`, `Lunge`, and `Leg Curl` remain review-blocking through the Issue #62 resolver. Add generic terms only to the existing generated-plan ambiguity set when multiple catalog exercises are plausible. Never assign a generic term arbitrarily to improve match rate.

## Validate tracking metadata

Use explicit metadata only. `weight_reps` requires a load unit and primary/secondary labels. `distance` and `distance_duration` require distance units, and `distance_duration` also needs a duration label. Completion, reps-only, and duration exercises should not carry load or distance units. Unilateral mode should match how the movement is actually recorded; do not swap `same_each_side` and `independent_sides` casually.

## Review YouTube URLs

A reviewed video URL must be a supported YouTube video URL (`youtube.com/watch?v=...`, `youtu.be/...`, or `youtube.com/shorts/...`) and must demonstrate the exact catalog variation, equipment, body position, and unilateral mode. If the URL cannot be verified, leave it blank and add the item to the human-review queue rather than fabricating or guessing.

## Use the inventory report

Run the deterministic report checks with:

```bash
npm test -- --run lib/__tests__/exercise-catalog-report.test.ts
```

The report builder in `lib/exercise-catalog-report.ts` returns catalog totals, alias integrity, coverage counts, metadata/video gaps, fixture-based unmatched and `needs_review` names, material coverage gaps, and human-review queue items. Report output is intentionally read-only: do not automatically create aliases or exercises from it.

## Keep database identity seed parity

`exerciseCatalog` remains the authoritative metadata source for system catalog identities. When catalog-backed exercises are added, do not edit an already-committed historical migration. Add a new additive timestamped migration that seeds only system-owned identity/alias rows and maps the database identity model subset exactly: canonical ID, display name, normalized lookup key, equipment tags, movement pattern, qualifier text, category, difficulty tier, caution tags, trait tags, and preference tags.

Catalog expansion migrations must be idempotent, must not modify user-owned identities, and must not rewrite historical exercise-entry or exercise-result display snapshots. Add or update parity tests so drift between the TypeScript catalog and SQL seed fails in CI, and include a read-only verification SQL artifact for applying the migration through the approved Supabase flow.
