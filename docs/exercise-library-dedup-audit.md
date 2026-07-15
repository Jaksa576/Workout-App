# Issue #42A Exercise Library Deduplication Audit

Status: **hosted read-only execution complete for PR #67 / Issue #42A**.

Audited target: **Workout-app-dev**.

This document is the authoritative read-only Slice 42A audit artifact for Issue #42. It records the corrected hosted audit findings that were run against `Workout-app-dev`; it does not introduce migrations, application behavior, canonical data changes, alias data changes, hosted writes, or historical rewrites.

## Scope and approval boundary

- The approved Slice 42A result is **17 unresolved normalized-name groups / 72 active exercise-entry repairs** for future canonical identity-reference repair in Slice 42B.
- Approval is limited to setting `exercise_entries.canonical_exercise_id` to the listed existing active system canonical identity for the approved groups below.
- Future repair must preserve existing `exercise_entries.id` values, entry display names, prescriptions, ordering, guidance, ownership, and tracking metadata.
- Related `exercise_results.canonical_exercise_id` may be backfilled only where the source entry and exact identity mapping make the result deterministic and safe.
- Historical display snapshots, result names, set/result metrics, progression attribution, and user-visible historical names remain untouched.
- Identity linking is separate from tracking-metadata cleanup. Issue #40 tracking-type/unit/laterality/set/rep/prescription cleanup is not authorized by this audit.
- Approval does **not** permit tracking-type changes, unit changes, laterality changes, set/rep/prescription changes, historical-name rewrites, materially different variant merges, new canonical identities, explicit user-owned custom identity changes, or hosted migration application.
- Slice 42B may consume **only** the 17 approved mappings below unless product-owner approval is explicitly expanded in a future issue/PR.

## Hosted summary totals

| Metric | Count |
| --- | ---: |
| Hosted unresolved normalized-name groups approved for future identity-reference repair | 17 |
| Hosted active exercise entries approved for future identity-reference repair | 72 |
| Existing active system canonical identities targeted by approved mappings | 17 |
| New canonical identities approved by this audit | 0 |
| Tracking-metadata repairs approved by this audit | 0 |
| Database/application writes introduced by PR #67 / Slice 42A | 0 |

## Approved hosted mappings for future Slice 42B identity repair

These mappings were produced by the corrected read-only audit logic against `Workout-app-dev`. Each normalized name resolved deterministically to exactly one existing active system canonical identity and is approved for future identity-reference repair only.

| Normalized name | Canonical ID | Approved entry count | Classification | Approval scope |
| --- | --- | ---: | --- | --- |
| `dead bug` | `dead-bug` | 10 | exact legacy reference repair | Set `exercise_entries.canonical_exercise_id` only. |
| `step up` | `step-up` | 8 | exact legacy reference repair | Set `exercise_entries.canonical_exercise_id` only. |
| `farmer carry` | `farmer-carry` | 7 | exact legacy reference repair | Set `exercise_entries.canonical_exercise_id` only. |
| `side plank` | `side-plank` | 7 | exact legacy reference repair | Set `exercise_entries.canonical_exercise_id` only. |
| `dumbbell row` | `dumbbell-row` | 5 | reviewed alias legacy reference repair | Set `exercise_entries.canonical_exercise_id` only. |
| `lateral shuffle` | `lateral-shuffle` | 5 | exact legacy reference repair | Set `exercise_entries.canonical_exercise_id` only. |
| `push up` | `push-up` | 5 | reviewed alias legacy reference repair | Set `exercise_entries.canonical_exercise_id` only. |
| `calf raise` | `calf-raise` | 4 | exact legacy reference repair | Set `exercise_entries.canonical_exercise_id` only. |
| `easy run` | `easy-run` | 4 | exact legacy reference repair | Set `exercise_entries.canonical_exercise_id` only. |
| `walking lunge` | `walking-lunge` | 4 | exact legacy reference repair | Set `exercise_entries.canonical_exercise_id` only. |
| `bird dog` | `bird-dog` | 3 | exact legacy reference repair | Set `exercise_entries.canonical_exercise_id` only. |
| `glute bridge` | `glute-bridge` | 3 | exact legacy reference repair | Set `exercise_entries.canonical_exercise_id` only. |
| `reverse lunge` | `reverse-lunge` | 3 | exact legacy reference repair | Set `exercise_entries.canonical_exercise_id` only. |
| `band row` | `band-row` | 1 | exact legacy reference repair | Set `exercise_entries.canonical_exercise_id` only. |
| `bodyweight squat` | `bodyweight-squat` | 1 | reviewed alias legacy reference repair | Set `exercise_entries.canonical_exercise_id` only. |
| `box squat` | `box-squat` | 1 | exact legacy reference repair | Set `exercise_entries.canonical_exercise_id` only. |
| `lateral lunge` | `lateral-lunge` | 1 | exact legacy reference repair | Set `exercise_entries.canonical_exercise_id` only. |
| **Total** |  | **72** |  |  |

