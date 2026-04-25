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

Status: implemented locally.

- Add a primary existing-plan detail edit route that opens the saved plan details in the reusable review/edit flow.
- Keep setup/regenerate as a distinct action for updating plan setup inputs.
- Preserve compatible plan update writes and readable history snapshots after edits.
- Keep the legacy advanced/manual plan editor available as a secondary advanced path; removal stays deferred until a future slice fully covers the remaining use cases.

Post-5B3 product learning:

- The reusable review/edit flow is the correct primary edit-existing-plan journey.
- The advanced/manual plan-detail edit section no longer appears necessary as a surfaced path.
- The surfaced setup/regenerate action is being reconsidered because creating a new plan may be the clearer UX for larger setup changes.

Immediate post-5B3 cleanup patch, implemented locally based on QA learning after release:

- simplify the review/save copy in the `Edit details` flow
- remove the surfaced advanced/manual plan-detail edit section from the main plan-detail page
- remove the surfaced `Update setup & regenerate` action from the main plan-detail page
- keep archive available as a smaller secondary control
- keep `/plans/[planId]/edit-setup` available as a direct route for now, rather than claiming 5B3 always intended to remove it

## 6. UI Overhaul Phase 1

Status: implemented locally.

- This is a foundation slice, not a full redesign.
- Add light/dark theme support through a small semantic token layer and a local client-side preference override.
- Introduce shared mobile-first UI primitives for plan surfaces, including page headers, summary cards, section cards, and clearer phase/workout hierarchy patterns.
- Establish responsive layout rules so mobile remains the primary experience and desktop becomes a wider version of the same information architecture.
- Refresh the saved-plan detail page, `/plans/[planId]/edit`, and `/plans/[planId]/edit-setup`.
- Keep the current adaptive-training engine, save semantics, history snapshots, and edit-versus-regenerate route boundaries unchanged.
- Do not broaden this slice into dashboard redesign, workout execution redesign, onboarding/setup redesign, or major route reorganization.

## 6.5. UI Polish And Theme Refinement

Status: implemented locally.

Post-Slice 6 QA identified a small follow-up patch needed before the next major slice:

- Fix dark-mode contrast and readability issues on already-touched surfaces.
- Tune semantic theme tokens for consistency and accessibility.
- Relocate theme preference control into Settings instead of surfacing a toggle on every page.
- No domain-model, API, or progression-engine changes.

## 7. AI-Assisted Plan Draft Import

Status: implemented locally.

- Add a `Draft with AI` path inside `/plans/new` without changing onboarding ownership.
- Generate a copyable prompt from structured plan setup inputs so the user can use their own external AI assistant.
- Accept pasted structured AI output from the user and validate it before it can enter app state as a draft.
- Normalize accepted AI output into the existing setup -> draft -> review/edit -> save flow rather than creating a parallel save path.
- Require user review before save; the app remains the system of record.
- Do not integrate a provider, store provider credentials, or require any LLM configuration for core plan creation.
- Do not broaden this slice into progression/dashboard redesign, workout execution redesign, or onboarding redesign.

## 8. Contextual Dashboard And Progression UX

Status: implemented locally.

- Built on the UI foundation from Slice 6 with a workout-first dashboard home screen.
- Added a compact 5-day "This week" preview with safe fallback copy when workout-specific schedules are missing.
- Added compact workout activity, phase progress, and symptom/pain trend summaries.
- Fixed the active-phase sync issue by deriving dashboard progression messaging and CTAs from the same active plan, active phase, and `calculatePhaseProgress()` result.
- Kept explicit user-confirmed phase movement by routing progression CTAs to the existing plan progress surface.

Accepted narrow QA follow-up:

- reduced the weekly preview to a compact 5-day view
- used compact date treatment with right-aligned date pills
- removed repeated `Keep the streak going` copy from adjacent dashboard cards
- preserved the active-phase/progression CTA sync and kept the patch dashboard-only

## 9. Workout Execution UX

Status: planned.

