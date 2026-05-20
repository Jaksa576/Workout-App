# Direct AI-Guided Plan Creation Campaign

## Status

Active. Slice 1 docs-only alignment is complete; Slice 2 is next.

## Product decision

This campaign intentionally changes the current AI boundary from provider-free external AI import only to approved optional provider-backed AI drafting.

The approved direction is:

- AI-Guided Plan becomes the primary `/plans/new` path when enabled.
- Guided Setup and Manual Builder remain available as secondary non-AI paths.
- External AI import remains available as a fallback/advanced path.
- Plan creation must still work without an LLM.
- AI must not bypass validation.
- Generated plans must be reviewed and edited before save.
- Deterministic progression remains the source of truth.
- Phases remain the durable plan structure.

This campaign does not implement AI-driven active-plan mutation or AI-generated next-phase alternatives. Those belong in a later campaign.

## Provider and cost posture

Initial provider target: Gemini API Free Tier through Google AI Studio.

No-bill-first constraints:

- Use a Google AI Studio / Gemini API key tied to a project with no active billing account for the hobby deployment.
- Keep the API key server-side only.
- Disable direct AI generation unless explicit env configuration is present.
- Do not enable paid-only features.
- Do not enable Google Search grounding, Google Maps grounding, file upload, image generation, video generation, tuning, context caching, or other tools.
- Enforce app-side server quota even if provider quota is higher.
- Default app quota: one successful AI plan generation per authenticated user per local day.
- Default attempt limit: three provider attempts per authenticated user per local day.
- Existing non-AI flows must remain available when the provider is disabled, unavailable, or quota-limited.

Privacy posture:

- Free/unpaid AI services can have different data-use terms than paid services.
- The UX must warn users not to submit sensitive, confidential, or highly personal medical information.
- Prompts should minimize personal data and send only what is needed to draft a plan.
- The app must not diagnose medical conditions or replace clinician judgment.
- For pain, injury, symptoms, or medical uncertainty, user-facing copy should suggest clinician input.

## Objective

Replace the current manual copy/paste AI prompt handoff with a direct, in-app AI plan draft generation workflow.

The target experience is:

1. User opens `/plans/new`.
2. User sees AI-Guided Plan as the first/default creation option when enabled.
3. User answers setup questions.
4. User sees daily limit, privacy, and review-before-save guidance before generating.
5. User taps `Generate plan draft`.
6. Server checks auth, feature flag, quota, and provider config.
7. Server sends a minimized prompt to the provider.
8. Server parses and validates the response.
9. Valid draft enters the existing review/edit flow.
10. User reviews/edits.
11. User explicitly saves through the existing structured plan write path.

## Current repo assumptions to verify before implementation

Codex must inspect the latest source-of-truth docs first:

- `AGENTS.md`
- `docs/product.md`
- `docs/architecture.md`
- `docs/roadmap.md`
- `docs/current-task.md`
- active `docs/campaigns/*.md`, if any

Known current-state expectations from planning:

- The project is between active slices.
- Slice 10 and the timezone follow-up are complete and merged to `main`.
- Current AI flow is provider-free external import.
- Plan drafting should flow through `lib/plan-drafting/plan-draft-provider.ts`.
- Guided Setup, Manual Builder, and AI draft/import paths should converge on review/edit/save.
- Saved plan creation should use `createStructuredPlanForUser`.
- Existing validation must remain strict.

If repo docs disagree with these expectations, stop and report the conflict before editing.

## Scope

### In scope

- Active campaign doc and source-of-truth updates.
- AI-first `/plans/new` creation hierarchy.
- Feature-gated direct AI generation workflow.
- Server-only Gemini provider adapter.
- Server-side quota tracking.
- Typed provider/config/quota errors.
- Strict structured output parsing and validation.
- Existing review/edit/save flow integration.
- Fallback to external AI import, Guided Setup, and Manual Builder.
- User-facing free-tier, quota, privacy, and review-before-save copy.
- Tests and manual QA for success, disabled, quota, invalid output, and provider error states.
- Vercel/server env documentation for required variables.

### Non-goals

- Do not remove Guided Setup.
- Do not remove Manual Builder.
- Do not remove external AI import.
- Do not save generated plans without user review.
- Do not create a parallel plan persistence path.
- Do not rewrite deterministic progression.
- Do not implement AI phase adaptation or automatic next-phase replacement.
- Do not implement AI exercise substitutions.
- Do not add YouTube API/search/embeds.
- Do not add provider billing or paid-tier assumptions.
- Do not expose API keys to client code.
- Do not broaden this into a general UI redesign.

