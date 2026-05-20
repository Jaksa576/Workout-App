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
- session logging and check-ins
- progression logic that recommends advancing, repeating, reviewing, or adjusting
- personalization from profile, goal, equipment, schedule, limitations, and preferences

## Primary Workflows

- Create a plan through optional AI-Guided Plan drafting when enabled, Guided Setup, Manual Builder, or provider-free Draft with AI.
- Review and edit generated or imported drafts before saving.
- Follow the active plan and current phase.
- Complete workouts and log session signals.
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

## Training Logic Principles

- Preserve the plan/program -> phase -> workout -> exercise -> session/progression model.
- Keep progression deterministic, explainable, and testable.
- Keep user-confirmed progression actions rather than silently mutating plans.
- Preserve rehab-informed and return-to-sport support without making clinical claims.
- Flag clinician input when symptoms, pain, injury, or medical uncertainty require it.
- Do not diagnose medical conditions.

## AI / LLM Product Boundary

Plan creation must work without an LLM.

The Direct AI-Guided Plan Creation campaign explicitly approves optional provider-backed AI drafting under strict constraints:

- direct AI drafting is feature-gated and can be disabled without breaking plan creation
- provider keys and provider calls stay server-side
- generated drafts must be strictly validated before review
- generated drafts must enter the existing review/edit/save flow
- users must review and may edit AI-generated plan, phase, workout, and exercise details before saving
- deterministic progression remains the source of truth after save
- phases remain the durable plan structure
- clinician input should be suggested for pain, injury, symptoms, or medical uncertainty

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
- require provider integration outside an explicitly approved campaign
- generate active-plan phase alternatives or automatic next-phase replacements in this campaign

## UX Principles

- Mobile-first, clear, and action-oriented.
- Emphasize what to do today, where the user is in the current phase, and what comes next.
- Keep plan detail in Plans rather than duplicating it everywhere.
- Keep AI workflows transparent: draft, validate, review, edit, save.
- Preserve safety and validation guidance even when reducing copy.
- Use "Phase" for user-facing progressive training segments while preserving compatibility names such as `plan_phases`.

## Non-Goals

- Do not become a generic exercise logger.
- Do not remove the planned phase/block structure.
- Do not require an LLM for core flows.
- Do not add provider-backed LLM integration outside an explicitly approved campaign.
- Do not save AI-generated plans without validation and user review.
- Do not weaken auth, RLS, or private user data assumptions.
- Do not replace clinician judgment or diagnose medical conditions.
- Do not add AI-generated phase alternatives or automatic next-phase replacement during the Direct AI-Guided Plan Creation campaign.

## Success Criteria

The product is successful when users can:

- understand the plan they are following
- know what workout to do today
- log sessions with minimal friction
- see progression status and next action clearly
- create and edit plans without AI provider dependencies when direct AI is disabled
- use optional external or provider-backed AI draft support safely
- trust that history remains readable after plan changes

## Future Product Opportunities

- Exercise media and richer instruction quality
- Exercise substitutions
- Read-only plan sharing
- Richer history and trend views
- Admin-editable exercise catalog
- AI-assisted phase alternatives after direct plan drafting is proven safe
