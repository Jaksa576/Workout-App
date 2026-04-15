# Architecture

This app is a mobile-first adaptive training planner built with Next.js, Supabase, and Vercel.

The product is evolving from a recovery-first phased workout app into a broader goal-based adaptive training platform. The architecture should broaden the product framing while preserving the existing engine where practical.

## Current State

### App Platform

- Next.js App Router powers the pages and API routes under `app/`.
- Supabase provides email authentication, Postgres storage, and row-level security.
- Vercel deploys the app from GitHub.
- Protected routes use `proxy.ts` plus server-side auth helpers.
- Data loading lives mostly in `lib/data.ts`.
- Writes generally flow through API route handlers, validation helpers, and the authenticated Supabase server client.

### Current Domain Engine

The current database and app model is:

1. `profiles`
2. `workout_plans`
3. `plan_phases`
4. `workout_templates`
5. `exercise_entries`
6. `workout_sessions`
7. `exercise_results`

This model is still the right core engine:

- A plan/program groups a longer training effort.
- A phase is the stored DB concept and current UI term for a progressive training segment.
- The database still uses `plan_phases` for compatibility.
- Workouts belong to a phase.
- Exercises belong to workouts.
- Sessions/check-ins record what happened and keep history snapshots.
- Progression logic uses recent sessions, completion, pain flags, effort, and phase snapshots to recommend advance, repeat, review, or deload/adjust decisions.

### Current Product Capabilities

Already implemented:

- first-user onboarding
- guided starter plan generation without LLM calls through `/plans/new`
- guided setup-driven plan regeneration for existing plans through `/plans/[planId]/edit-setup`
- manual structured plan creation
- multiple phases and workouts per plan
- active-phase workout recommendations
- workout check-ins and exercise completion tracking
- server-side progression evaluation after session save
- explicit phase movement and plan completion actions
- plan activation, archive, and plan structure cleanup
- YouTube demo links on exercises
- history snapshots for workout and exercise names
- persisted or reconstructed guided plan setup context on `workout_plans.setup_context`
- Slice 1 through Slice 5B2 foundation for broader goal-based architecture

## Target Direction

The target product is a goal-based adaptive training platform that supports:

- recovery / rehab
- general fitness
- strength
- hypertrophy
- running
- sport performance
- consistency / habit building

The engine should remain structured and adaptive. The app should not become a generic workout logger.

### Concepts To Preserve

- **Plans/programs:** Keep `workout_plans` as the top-level structure.
- **Phases:** Use "Phase" in product/UI framing for progressive training segments, while keeping `plan_phases` in the DB for compatibility.
- **Workouts:** Keep `workout_templates` as reusable planned sessions within a phase.
- **Exercises:** Keep `exercise_entries` as the saved exercise prescription for a workout.
- **Sessions/check-ins:** Keep `workout_sessions` and `exercise_results` as the history and progression signal source.
- **Progression logic:** Keep server-side progression evaluation and explicit user-confirmed plan movement.

### New Concepts Being Introduced

- **Goal tracks:** Plan and profile metadata can describe recovery, general fitness, strength, hypertrophy, running, sport performance, or consistency.
- **Progression modes:** Plans can use symptom-based, adherence-based, performance-based, or hybrid progression. The database field `workout_plans.progression_mode` is nullable and should be set by app code when enough context is available.
- **Richer profile data:** The profile model is expanding beyond a single goal string to include durable training context such as age, weight, experience, activity level, training environment, exercise preferences/dislikes, sports/interests, and limitations detail. This model may evolve: some currently stored fields, especially experience and activity level, may later be treated more like onboarding/setup context, plan-context inputs, or last-known context rather than permanent account settings.
- **Plan drafting abstraction:** Plan drafts should flow through `lib/plan-drafting/plan-draft-provider.ts`. The current enabled path is template-based; LLM drafting remains disabled.
- **Plan setup context:** Guided plan setup answers can be stored in `workout_plans.setup_context`. Existing older plans without that context can be reopened with safely reconstructed fields and explicit missing-context guidance. This currently supports setup-driven regeneration of a saved plan; it is not yet a replacement for primary plan-detail editing.
- **Catalog traceability:** Catalog-backed exercises can use `source_exercise_id` so future catalog and substitution work can reason about where an exercise came from.

## Data Flow

Most current writes should continue to follow this pattern:

1. A user fills out a form in a React component.
2. The component sends data to a Next.js API route.
3. The API route checks the signed-in user.
4. The API route validates the input.
5. Supabase writes the data using the authenticated server client.
6. A page reload or refresh reads updated data through `lib/data.ts`.

Plan creation should continue to save through `createStructuredPlanForUser` in `lib/plan-write.ts` so manual, template-generated, and future LLM-generated drafts share one persistence path.

Guided plan edits save through `updateStructuredPlanForUser` in `lib/plan-write.ts`. The edit path snapshots current workout and exercise names before replacing the live plan structure, then writes the reviewed draft back to the same `workout_plans` row.

The review/edit stage for generated plan details currently lives inside the guided create/regenerate flow. It is not yet exposed as a separate reusable existing-plan edit surface.

## Current Vs Target Boundaries

### Current

- Onboarding collects durable profile information and no longer owns goal-specific plan setup.
- `/plans/new` handles goal-specific plan setup and draft creation.
- `/plans/[planId]/edit-setup` handles setup-driven regeneration for an existing plan without rerunning onboarding.
- Review/edit of generated plan details exists inside the guided flow, but it is not yet the primary reusable edit-existing-plan journey.
- The advanced/manual plan editor still remains because the reusable review/edit replacement is not built yet.
- Product UI uses "Phase" for progressive plan segments.
- The starter exercise catalog is static TypeScript data.
- Progression is still mostly recovery/symptom-aware with clean-session rules.
- The template draft provider exists and LLM provider behavior is intentionally unavailable.

### Target

- Guided create and setup/regenerate continue to share the same setup -> draft -> review/edit -> save model.
- Primary editing for an existing plan should move toward a reusable review/edit surface for the already-generated plan details.
- Saved guided setup context should make setup/regenerate feel like reopening setup, not starting over.
- Setup/regenerate should stay distinct from general plan-detail editing.
- Goal-aware draft templates improve exercise selection and plan structure.
- Progression modes handle symptom-based, adherence-based, performance-based, and hybrid logic.
- Profile/settings field ownership may be refined over time as the product clarifies which data is durable account context versus plan-specific context.

### Deferred / Future

- LLM-assisted plan drafting.
- Exercise substitutions.
- Read-only plan sharing.
- Richer history and trend views.
- Admin-editable exercise catalog.

## LLM Boundary

LLM support is deferred and must not be required for the app to work.

When added later:

- The LLM should plug into plan creation, not onboarding.
- The LLM should act as a structured plan-drafting assistant.
- The LLM should return an editable `StructuredPlanInput`-style draft.
- The user must review before saving.
- The app must validate draft output before persistence.
- Supabase tables remain the system of record.
- API keys and provider details must stay server-side.