- Improve in-session workout usability, logging flow, and check-in feedback.
- Keep workout history snapshots readable after plan edits.
- Avoid changing progression algorithms in this slice unless a narrow display change requires it.

## 10. Exercise Media And Instruction Layer

Status: planned.

- Expand exercise instruction quality, video/demo surfaces, and coaching notes.
- Keep any future auto-population of exercise media/video links from generated plan output aligned with this later slice rather than pulling it into Slice 7 stabilization.
- Keep the exercise catalog deterministic and editable through code until an admin/data workflow exists.

## 11. Broader Polish And Branding

Status: planned if still needed.

- Revisit broader polish, naming, and brand expression only after the UI foundation, dashboard, workout execution, and exercise instruction slices are stronger.
- Keep this intentionally narrow if it happens; it should not become a vague catch-all redesign bucket.
- Avoid doing broad branding work before the core training quality and workflow slices are stronger.
- Deferred product-quality follow-up from Slice 7 QA for `/plans/new` should stay outside the narrow active stabilization patch and outside roadmap resequencing:
  - align Guided Setup and Draft with AI more closely over time so plan type selection and step order feel more consistent
  - rename or better explain unclear plan-creation terms such as `Preferred split`, `Temporary focus areas`, and Draft-with-AI `Progression mode`
  - refine helper-text presentation on plan-creation surfaces so helpful guidance can move into a more compact interaction pattern instead of always showing uneven inline subtext
  - keep AI prompt generation tightly goal-specific rather than blending multiple goal framings
  - make assigned-day handling clearer and more consistent across prompt generation, import expectations, and review/edit surfaces
  - reduce repeated schedule-selection emphasis across Guided Setup, Manual Builder, and Draft with AI so schedule choices feel less redundant across the create-plan flow
  - improve external-AI export/import ergonomics so structured prompt generation and copy/paste handoff are easier without committing yet to a provider-backed feature or a specific export format

## Later Product Work

## Profile Field Ownership

- Revisit which profile fields should remain durable account settings versus plan-context or setup-time inputs.
- Consider whether fields like training experience and current activity level should stay permanently user-editable in Settings, move into guided plan setup, or become last-known context used to seed future plans.
- Do not treat this as blocking Slice 8 unless a future implementation plan explicitly says so.

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

## Workout Flexibility

- Consider future plan-aware alternate/random workout support for days when the user wants something different while still keeping momentum.
- Keep this aligned with structured plans, active phase context, progression safety, and adaptive training logic.
- Do not turn this into a generic workout picker that undermines the programmed plan.
- Defer the interaction design for quick user choices or alternate-session selection until a later workout execution/flexibility slice.
- This is not part of the current Slice 8 dashboard follow-up patch.

## Deferred AI / LLM Drafting

Near-term external AI draft import should arrive before any provider-backed in-app LLM work.

Near-term external AI draft import:

- is now implemented locally through `/plans/new`
- should stay inside plan creation, not onboarding
- should generate a structured, copyable prompt from `/plans/new` inputs
- should accept pasted structured output from the user's own external AI assistant
- should validate and normalize imported output before it can enter the review/edit/save flow
- should require review before persistence
- should not add provider integration, API-key handling, or runtime LLM dependencies

Later optional provider-backed LLM drafting remains deferred.

When implemented:

- provider-backed LLM drafting should plug into plan creation, not onboarding
- the LLM should be a structured plan-drafting assistant, not the system of record
- drafts should be editable before saving
- draft output must be validated before persistence
- API keys and provider details must stay server-side
- the app must remain fully functional without LLM configuration

## Ongoing Maintenance

- Keep solutions additive and migration-safe.
- Preserve backward compatibility where practical.
- Preserve recovery-first roots and symptom-aware progression as an important supported mode.
- Keep manual plan creation available.
- Keep Supabase auth and row-level security expectations intact.
- Update `docs/current-task.md` to the next slice after each completed slice.
- Update `docs/agent-handoff.md` after major implementation steps.
