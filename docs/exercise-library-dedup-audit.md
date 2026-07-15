# Issue #42A — Exercise Library Deduplication Audit

Status: **ready for product-owner review**  
Scope: **read-only audit and classification only**  
Generated: 2026-07-15

## Guardrails

- No consolidation writes are included in this slice.
- No identity, alias, active reference, session, result, or historical snapshot rows are changed by this artifact.
- No group is marked `approved`; only the product owner may move a group to `approved`.
- The migration/write slice must consume only groups that the product owner explicitly marks `approved` after reviewing this artifact.
- Historical `exercise_results` display snapshots remain intentionally untouched for all groups.
- Custom/user-owned exercises remain excluded unless a future product-approved flow captures explicit user consent.

## Readiness checklist

| Gate | Audit finding | Status |
| --- | --- | --- |
| Canonical identity and aliases are stable | Issue #41 added `exercise_identities`, `exercise_aliases`, and nullable canonical snapshots while preserving `source_exercise_id`. | Ready |
| Issue #41 migration present | `supabase/migrations/20260714120000_exercise_identity_aliases.sql` is committed and seeds 35 static catalog identities plus reviewed aliases. Hosted application was reported applied and verified in Issue #42 input. | Ready |
| Active reference paths are enumerable | Read-only SQL in `supabase/verification/issue-42-exercise-dedup-audit-readonly.sql` enumerates identities, aliases, plan entries, templates/seeds through entries, active workout/session rows, historical results, and unresolved/custom rows. | Ready |
| Historical snapshots independent | Saved result display fields are snapshots; Slice 42A proposes no updates to `exercise_results.exercise_name_snapshot` or set rows. | Ready |
| Custom/user-owned distinction | Owner scope and nullable canonical IDs distinguish system identities from unresolved/custom plan entries; user-owned identities remain excluded from system consolidation. | Ready |
| Audit before writes | This artifact and its SQL are read-only and contain proposed actions only. | Ready |
| Alias ambiguity blocked | Existing unique reviewed system alias index and the audit SQL check aliases resolving to multiple active canonical identities. | Ready |

## Summary totals

These totals classify the current repository-owned system catalog and reviewed alias model. Hosted reference counts must be filled from the read-only SQL before any Slice 42B migration is authored.

| Metric | Count |
| --- | ---: |
| System canonical identities in reviewed catalog | 35 |
| Reviewed alias rows expected from Issue #41 seed | 6 |
| Candidate groups reviewed below | 11 |
| Exact duplicate groups | 0 |
| Alias-only presentation variant groups | 4 |
| Confirmed distinct variant groups | 6 |
| Ambiguous review-required groups | 1 |
| Groups proposed for future approval | 4 |
| Groups rejected as distinct/no-merge | 6 |
| Groups needing product review | 1 |
| Approved groups | 0 |
| Active references proposed to move in Slice 42A | 0 |
| Historical snapshots intentionally untouched in Slice 42A | All |
| Custom/user-owned records intentionally excluded | All |

## Candidate groups

Reference count fields are separated by class and must be populated from `issue-42-exercise-dedup-audit-readonly.sql` against the authorized target before Slice 42B. `repo_static_catalog_identity_count` is known from the repository catalog; hosted counts are deliberately not invented.

### 42A-001 — Push-up punctuation aliases

| Field | Value |
| --- | --- |
| Record IDs / stable keys | `push-up` plus reviewed aliases `push up`, `pushup` |
| Current names and aliases | Canonical `Push-up`; aliases `push up`, `pushup` |
| Ownership scope | system |
| Reference counts | `repo_static_catalog_identity_count=1`; hosted reusable identities / active plan entries / templates-seeds / active workout-session records / historical snapshots / custom records: run read-only SQL |
| Equipment / movement qualifiers | Bodyweight; bilateral; push |
| Proposed canonical survivor | `push-up` |
| Category | Alias-only presentation variant |
| Rationale | Case/punctuation/spacing variants describe the same bodyweight push-up identity and are already reviewed aliases. |
| Proposed reference updates | If future approved, resolve active entries using these aliases to `canonical_exercise_id='push-up'`; do not rewrite display snapshots. |
| Historical impact statement | Historical result names stay unchanged; future result rows snapshot `canonical_exercise_id` from active entries. |
| Approval status | proposed |

### 42A-002 — Romanian deadlift abbreviation aliases

