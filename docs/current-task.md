# Current Task

## Current Priority

Issue #92 / PR #96 expands the reviewed exercise catalog. The first batch now
has complete application-catalog and database-identity parity for seven
upper-body exercises.

## Completed Batch

- Preserved the seven reviewed catalog entries added by PR #96:
  `incline-barbell-bench-press`, `chin-up`, `t-bar-row`,
  `close-grip-barbell-bench-press`, `barbell-shrug`, `ez-bar-curl`, and
  `chest-dip`.
- Added an additive, idempotent migration that seeds only their system-owned
  canonical identities and refuses ownership, canonical-name, or reviewed-alias
  conflicts.
- Added exact library-to-database metadata parity and migration-content tests.
- Added read-only hosted verification for identity parity, ownership, and
  namespace collisions.
- Confirmed the batch requires no new reviewed aliases and does not change the
  matcher, schema, historical migrations, user-owned identities, plan/workout
  history, or deterministic progression behavior.

## Validation Expectations

Run:

```powershell
.\scripts\validate.ps1
.\scripts\verify-branch-pushed.ps1
```

The committed migration still must be applied through the normal hosted
Supabase migration workflow, followed by the Issue #92 read-only verification
artifact.

## Next Action

Review and merge PR #96 after repository validation and branch-push
verification pass. Apply the migration to hosted Supabase in deployment order
and confirm every verification query reports zero affected rows.
