# Roadmap

This roadmap tracks the practical implementation path for evolving the app from a recovery-first phased workout app into a goal-based adaptive training platform.

The product should broaden the framing without replacing the engine. Keep structured plans/programs, progressive phases, workouts, exercises, sessions/check-ins, and server-side progression logic.

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

Status: implemented locally, then refined by Slice 4.5.

- Initially shifted user-facing plan segment language from "Phase" to "Block".
- Kept database names such as `plan_phases` unchanged for compatibility.
- Avoided broad internal renames.

## 4.5. Terminology Refinement And Lightweight Branding Polish

Status: implemented locally.

- Refine user-facing terminology back to concise "Phase" labels because "Block" was too vague in compact UI.
- Keep `plan_phases`, `phase-action`, `currentPhase`, and phase-shaped payloads unchanged for compatibility.
- Lightly update product framing to "Adaptive Training" with the subtitle "Structured plans that progress with you."
- Keep this presentation-only: no schema, API, progression, draft-generation, or settings workflow changes.

## 5A. Goal-Aware Templates, Richer Exercise Metadata, And Deterministic Defaults

Status: implemented locally.

- Expand catalog categories and tags for recovery, general fitness, strength, hypertrophy, running, sport performance, and consistency.
- Improve deterministic template drafts by goal track, equipment, schedule, limitations, and profile data.
- Use a bounded set of deterministic draft shapes rather than open-ended variation.
- Keep running sessions represented as exercise-like plan items until a later running-specific domain model exists.
- Use `source_exercise_id` to preserve traceability from catalog to saved plan exercises.
- Keep the setup -> draft -> review/edit -> save contract unchanged.

## 5B. Profile/Settings And Guided Edit-Plan Workflow

Status: next planned slice.

- Add a user-facing profile/settings workflow for updating durable training context.
- Add a guided edit-plan workflow for changing an existing plan without rebuilding onboarding.
- Keep manual edits available for advanced users.
- Preserve existing plan save paths and compatibility fields.

## 6. Contextual Dashboard And Progression UX

Status: planned.

- Make dashboard copy and next-step prompts more contextual to the active goal, phase, and recent sessions.
- Improve progression explanations so users understand why a phase should advance, repeat, or deload.
- Keep explicit user-confirmed phase movement.

## 7. Workout Execution UX

Status: planned.

- Improve in-session workout usability, logging flow, and check-in feedback.
- Keep workout history snapshots readable after plan edits.
- Avoid changing progression algorithms in this slice unless a narrow display change requires it.

## 8. Exercise Media And Instruction Layer

Status: planned.

- Expand exercise instruction quality, video/demo surfaces, and coaching notes.
- Keep the exercise catalog deterministic and editable through code until an admin/data workflow exists.

## 9. Broader Polish And Branding

Status: planned if still needed.

- Revisit visual polish, naming, and brand expression after the core training quality and workflow slices are stronger.
- Avoid doing broad branding work before deterministic plan quality improves.

## Later Product Work

## Read-Only Plan Sharing

- Add public-safe share links for plan details only.
- Shared pages can show plan, phase, workout, exercise, and video-link information.
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
- Keep trend summaries tied to the active plan and phase when appropriate.

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
- Update `docs/current-task.md` to the next slice after each completed slice.
- Update `docs/agent-handoff.md` after major implementation steps.
