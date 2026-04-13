# Roadmap

This roadmap tracks the practical implementation path for evolving the app from a recovery-first phased workout app into a goal-based adaptive training platform.

The product should broaden the framing without replacing the engine. Keep structured plans/programs, progressive phases/Blocks, workouts, exercises, sessions/check-ins, and server-side progression logic.

## Near-Term Refactor Slices

## 1. Domain Foundation And Draft Abstraction

Status: implemented locally.

- Add richer profile metadata fields.
- Add plan metadata for goal type, nullable `progression_mode`, and creation source.
- Add `source_exercise_id` for catalog-backed exercise entries.
- Move plan drafting behind an AI-neutral provider boundary.
- Keep LLM drafting unavailable.
- Add minimal automated tests for draft generation, validation, and progression-mode selection.

## 2. Onboarding/Profile Separation

Status: implemented locally.

- Make onboarding collect durable profile data instead of goal-specific plan setup.
- Preserve the new-user onboarding gate.
- Keep guided/manual plan creation working until `/plans/new` is expanded.
- Do not add LLM support in this slice.

## 3. `/plans/new` Goal-Specific Plan Setup

Status: implemented locally.

- Move goal-specific plan setup into `/plans/new`.
- Let users choose goal track and progression mode when creating a plan.
- Keep manual plan creation available.
- Route template draft generation through the plan drafting abstraction.
- Require review before saving generated drafts.

## 4. UI Terminology Shift Toward Blocks

Status: planned.

- Update product/UI language from "Phase" to "Block" where user-facing.
- Keep database names such as `plan_phases` unchanged for compatibility.
- Avoid broad internal renames unless they are small and clearly reduce confusion.

## 5. Goal-Aware Exercise Catalog And Draft Quality

Status: planned.

- Expand catalog categories and tags for recovery, general fitness, strength, hypertrophy, running, sport performance, and consistency.
- Improve template drafts by goal track, equipment, schedule, limitations, and profile data.
- Use `source_exercise_id` to preserve traceability from catalog to saved plan exercises.

## 6. Progression Behavior Expansion

Status: planned.

- Support symptom-based progression for recovery and rehab use cases.
- Add adherence-based progression for consistency and general fitness.
- Add performance-based progression for strength, hypertrophy, running, and sport performance where appropriate.
- Add hybrid progression for goals that need both readiness/symptom checks and performance signals.
- Keep explicit user-confirmed Block movement.

## Later Product Work

## Read-Only Plan Sharing

- Add public-safe share links for plan details only.
- Shared pages can show plan, Block/phase, workout, exercise, and video-link information.
- Do not expose profile data, workout sessions, check-in notes, pain history, or progress data.
- Prefer a sharing model that does not weaken private user RLS policies.

## Exercise Substitutions

- Start with manual substitution options for limitations, pain, equipment, or preference changes.
- Let users choose a substitution during a workout.
- Keep the original plan intact and log what changed.
- Leave automatic or AI substitutions until the manual substitution flow is solid.

## History And Trends

- Add richer session history and progress trend views.
- Preserve workout and exercise snapshots so deleted plan structure remains readable in history.
- Keep trend summaries tied to the active plan/Block when appropriate.

## Deferred AI / LLM Drafting

LLM support is deferred.

When implemented:

- LLM support should plug into plan creation, not onboarding.
- The LLM should be a structured plan-drafting assistant, not the system of record.
- Drafts should be editable before saving.
- Draft output must be validated before persistence.
- API keys and provider details must stay server-side.
- The app must remain fully functional without LLM configuration.

## Ongoing Maintenance

- Keep solutions additive and migration-safe.
- Preserve backward compatibility where practical.
- Preserve recovery-first roots and symptom-aware progression as an important supported mode.
- Keep manual plan creation available.
- Keep Supabase auth and row-level security expectations intact.
- Update `docs/agent-handoff.md` after major implementation steps.
