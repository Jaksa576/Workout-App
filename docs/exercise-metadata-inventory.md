# Exercise Metadata Inventory

This report is the committed review artifact for the repo-owned exercise metadata inventory. The typed source lives in `lib/exercise-metadata-inventory.ts` and is derived from the static exercise catalog so tests can prove synchronization with runtime defaults.

## Scope and hosted-data status

- Current committed inventory coverage: 37 catalog-backed exercise identities.
- Hosted Supabase legacy audit/backfill was not run from this environment and no hosted migrations were applied.
- `affectedRowCount` is intentionally `null` until an authorized database audit exports exact legacy `exercise_entries` counts.
- Unknown/custom exercises remain usable through the explicit `completion` fallback; deterministic catalog/inventory matching does not use fuzzy or substring inference.

## Totals by tracking type

| Tracking type | Reviewed names | Affected legacy rows |
| --- | ---: | ---: |
| `weight_reps` | 11 | pending authorized audit |
| `reps_only` | 20 | pending authorized audit |
| `duration` | 3 | pending authorized audit |
| `distance` | 0 | pending authorized audit |
| `distance_duration` | 2 | pending authorized audit |
| `completion` | 1 | pending authorized audit |

## Intentional completion

| Inventory key | Normalized name | Reason |
| --- | --- | --- |
| `breathing-reset` | breathing reset | No supported numeric, timed, or distance metric truthfully represents this activity. |

## Future metric candidates

| Inventory key | Normalized name | Candidate |
| --- | --- | --- |
| `farmer-carry` | farmer carry | `load_distance_candidate` |

## Ambiguity decisions

- Bodyweight and mobility exercises are `reps_only` unless the catalog prescription is explicitly timed or endurance-oriented; they are not treated as loaded just because a variation can be loaded.
- `same_each_side` is used for unilateral wording where one shared value applies to both sides; no catalog exercise is marked `independent_sides` without an explicit asymmetry-tracking requirement.
- Brisk walk and easy run remain `distance_duration` because distance and elapsed time are both useful history/progression signals.
- Farmer carry remains `weight_reps` in the current catalog contract but is flagged as a future `load_distance` candidate.
