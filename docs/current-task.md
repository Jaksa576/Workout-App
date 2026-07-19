# Current Task
## Current Priority

GitHub Issue #81 - **Fix AI quota completion and Gemini 3.5 draft compatibility** - is the active implementation target.

This is a post-merge follow-up to merged PR #80 and closed Issue #64. The authenticated route, UTC quota table, service-role-only RPCs, RLS, idempotency, and tests are complete on `main`. The original Issue #64 migration has been applied to hosted Supabase and is immutable.

The follow-up fixes the unresolved PR #80 Codex finding: a valid provider result could be reclassified as `provider_failure` when persisting `succeeded` failed or returned an uncertain result. Production QA also established that Gemini 2.5 Flash is unavailable to the configured new project, Gemini 3.5 Flash reaches the provider, and the current canonical normalization returns `invalid_generated_plan`.

Issue #81 adds conservative `indeterminate_success` accounting, explicit provider-versus-completion error boundaries, safe invalid-draft codes and normalized paths, a Gemini 3.5 default, closer structured-output alignment, and catalog-first video ownership. Production generation remains disabled. No plan, workout, exercise, session, result, or progression records are written.

## Immediate Next Action

1. Review and merge the Issue #81 follow-up pull request.
2. Keep Production `AI_GENERATION_ENABLED=false`.
3. Apply only `supabase/migrations/20260719011847_issue81_ai_quota_indeterminate_success.sql`.
4. Run the original Issue #64 verification and `supabase/verification/issue-81-ai-quota-indeterminate-success-readonly.sql`.
5. Confirm Vercel Production uses `GEMINI_MODEL=gemini-3.5-flash` and redeploy disabled.
6. Wait for the UTC reset or use an approved test user for one controlled smoke test, then disable generation again.

Hosted application of the follow-up migration remains pending. Issue #65 remains blocked until this patch is merged, migrated, verified, and smoke-tested.

## Issue #81 Validation Expectations

Run focused mocked orchestration, quota, Gemini adapter, generated-plan, route, original Issue #64 SQL, and Issue #81 SQL tests. Do not use live Gemini requests. Validate the additive migration and both read-only verification files in a local or disposable Supabase environment, then run:

```powershell
.\scripts\validate.ps1
.\scripts\verify-branch-pushed.ps1
```

Safe diagnostics contain only model, provider-neutral stage, allowlisted error or issue codes, normalized field paths, and aggregate counts. They never contain prompts, setup answers, provider bodies, generated content, exercise names, coaching text, URLs, keys, emails, or user identifiers.


## Completed Dependency State

- Issue #62 completed the provider-neutral generated-plan contract, canonical normalizer, deterministic catalog resolution, and review-before-save boundary.
- Issue #63 and merged PR #79 completed the disabled-by-default server-only Gemini adapter.
- Issue #64 and merged PR #80 completed the authenticated route, operational quota storage, RLS, service-role RPCs, and idempotent orchestration baseline.
- Issue #65 remains outside this patch and blocked on the Issue #81 merge, hosted additive migration, committed verification, and controlled smoke test.
