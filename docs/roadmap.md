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

## 5B1. Profile/Settings Editing

Status: implemented locally.

- Add a user-facing profile/settings workflow for updating durable training context.
- Keep settings separate from onboarding and plan-specific setup.
- Let users explicitly clear optional profile fields from settings.
- Reuse shared profile types, validation, and option labels where practical.
- Follow-up candidate: improve settings field-level validation messaging for invalid values such as negative age or weight.
- Future consideration: some currently durable profile fields, such as training experience and current activity level, may later be reclassified or simplified as onboarding/setup context, plan-specific context, or last-known context. This is not an active redesign yet.

## 5B2. Guided Edit-Plan Workflow

Status: implemented locally.

- Delivered a setup-driven edit/regenerate workflow for changing an existing plan without rebuilding onboarding.
- Persist or reconstruct enough plan setup context to reopen guided plan configuration safely.
- Reuse setup -> draft -> review/edit -> save and write the reviewed result back to the same plan.
- Keep manual edits available for advanced users.
- Preserve existing plan save paths and compatibility fields.
- Product learning after QA: this flow is useful for updating setup inputs and regenerating a plan, but it should not be treated as the ideal primary general "edit existing plan" journey.

## 5B3. Reusable Review/Edit Flow For Existing Plans

Status: planned next.

- Separate the post-generation review/edit experience into a reusable screen or flow for existing plans.
- Make plan-detail review/edit the primary edit-existing-plan journey.
- Keep setup/regenerate as a distinct action for updating plan setup inputs.
- Defer removal of the legacy advanced/manual plan editor until the reusable review/edit flow fully covers the real editing use case.

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

## Profile Field Ownership

- Revisit which profile fields should remain durable account settings versus plan-context or setup-time inputs.
- Consider whether fields like training experience and current activity level should stay permanently user-editable in Settings, move into guided plan setup, or become last-known context used to seed future plans.
- Do not treat this as blocking Slice 5B3 or Slice 6 unless a future implementation plan explicitly says so.

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