## Deferred unmatched and excluded groups

The groups below remain visible for review but are not approved for Slice 42B identity repair. They are classified so a future product-owner decision can expand scope without treating them as already approved.

| Group | Classification | Current decision |
| --- | --- | --- |
| Romanian deadlift naming and abbreviation variants beyond deterministic hosted matches | ambiguous review | No action in 42B unless product approval expands the mapping set after confirming metadata compatibility and material exercise meaning. |
| Bodyweight squat / box squat / goblet squat / barbell back squat | confirmed distinct | Keep separate; do not merge loaded, box-supported, or bodyweight squat variants. |
| Romanian deadlift / hip hinge drill / glute bridge | confirmed distinct | Keep separate; do not merge loaded hinge, technique drill, and bridge patterns. |
| Reverse lunge / walking lunge / lateral lunge / step-up variants outside the approved exact mappings | confirmed distinct | Keep separate unless an individual unresolved exact-name row is in the approved table above. |
| Incline push-up / push-up / dumbbell floor press / dumbbell shoulder press | confirmed distinct | Keep separate; angle, loading, and equipment differ materially. |
| Band row / dumbbell row variants outside the approved exact mappings | confirmed distinct | Keep separate; equipment and loading differ materially. |
| Brisk walk / easy run / run-walk intervals / stride drills / lateral shuffle / skater hop / low-impact cardio march | confirmed distinct | Keep separate; modality, intensity, impact, and progression purpose differ materially. |
| Calf raise / tibialis raise / generic lower-leg names outside the approved exact `calf raise` mapping | ambiguous review | No action until product review distinguishes posterior calf plantarflexion from anterior tibialis dorsiflexion or other lower-leg movements. |
| Explicit user-owned custom identities and custom entries | intentional custom | Excluded from automated repair; future custom handling requires explicit user/product-approved behavior. |
| Names with no existing active system canonical identity and no approved deterministic target | proposed new canonical | Do not attach to a similar exercise; review as possible future catalog expansion. |
| Names with zero active unresolved references after corrected hosted execution | no action | No Slice 42B repair needed. |

## Historical-impact and privacy statement

The audit committed only normalized names, canonical IDs, aggregate counts, and classification decisions. It intentionally excludes user IDs, plan names, notes, emails, raw personal records, and other sensitive hosted data. Future Slice 42B work must continue to avoid sensitive hosted data in committed artifacts.

Historical display snapshots and set/result metrics remain unchanged. Any future deterministic result canonical backfill must be limited to safe identity references and must not rewrite `exercise_results.exercise_name_snapshot`, set metrics, prescriptions, notes, progression signals, or user-visible history.

## Corrected read-only SQL coverage

`supabase/verification/issue-42-exercise-dedup-audit-readonly.sql` remains the read-only verification script for this audit. It uses matched row IDs instead of `count(*)`, pre-aggregates entry and result references before joining, separates active plan/template references from historical results, enumerates normalized `exercise_entries.name` groups, and exposes unresolved groups for classification without performing writes.

## Proposed Slice 42B / 42C boundary

A future Slice 42B migration may consume only the 17 approved mappings in this document, must be additive and idempotent, must include exact expected counts, must stop if counts differ from **17 groups / 72 entries**, and must preserve display names, historical snapshots, metrics, prescriptions, ordering, guidance, ownership, tracking metadata, and explicit custom records.

Issue #40 tracking cleanup and Slice 42C duplicate-prevention/search-selection behavior are separate focused implementation work. 42C may use the identity-resolution boundary established by 42B, but this read-only audit does not authorize app behavior changes or database writes.
