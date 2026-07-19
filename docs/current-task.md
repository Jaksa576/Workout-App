# Current Task

## Current Priority

GitHub Issue #65 - **Integrate direct AI generation into plan creation** - is the active implementation target.

Issue #81 and merged PR #82 are complete on `main`. The hosted additive quota migration, read-only verification, Gemini 3.5 Flash configuration, and controlled authenticated smoke test are complete, so the Issue #65 readiness gate is satisfied.

Issue #65 connects `POST /api/ai/plan-drafts` to the existing `/plans/new` structured setup and routes successful canonical drafts into the existing `PlanBuilderForm` review/editor. Generation remains in-memory only. Explicit save continues through `/api/plans` and `createStructuredPlanForUser`; no plan, phase, workout, exercise, session, result, or progression record is written during generation, back, cancel, or navigation before save.

## Implemented Scope

- Direct **Create with AI** is recommended only when server-side generation configuration is operational.
- Guided Setup, Manual Builder, and external AI import remain visible and functional, including when direct generation is unavailable.
- Direct generation reuses the existing structured setup inputs and validates them before calling the endpoint.
- Every intentional attempt receives one idempotency key; a visible elapsed-time generation state blocks duplicate click and keyboard activation, warns before unload while active, and never presents partial plan content.
- All typed endpoint errors map to concise provider-neutral copy with useful non-AI and external-import fallbacks.
- Successful drafts enter the existing review/editor labeled as AI-generated drafts, carrying the selected setup goal and its explicit or deterministic default progression mode.
- `matched`, `custom`, and `needs_review` exercise outcomes remain visible; unresolved review issues block save until matched, explicitly accepted as a valid reviewed custom exercise, or removed.
- Explicit save continues through the existing structured persistence path and preserves prescriptions, tracking metadata, and deterministic phase progression.
- PR #83 increases direct-generation defaults to a 150-second provider timeout and 16,384 output tokens; server configuration fails closed above 240 seconds or 32,768 tokens, and the 300-second route duration requires Vercel Fluid Compute.

## Immediate Next Action

1. Review and merge the Issue #65 pull request after checks pass.
2. Complete authenticated mobile and desktop QA with small and large multi-phase drafts, waits beyond 12 and 45 seconds, unload warning, typed timeout, review blocking, and generation-to-save flows. Record duration and approximate response size. The local unauthenticated route/login health check is complete; an authenticated local browser session was unavailable, so the full mocked browser pass remains.
3. Confirm Fluid Compute is enabled for Preview and Production before enabling the 300-second generation route.
4. Keep production rollout feature-gated. Enable direct generation only after the Issue #65 pull request is merged and deployment QA passes; disabling it must leave Guided Setup, Manual Builder, and external AI import usable.

## Validation Status

On 2026-07-19, `.\scripts\validate.ps1` passed TypeScript, all 316 tests across 48 files, and the Next.js production build. Focused automated coverage uses mocked generation and does not call live Gemini.

Local browser QA confirmed the protected `/plans/new` route redirects unauthenticated users to a healthy login page with no console errors or framework error overlay. Authenticated mobile/desktop, keyboard, basic screen-reader, enabled/disabled, typed-error, review-blocking, no-persistence, and mocked generation-to-save browser QA remains required before rollout.

## Validation Expectations

Focused tests cover operational and unavailable entry states, setup validation and payload, idempotency and duplicate-submit protection, accessible loading status, typed error mapping, successful draft routing, `needs_review` save blocking, no-persistence back/cancel behavior, explicit structured save, and non-AI creation regressions.

Run:

```powershell
.\scripts\validate.ps1
.\scripts\verify-branch-pushed.ps1
```

Manual QA must cover mobile and desktop, keyboard and basic screen-reader behavior, direct AI enabled and disabled states, typed failure fallbacks, one successful mocked generation-to-save flow, and confirmation that generation/back/cancel persist nothing.

## Completed Dependency State

- Issue #62 completed the provider-neutral generated-plan contract, canonical normalizer, deterministic catalog resolution, and review-before-save boundary.
- Issue #63 and merged PR #79 completed the disabled-by-default server-only Gemini adapter.
- Issue #64 and merged PR #80 completed the authenticated route, operational quota storage, RLS, service-role RPCs, and idempotent orchestration baseline.
- Issue #81 and merged PR #82 completed conservative success accounting and Gemini 3.5 draft compatibility; the hosted migration, verification, and smoke test are complete.