| Field | Value |
| --- | --- |
| Record IDs / stable keys | `romanian-deadlift` plus reviewed aliases `rdl`, `romanian dead lift` |
| Current names and aliases | Canonical `Romanian deadlift`; aliases `rdl`, `romanian dead lift` |
| Ownership scope | system |
| Reference counts | `repo_static_catalog_identity_count=1`; hosted counts pending read-only SQL |
| Equipment / movement qualifiers | Dumbbells/Barbell; bilateral; hinge |
| Proposed canonical survivor | `romanian-deadlift` |
| Category | Alias-only presentation variant |
| Rationale | Abbreviation and spacing variant are harmless reviewed aliases for the same loaded hinge identity. |
| Proposed reference updates | If future approved, resolve alias-backed active entries to `canonical_exercise_id='romanian-deadlift'`; do not alter custom entries automatically. |
| Historical impact statement | Historical result snapshots remain unchanged. |
| Approval status | proposed |

### 42A-003 — Bodyweight squat aliases

| Field | Value |
| --- | --- |
| Record IDs / stable keys | `bodyweight-squat` plus reviewed aliases `bodyweight squat`, `air squat` |
| Current names and aliases | Canonical `Bodyweight squat`; aliases `bodyweight squat`, `air squat` |
| Ownership scope | system |
| Reference counts | `repo_static_catalog_identity_count=1`; hosted counts pending read-only SQL |
| Equipment / movement qualifiers | Bodyweight; bilateral; squat |
| Proposed canonical survivor | `bodyweight-squat` |
| Category | Alias-only presentation variant |
| Rationale | The aliases are reviewed naming variants for the same unloaded squat identity. |
| Proposed reference updates | If future approved, resolve alias-backed active entries to `canonical_exercise_id='bodyweight-squat'`; do not merge box or loaded squat variants. |
| Historical impact statement | Historical result snapshots remain unchanged. |
| Approval status | proposed |

### 42A-004 — Dumbbell row abbreviation aliases

| Field | Value |
| --- | --- |
| Record IDs / stable keys | `dumbbell-row` plus reviewed aliases `db row`, `dumbbell row` |
| Current names and aliases | Canonical `Dumbbell row`; aliases `db row`, `dumbbell row` |
| Ownership scope | system |
| Reference counts | `repo_static_catalog_identity_count=1`; hosted counts pending read-only SQL |
| Equipment / movement qualifiers | Dumbbells; same-each-side; pull |
| Proposed canonical survivor | `dumbbell-row` |
| Category | Alias-only presentation variant |
| Rationale | Abbreviation and punctuation/spacing variants are reviewed aliases for the same dumbbell row identity. |
| Proposed reference updates | If future approved, resolve alias-backed active entries to `canonical_exercise_id='dumbbell-row'`; do not merge band row. |
| Historical impact statement | Historical result snapshots remain unchanged. |
| Approval status | proposed |

### 42A-005 — Bodyweight squat / box squat / goblet squat / barbell back squat

| Field | Value |
| --- | --- |
| Record IDs / stable keys | `bodyweight-squat`, `box-squat`, `goblet-squat`, `barbell-back-squat` |
| Current names and aliases | Four separate squat identities |
| Ownership scope | system |
| Reference counts | `repo_static_catalog_identity_count=4`; hosted counts pending read-only SQL |
| Equipment / movement qualifiers | Bodyweight vs bench-supported vs dumbbell/kettlebell loaded vs barbell loaded spine |
| Proposed canonical survivor | None; keep separate |
| Category | Confirmed distinct variant |
| Rationale | Loading, equipment, range/context, and training intent differ materially. |
| Proposed reference updates | None. |
| Historical impact statement | No historical impact. |
| Approval status | rejected |

### 42A-006 — Romanian deadlift / hip hinge drill / glute bridge

| Field | Value |
| --- | --- |
| Record IDs / stable keys | `romanian-deadlift`, `hip-hinge-drill`, `glute-bridge` |
| Current names and aliases | Three hinge/posterior-chain identities |
| Ownership scope | system |
| Reference counts | `repo_static_catalog_identity_count=3`; hosted counts pending read-only SQL |
| Equipment / movement qualifiers | Loaded dumbbell/barbell hinge vs bodyweight technique drill vs bodyweight/band bridge |
| Proposed canonical survivor | None; keep separate |
| Category | Confirmed distinct variant |
| Rationale | Equipment, movement execution, and rehab/technique context differ materially. |
| Proposed reference updates | None. |
| Historical impact statement | No historical impact. |
| Approval status | rejected |

### 42A-007 — Reverse lunge / walking lunge / lateral lunge / step-up

| Field | Value |
| --- | --- |
| Record IDs / stable keys | `reverse-lunge`, `walking-lunge`, `lateral-lunge`, `step-up` |
| Current names and aliases | Four unilateral lower-body identities |
| Ownership scope | system |
| Reference counts | `repo_static_catalog_identity_count=4`; hosted counts pending read-only SQL |
| Equipment / movement qualifiers | Sagittal stationary lunge vs traveling lunge vs frontal-plane lunge vs step-height pattern |
| Proposed canonical survivor | None; keep separate |
| Category | Confirmed distinct variant |
| Rationale | Stance, direction, range, and movement intent differ materially. |
| Proposed reference updates | None. |
| Historical impact statement | No historical impact. |
| Approval status | rejected |