## UX requirements

### `/plans/new` hierarchy

When direct AI is enabled:

1. Primary card/action: `Create with AI`
2. Secondary card/action: `Guided Setup`
3. Secondary card/action: `Manual Builder`
4. Fallback/advanced card/action: `Use external AI / paste a draft`

When direct AI is disabled:

- Existing Guided Setup, Manual Builder, and external AI import remain usable.
- The AI card can be hidden or shown as unavailable, but it must not create a dead end.

### Required UX states

| State | Expected behavior |
|---|---|
| AI disabled / no key | Direct AI is unavailable; non-AI and external AI flows still work. |
| AI enabled, quota available | AI is visually primary and actionable. |
| First-time AI guidance | Show daily limit, privacy warning, draft-not-final copy, and review-before-save copy. |
| Setup incomplete | Generate action disabled with clear missing-field guidance. |
| Ready to generate | Primary action says `Generate plan draft` or equivalent. |
| Loading | Show non-blocking progress UI, duplicate-submit protection, and plain-language status. |
| Success | User lands in existing review/edit flow with generated draft. |
| Invalid model output | Show recoverable error and fallback options; do not save or enter review. |
| Provider timeout/error | Show friendly fallback; do not expose raw provider details. |
| Daily success limit reached | Explain one AI plan per day and offer non-AI/external alternatives. |
| Attempt limit reached | Explain generation is temporarily unavailable and offer alternatives. |
| User cancels | Return to setup or plan creation choices without saving. |
| Save | Save only after review through existing structured save path. |

### UX copy principles

Use concise mobile-first copy. Avoid dense explanations.

Required concepts:

- “AI creates a draft, not a final plan.”
- “You’ll review and edit before saving.”
- “Limited to one AI-generated plan per day while this is a free hobby feature.”
- “Do not include sensitive, confidential, or highly personal medical information.”
- “For pain, injury, symptoms, or medical uncertainty, consider clinician guidance.”

### Review screen expectations

Generated AI drafts should enter the same review/edit surface as current imported drafts.

The review surface should make clear:

- This is an AI-generated draft.
- The user can edit plan, phase, workout, and exercise details.
- The user is responsible for reviewing before saving.
- Save uses the app’s structured plan model.

## Backend and data requirements

### Environment variables

Suggested names:

```text
AI_PLAN_GENERATION_ENABLED=true
AI_PLAN_PROVIDER=gemini
AI_PLAN_MODEL=gemini-3.5-flash
GEMINI_API_KEY=<server-only-key>
AI_PLAN_DAILY_SUCCESS_LIMIT=1
AI_PLAN_DAILY_ATTEMPT_LIMIT=3
AI_PLAN_TIMEOUT_MS=30000
AI_PLAN_MAX_INPUT_CHARS=12000
AI_PLAN_MAX_OUTPUT_TOKENS=6000
```

Codex should confirm the current recommended free-tier text model before hardcoding a model name. Keep the model centralized and configurable.

### Config behavior

- Missing `GEMINI_API_KEY` disables direct AI.
- Missing/false `AI_PLAN_GENERATION_ENABLED` disables direct AI.
- Unsupported provider returns disabled/config error.
- No provider details leak to the client.
- No raw prompts or raw provider responses are logged by default.

### Quota model

Use server-side quota, not client-side storage.

Recommended table:

```text
ai_plan_generation_events
- id uuid primary key
- user_id uuid not null references auth.users(id)
- created_at timestamptz not null default now()
- local_date date not null
- status text not null
  - started
  - succeeded
  - failed
  - invalid_output
  - blocked
- provider text not null
- model text not null
- error_code text null
- prompt_hash text null
- output_hash text null
```

Codex may adjust names/types to match repo conventions, but must preserve:

- authenticated user association
- local-day quota basis
- status tracking
- no raw prompt persistence
- no raw output persistence

Quota policy:

- One successful AI plan generation per authenticated user per local day.
- Maximum three provider attempts per authenticated user per local day.
- Failed/invalid provider attempts count toward attempt limit.
- Failed/invalid provider attempts do not count as successful generation.
- Blocked quota checks should not call the provider.
- The local date should align with the app’s existing browser timezone behavior where practical.

### Provider adapter

Add a provider boundary rather than hardcoding Gemini into UI or route code.

Expected responsibilities:

- Read server-only config.
- Build minimized prompt from structured setup context.
- Call Gemini API.
- Apply timeout.
- Request strict structured output.
- Parse response.
- Normalize to the app draft shape.
- Validate before returning success.
- Return typed errors.

