# Product

## Product Identity

Workout App is a progression-based adaptive training system. It helps users create structured programs, complete planned workouts, log sessions/check-ins, and adapt training based on progression signals.

It is not a generic workout logger. The app should keep users anchored to a plan/program, phases, workouts, exercises, session history, and explicit progression decisions.

## Target Users And Use Cases

The product should support users who want structured guidance across:

- rehab and return-to-activity
- general fitness
- strength
- hypertrophy
- running
- sport performance
- consistency and habit building

It should work for users who need a safe deterministic plan today while leaving room for richer drafting assistance later.

## Core Differentiation

Programs adapt to the user. They do not merely record workouts.

The differentiated experience is:

- structured programs/plans
- phases that organize progression over time
- planned workouts and exercises
- low-friction, exercise-appropriate session recording
- readiness and check-in signals
- progression logic that recommends advancing, repeating, reviewing, or adjusting
- personalization from profile, goal, equipment, schedule, limitations, and preferences

## Primary Workflows

- Create a plan through Guided Setup, Manual Builder, provider-free Draft with AI, or optional direct AI drafting when enabled.
- Review and edit generated or imported drafts before saving.
- Follow the active plan and current phase.
- Start a planned workout and record exercise performance with fields appropriate to the exercise.
- Complete workout-level readiness and symptom check-ins.
- Use progression recommendations to decide whether to advance, repeat, review, or adjust.
- Edit saved plan details without losing readable workout/session history.

## Supported Goal Tracks

Goal tracks:

- recovery
- general fitness
- strength
- hypertrophy
- running
- sport performance
- consistency

Progression modes:

- symptom-based
- adherence-based
- performance-based
- hybrid

## Training And Recording Principles

- Preserve the plan/program -> phase -> workout -> exercise -> session/progression model.
- Recording should enrich a prescribed workout rather than replace the plan with ad hoc free-form logging.
- Exercise tracking fields should be deterministic, explicit, and appropriate to the movement or activity.
- Planned targets and actual results should remain distinguishable.
- Preserve enough snapshots that history remains readable after plan edits.
- Keep progression deterministic, explainable, and testable.
- Keep user-confirmed progression actions rather than silently mutating plans.
- Preserve rehab-informed and return-to-sport support without making clinical claims.
- Flag clinician input when symptoms, pain, injury, or medical uncertainty require it.
- Do not diagnose medical conditions.

Issue #6 owns the current overhaul of workout execution and exercise recording. Its first delivery step must establish the durable tracking, session, snapshot, unilateral, and legacy-history contract before broad UI or schema work begins.

## AI / LLM Product Boundary

Plan creation must work without an LLM.

Optional provider-backed drafting is queued in GitHub Issue #8 under strict constraints:

- direct AI drafting is feature-gated and can be disabled without breaking plan creation
- provider keys and provider calls stay server-side
- generated drafts must be strictly validated before review
- generated drafts must enter the existing review/edit/save flow
- users must review and may edit AI-generated plan, phase, workout, and exercise details before saving
- deterministic progression remains the source of truth after save
- phases remain the durable plan structure
- clinician input should be suggested for pain, injury, symptoms, or medical uncertainty
- the structured exercise output must align with the tracking contract established through Issue #6

Provider-free external draft import remains supported:

- the app generates structured prompt/context
- the user may use their own external AI assistant
- pasted output is strictly validated
- the user reviews and edits before saving
- Supabase remains the system of record

LLMs may assist drafting, but must not:

- replace deterministic progression
- bypass validation
- save unreviewed plans
- become required for core functionality
- mutate an active plan or automatically replace the next phase without an explicitly approved issue

## UX Principles

- Mobile-first, clear, and action-oriented.
- Emphasize what to do today, where the user is in the current phase, and what comes next.
- During an active workout, prioritize the current exercise and current set over broad analytics.
- Keep history, trends, and deep how-to detail available through progressive disclosure rather than crowding execution.
- Keep plan detail in Plans rather than duplicating it everywhere.
- Keep AI workflows transparent: draft, validate, review, edit, save.
- Preserve safety and validation guidance even when reducing copy.
- Use “Phase” for user-facing progressive training segments while preserving compatibility names such as `plan_phases`.

## Development Planning Model

GitHub issues own active development scope and sequencing. Large umbrella issues should be decomposed into reviewable child issues, and pull requests should reference the issue they implement.

Campaign documents are deprecated and must not be treated as current product truth.

## Non-Goals

- Do not become a generic exercise logger.
- Do not remove the planned phase structure.
- Do not require an LLM for core flows.
- Do not save AI-generated plans without validation and user review.
- Do not weaken auth, RLS, or private user-data assumptions.
- Do not replace clinician judgment or diagnose medical conditions.
- Do not copy another fitness app’s branding, proprietary assets, or exact visual trade dress.
- Do not force all exercises into weight-and-reps logging.

## Success Criteria

The product is successful when users can:

- understand the plan they are following
- know what workout to do today
- record planned exercise performance with minimal friction
- use appropriate fields for weighted, bodyweight, timed, distance, unilateral, rehab, and performance work
- recover an interrupted active workout without silent data loss
- see relevant prior performance without overwhelming the execution screen
- complete readiness and symptom check-ins
- see progression status and next action clearly
- create and edit plans without AI provider dependencies when direct AI is disabled
- use optional external or provider-backed AI draft support safely
- trust that history remains readable after plan changes

## Future Product Opportunities

- exercise substitutions
- richer exercise history, records, and trend views
- read-only plan sharing
- admin-editable exercise catalog
- advanced set types such as warm-up, drop, and failure sets
- supersets and circuits
- wearable integrations
- AI-assisted phase alternatives only after direct plan drafting and the deterministic recording/progression contract are proven safe
## Exercise Identity Principles

Exercise identity distinguishes stable exercise concepts from harmless naming variants. Reviewed aliases such as punctuation/capitalization differences may resolve to one canonical exercise, but equipment, stance, laterality, range of motion, loading pattern, movement intent, and rehab/return-to-sport context must remain separate when they change exercise meaning.

Users can keep or create custom exercises when no canonical match fits. Custom exercises must not be silently converted later, and historical plan/session display names remain readable snapshots even when canonical identity metadata changes.