### 42A-008 — Incline push-up / push-up / dumbbell floor press / dumbbell shoulder press

| Field | Value |
| --- | --- |
| Record IDs / stable keys | `incline-push-up`, `push-up`, `dumbbell-floor-press`, `dumbbell-shoulder-press` |
| Current names and aliases | Four pressing identities |
| Ownership scope | system |
| Reference counts | `repo_static_catalog_identity_count=4`; hosted counts pending read-only SQL |
| Equipment / movement qualifiers | Incline bodyweight push, floor horizontal dumbbell press, overhead dumbbell press |
| Proposed canonical survivor | None; keep separate |
| Category | Confirmed distinct variant |
| Rationale | Angle, equipment, loading, and intent differ materially. |
| Proposed reference updates | None. |
| Historical impact statement | No historical impact. |
| Approval status | rejected |

### 42A-009 — Band row / dumbbell row

| Field | Value |
| --- | --- |
| Record IDs / stable keys | `band-row`, `dumbbell-row` |
| Current names and aliases | Two row identities |
| Ownership scope | system |
| Reference counts | `repo_static_catalog_identity_count=2`; hosted counts pending read-only SQL |
| Equipment / movement qualifiers | Bands vs dumbbells; different loading and setup |
| Proposed canonical survivor | None; keep separate |
| Category | Confirmed distinct variant |
| Rationale | Similar movement pattern but materially different equipment and loading behavior. |
| Proposed reference updates | None. |
| Historical impact statement | No historical impact. |
| Approval status | rejected |

### 42A-010 — Brisk walk / easy run / run-walk intervals / stride drills / lateral shuffle / skater hop / low-impact cardio march

| Field | Value |
| --- | --- |
| Record IDs / stable keys | `brisk-walk`, `easy-run`, `run-walk-intervals`, `stride-drills`, `lateral-shuffle`, `skater-hop`, `low-impact-cardio-march` |
| Current names and aliases | Seven locomotion/conditioning identities |
| Ownership scope | system |
| Reference counts | `repo_static_catalog_identity_count=7`; hosted counts pending read-only SQL |
| Equipment / movement qualifiers | Walking, running, intervals, drills, lateral agility, hops, low-impact marching |
| Proposed canonical survivor | None; keep separate |
| Category | Confirmed distinct variant |
| Rationale | Modality, intensity, laterality, impact, and progression purpose differ materially. |
| Proposed reference updates | None. |
| Historical impact statement | No historical impact. |
| Approval status | rejected |

### 42A-011 — Calf raise / tibialis raise

| Field | Value |
| --- | --- |
| Record IDs / stable keys | `calf-raise`, `tibialis-raise` |
| Current names and aliases | Two lower-leg identities |
| Ownership scope | system |
| Reference counts | `repo_static_catalog_identity_count=2`; hosted counts pending read-only SQL |
| Equipment / movement qualifiers | Posterior calf plantarflexion vs anterior tibialis dorsiflexion |
| Proposed canonical survivor | None until product review confirms no hosted duplicate naming exists |
| Category | Ambiguous review required |
| Rationale | The repository catalog records distinct anatomical intent, but hosted custom/unresolved names such as generic "lower leg raise" could require product review rather than automated merge. |
| Proposed reference updates | None in Slice 42A. |
| Historical impact statement | No historical impact. |
| Approval status | needs_product_review |

## Hosted read-only count procedure

Run `supabase/verification/issue-42-exercise-dedup-audit-readonly.sql` against the authorized target and paste the result tables into the PR or issue before approving any Slice 42B group. The script returns:

1. summary counts for system identities, reviewed aliases, active plan entries, historical snapshots, custom/unresolved rows, and ambiguous aliases;
2. per-identity active reference counts;
3. per-candidate-group counts split by reusable identities, active plan entries, templates/seeds, active workout/session records, historical result snapshots, and custom/user-owned rows;
4. proposed alias-only groups with exact active entries that would move if later approved;
5. distinct/ambiguous groups that must not be moved automatically.

## Proposed Slice 42B boundary if approved later

A future write migration may only consume groups whose `approval_status` has been changed to `approved` by the product owner. For this audit, those groups are currently limited to alias-only candidates 42A-001 through 42A-004, and even those remain unapproved until product-owner action. The migration must be idempotent, report expected vs actual update counts by reference class, preserve historical snapshots, and stop on unexpected ambiguous aliases or custom/user-owned records.