Expected typed errors:

```text
AI_DISABLED
AI_UNAUTHENTICATED
AI_QUOTA_REACHED
AI_ATTEMPT_LIMIT_REACHED
AI_PROVIDER_TIMEOUT
AI_PROVIDER_ERROR
AI_INVALID_OUTPUT
AI_UNSAFE_INPUT
AI_RATE_LIMITED
```

### Prompt/output contract

The prompt should request only a bounded structured plan draft.

Allowed content:

- plan name
- goal track
- progression mode
- phases
- workouts
- exercises
- sets/reps/time/distance where appropriate
- optional coaching notes
- optional safety notes
- optional demo search text or supported YouTube URL only if existing validation supports it

Disallowed content:

- diagnosis
- clinical treatment claims
- unsupported URLs
- unbounded/open-ended plans
- prose outside the accepted transfer format
- provider tool calls
- requests for follow-up questions in the output
- advice to ignore pain, injury, or clinician guidance

### Persistence rules

The generation endpoint/action must not write to:

- `workout_plans`
- `plan_phases`
- `workout_templates`
- `exercise_entries`

until the user reviews and saves through the existing structured plan write path.

It may write generation-event records for quota/audit purposes.

## Slice plan

### Slice 1 — Campaign docs and AI boundary approval

Status: complete.

Goal:
Create the active campaign doc and update source-of-truth docs to approve direct AI plan drafting under strict constraints.

Likely files:

- `docs/campaigns/direct-ai-plan-creation.md`
- `docs/product.md`
- `docs/architecture.md`
- `docs/roadmap.md`
- `docs/current-task.md`

Acceptance criteria:

- Docs approve optional provider-backed AI drafting for this campaign.
- Docs preserve non-AI plan creation.
- Docs preserve review-before-save.
- Docs preserve strict validation.
- Docs preserve deterministic progression.
- Docs identify free-tier/no-bill posture.
- Docs explicitly defer AI phase alternatives to a future campaign.

Validation:

- Docs-only validation per `AGENTS.md`.
- Confirm diff is docs-only.

### Slice 2 — AI-first `/plans/new` UX shell, feature-gated

Goal:
Prepare the user-facing creation hierarchy without making provider calls.

Likely files:

- `/plans/new` route/page/components
- plan creation option components
- existing Draft with AI wizard components
- tests if existing UI tests cover this area

Acceptance criteria:

- AI-Guided Plan is primary when enabled.
- AI disabled state does not break current flows.
- Guided Setup remains available.
- Manual Builder remains available.
- External AI import remains available.
- Privacy/quota/review-before-save copy is present.
- No provider calls are made.
- Mobile layout is clean and not text-heavy.

Manual QA:

- `/plans/new` mobile
- `/plans/new` desktop
- AI enabled shell
- AI disabled shell
- Guided Setup flow
- Manual Builder flow
- external AI import flow

### Slice 3 — Server-only AI config and provider adapter

Goal:
Add server-only provider integration plumbing without exposing generation to users yet.

Likely files:

- `lib/plan-drafting/`
- server-only config helper
- provider adapter tests
- env documentation/example if present in repo conventions

Acceptance criteria:

- API key is server-only.
- Missing key returns disabled/config result.
- Provider/model settings are centralized.
- Adapter maps provider errors to typed app errors.
- Adapter applies timeout.
- No raw prompts/responses are logged.
- Tests cover disabled config, missing key, timeout/error mapping, and invalid output.

Validation:

- `npm run check`

### Slice 4 — Server-side quota and generation events

Goal:
Add durable app-side cost/rate protection before enabling generation.

Likely files:

- Supabase migration
- quota helper
- server tests
- docs updates

Acceptance criteria:

- One successful generation per user per local day by default.
- Attempt limit is enforced.
- Quota checks require authenticated user ID.
- Quota cannot be bypassed client-side.
- Provider is not called when quota is already blocked.
- Raw prompt/output content is not persisted.
- RLS/server access follows existing repo patterns.

Validation:

- `npm run check`
- Migration reviewed for safety.

### Slice 5 — Generation endpoint/action and validation bridge

Goal:
Connect setup inputs to server-side generation and return a validated draft to the review/edit flow.

Likely files:

- API route or server action under `app/`
- `lib/plan-drafting/`
- validation/parser helpers
- tests

Acceptance criteria:

- Endpoint/action authenticates the user.
- Endpoint/action checks feature flag.
- Endpoint/action checks quota before provider call.
- Endpoint/action builds minimized prompt from setup context.
- Endpoint/action calls provider adapter server-side only.
- Output is parsed, normalized, and validated.
- Invalid output does not enter review state.
- Nothing is saved as a plan until user review/save.
- Errors are user-friendly and typed.
- Duplicate submit is prevented or safely handled.

Manual QA:

- valid generation
- invalid-output simulation if feasible
- provider disabled
- quota reached
- unauthenticated access
- duplicate click
- review/edit/save after valid generation
- cancel/back before save

### Slice 6 — Full AI-guided UX polish and fallback behavior

Goal:
Make the direct AI workflow resilient and pleasant.

Likely files:

- `/plans/new` AI setup/generation components
- review/edit labels/copy
- fallback UI
- tests where practical

Acceptance criteria:

- User always has a next action.
- Loading state is clear.
- Quota reached state is clear.
- Provider unavailable state is clear.
- Invalid output state is clear.
- Fallbacks include external AI import, Guided Setup, and Manual Builder.
- Generated draft is labeled as AI-generated and reviewable.
- Mobile UI remains primary.
- Sensitive-data warning is visible before generation.

Manual QA:

- all error states
- all fallback links/actions
- generated draft review
- save path
- mobile and desktop

### Slice 7 — Hardening, docs, and campaign closeout

Goal:
Stabilize and close out the campaign.

Acceptance criteria:

- `npm run check` passes.
- Branch-push verification passes if using a local worktree.
- Manual QA checklist is complete.
- Campaign doc slice statuses are updated.
- `docs/current-task.md` is updated with current state and next action.
- Product/architecture/roadmap docs reflect final implementation.
- Final report includes branch name, commit SHA, pushed branch, validation results, documentation delta, branch-push verification result, and compact state packet.

## Campaign-wide acceptance criteria

The campaign is complete when:

- AI-Guided Plan is the primary creation option when enabled.
- Direct AI generation works behind server-side config.
- The app can run with direct AI disabled.
- Guided Setup still works.
- Manual Builder still works.
- External AI import still works.
- One successful AI plan per user per day is server-enforced by default.
- Provider attempts are bounded.
- API key is not exposed client-side.
- No generated plan saves without review.
- AI output must pass existing structured validation before review.
- Deterministic progression behavior is unchanged.
- Phases remain the durable plan structure.
- Docs are updated and campaign status is clear.

## Validation expectations

For code changes, use the repo standard validation gate from `AGENTS.md`, expected to be:

```powershell
npm run check
```

If working from a Codex local worktree, run the repo branch-push verification script before final report.

For docs-only Slice 1, follow docs-only validation from `AGENTS.md`.

## Manual QA checklist

Required before campaign completion:

- AI disabled/no-key state
- AI enabled state
- successful AI generation
- daily success quota reached
- attempt limit reached
- provider timeout/error
- invalid provider output
- duplicate generate click
- fallback to external AI import
- fallback to Guided Setup
- fallback to Manual Builder
- generated draft review/edit
- generated draft save
- generated draft cancel/back before save
- saved plan details
- workout execution still shows existing guidance/demo data where present
- mobile `/plans/new`
- desktop `/plans/new`

## Stop conditions

Stop and report if:

- Repo docs conflict about current AI boundary or active campaign state.
- Direct AI requires exposing an API key client-side.
- Free/no-bill setup cannot be verified.
- Provider integration requires billing to be attached.
- Provider output cannot reliably pass strict validation.
- Implementation starts creating a parallel save path.
- Implementation weakens progression logic.
- Implementation removes non-AI flows.
- Implementation requires storing raw sensitive prompts/outputs.
- Privacy terms are unacceptable for the intended user data.
- Scope expands into phase alternatives, substitutions, trends, or broad redesign.

## Follow-up backlog

### AI-assisted phase alternatives

At a phase boundary, let the user request alternate next-phase drafts such as:

- more variety
- lower impact
- more strength
- more hypertrophy
- schedule change
- equipment change
- same goal, different split

These alternatives must still be validated, reviewed, edited, and explicitly accepted.

### Phase comparison UX

Compare current next phase vs AI alternative before replacing anything.

### Manual substitutions before AI substitutions

Build deterministic/manual substitution flows before asking AI to suggest replacements.

### History/trends context for future AI

Give future AI better context only after history/trends are structured and privacy-safe.

### Paid/private AI mode

If the app grows beyond hobby/friends/family usage, evaluate a paid provider/project with stronger data-use terms, billing alerts, and spend caps.
