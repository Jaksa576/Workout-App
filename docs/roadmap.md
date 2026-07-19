# Roadmap

This roadmap tracks durable milestone sequencing and deferred product work. GitHub issues own active implementation scope, acceptance criteria, and pull-request linkage.

Campaign documents are deprecated. Historical campaign terminology below refers only to completed work and is not the current development workflow.

## Current Priority

### Issue #6 — Overhaul workout execution and exercise recording

Status: prioritized umbrella issue.

Purpose:

- replace whole-exercise checklist logging with structured set-level recording
- support deterministic exercise-specific tracking fields
- add explicit active-workout lifecycle and elapsed time
- preserve planned targets and relevant prior performance
- integrate rest timing into set completion
- provide focused exercise Summary, History, and How-to information
- preserve readiness signals, history snapshots, auth/RLS, and deterministic progression

The first child issue must be discovery and domain-contract work only. It should verify the current schema, API, RLS, history, and progression seams before any broad migration or UI replacement.

Approved child-issue sequence after Issue #9 discovery:

1. Issue #9 — discovery, domain contract, and issue breakdown (docs-only)
2. Issue #10 — set-result data foundation and execution/history reset
3. active-session lifecycle, local draft recovery, and elapsed-time shell
4. weight-plus-reps and reps-only execution
5. duration, distance-duration, unilateral, and completion-oriented tracking
6. rest timer integration and session controls
7. exercise Summary / History / How-to surface
8. finish flow, atomic save, dashboard/history reads, and progression integration
9. settings, accessibility, polish, and comprehensive QA

Issue #10 must land the committed Supabase migration, canonical schema update, generated-type update, RLS/index strategy, and preview QA handoff before broad UI replacement begins.

## Active Priority

### Issue #8 — Direct AI-guided plan creation

Status: active through Issue #65. The backend readiness gate is complete and the plan-creation integration is in implementation and QA.

Issue #62 established the provider-neutral generated-draft contract, Issue #63/PR #79 completed the server-only Gemini adapter, Issue #64/PR #80 completed authenticated quota/orchestration, and Issue #81/PR #82 completed conservative success accounting and Gemini 3.5 compatibility. The hosted migration, verification, and controlled smoke test are complete. Issue #65 now integrates direct generation into the existing `/plans/new` setup, review/editor, and explicit structured save flow without introducing generation-time persistence.

This work remains important, but the generated exercise prescription format must align with the tracking types, units, snapshots, unilateral conventions, and session-result model approved through Issue #6.

Delivery sequence:

- AI-first feature-gated `/plans/new` shell and review/edit/save integration (Issue #65: active)
- server-only provider adapter and configuration (Issue #63/PR #79: complete)
- quota/event storage, RLS, and authenticated generation (Issue #64/PR #80 and Issue #81/PR #82: complete)
- review/edit/save integration through the existing structured save boundary (Issue #65: active)
- privacy, failure-state, accessibility, and end-to-end QA

## Completed Foundations

The following major foundations are complete:

- domain foundation and plan-drafting abstraction
- onboarding/profile separation
- goal-specific `/plans/new` setup
- phase terminology refinement
- goal-aware deterministic templates and richer exercise metadata
- profile/settings editing
- guided and reusable plan editing
- semantic theme and shared mobile-first UI foundations
- provider-free AI draft prompt/export/import workflow
- contextual dashboard and deterministic progression UX
- public landing and authenticated dashboard route split
- authenticated app shell redesign
- dashboard redesign
- plans and phase hierarchy redesign
- first-pass workout execution visual redesign
- plan creation and settings polish
- AI draft setup, handoff, import, and UX cleanup
- exercise guidance and reviewed demo links
- browser-timezone-aware dashboard and workout dates

These milestones remain historical context. New work should not be organized into campaign documents.

## Later Product Work

### Profile Field Ownership

- Revisit which profile fields belong to durable account settings versus plan context or setup-time inputs.
- Consider whether training experience and current activity level should remain permanently editable or become last-known setup context.

### Read-Only Plan Sharing

- Add public-safe share links for plan details only.
- Do not expose profile data, workout sessions, check-in notes, pain history, or progress data.
- Do not weaken private-user RLS policies.

### Exercise Substitutions

- Start with deterministic manual substitution options for limitations, pain, equipment, or preference changes.
- Preserve the original planned exercise and log what changed.
- Defer automatic or AI substitutions until the manual contract is proven.

### History And Trends

- Add richer session and exercise trend views after the set-result model is stable.
- Preserve workout, exercise, prescription, unit, and tracking-type snapshots.
- Keep trend summaries tied to plan and phase context where appropriate.

### Workout Flexibility

- Consider plan-aware alternate sessions without undermining the programmed plan.
- Do not turn this into a generic workout picker.

### Advanced Execution Features

After the core Issue #6 experience is stable, consider separate issues for:

- supersets and circuits
- warm-up, drop, and failure set types
- RPE/RIR and other advanced set metadata
- plate calculator
- wearable integrations
- richer exercise records and analytics

### Deferred AI Work

After Issue #8 and the deterministic execution model are proven safe, later issues may consider:

- AI-assisted phase alternatives
- reviewed next-phase drafting
- AI-assisted substitutions
- history-aware draft suggestions

LLMs must remain optional and must not replace deterministic progression, validation, or user approval.

## Ongoing Maintenance

- Keep solutions additive and migration-safe.
- Preserve backward compatibility where practical.
- Preserve rehab, symptom-aware, strength, hypertrophy, performance, general-fitness, and consistency use cases.
- Keep manual and non-AI plan creation available.
- Keep Supabase auth and row-level security expectations intact.
- Use the Windows-native Codex worktree workflow unless explicitly overridden.
- Keep `.env.local` local-only and gitignored.
- Update `docs/current-task.md` after every implementation issue or docs-only priority change.
- Update the active GitHub issue when scope or status changes.
- Update this roadmap only when major sequencing or milestone status changes.
- Update `docs/architecture.md` only for durable technical or workflow changes.
- Update `docs/product.md` only for durable product truth changes.
- Do not create or update campaign documents.
- Codex final reports must include the issue number, branch, commit SHA, pushed remote branch, validation results, documentation delta, compact state packet, and branch-push verification result.

### AI generated draft boundary

Issue #62 completed the canonical draft and deterministic matcher, Issue #69 expanded reviewed catalog coverage, Issue #63/PR #79 completed the server-only Gemini adapter, Issue #64/PR #80 completed authenticated atomic quota/orchestration, and Issue #81/PR #82 completed fail-closed completion accounting and Gemini 3.5 compatibility. The hosted readiness work is complete. Issue #65 is active and connects generation to the existing setup, review/editor, and explicit structured save boundary without changing the no-persistence-before-review rule.
