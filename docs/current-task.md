# Current Task

## Current Priority

GitHub Issue #64 — **Authenticated AI generation quota and orchestration** — is the active implementation target.

Issue #62 and its canonical provider-neutral generated draft, strict normalization, deterministic catalog resolution, and in-memory review boundary are complete. Issue #63 is complete through merged PR #79 (`3b3d249`): the Gemini adapter remains server-only, uses the approved `x-goog-api-key` header, and returns only normalized canonical drafts or typed provider-neutral errors.

Issue #64 adds the authenticated `/api/ai/plan-drafts` boundary, server-configurable daily quota limits, additive operational attempt state, RLS, service-role-only atomic reservation/completion RPCs, idempotency, and safe provider-neutral outcomes. Generation still returns an in-memory review draft only and does not write plan, workout, exercise, session, or progression records.

## Immediate Next Action

Review and merge the Issue #64 pull request. Then, with explicit product-owner/ChatGPT approval:

1. Confirm the target Supabase project and migration history with `npx supabase migration list --linked`.
2. Preview pending changes with `npx supabase db push --linked --dry-run` and stop if anything beyond the reviewed committed chain is unexpected.
3. Apply `supabase/migrations/20260718235045_issue64_ai_generation_quota.sql` with `npx supabase db push --linked`.
4. Run `psql $env:SUPABASE_DB_URL -v ON_ERROR_STOP=1 -f .\supabase\verification\issue-64-ai-generation-quota-readonly.sql`.
5. Confirm Vercel has `SUPABASE_SERVICE_ROLE_KEY`, Gemini configuration, and the two quota variables; redeploy with `AI_GENERATION_ENABLED=false`.
6. Smoke-test the authenticated endpoint in a controlled environment, then enable Preview only after migration and verification succeed.

Issue #65 remains blocked until Issue #64 is merged and its migration is applied and verified. Production must remain disabled until Issue #65 and full Preview QA are complete.

## Validation Expectations

Run focused mocked orchestration, route, provider, and migration-source tests, then:

```powershell
.\scripts\validate.ps1
.\scripts\verify-branch-pushed.ps1
```

The standard suite must not require live Gemini access. Hosted Supabase changes require separate approval and are not performed by implementation agents.

## Durable Boundaries

- Quota date is server-owned. No authenticated timezone is stored in Supabase today, so the authoritative fallback is UTC; the client timezone cookie is not trusted for quota enforcement.
- One successful generation and three provider attempts per user per quota date are the defaults. Both are server-only environment settings and fail closed when invalid.
- Reserved attempts count against both attempt usage and available success capacity, preventing simultaneous requests from exceeding configured limits.
- Raw prompts, raw responses, API keys, provider error bodies, setup text, and generated plan contents are not persisted.
- The structured plan-save route remains the only plan persistence boundary after explicit user review.
