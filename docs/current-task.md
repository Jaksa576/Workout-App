# Current Task

## Current Priority

Issue #98, Slice 1 expands the reviewed exercise catalog with the critical
36-exercise readiness batch. The product owner approved removing the already
canonical `hip-adduction-machine` row from the temporary 37-row authoring input;
the existing catalog entry, tracking metadata, system identity, and reviewed
aliases remain unchanged.

## Completed Slice

- Corrected
  `docs/exercise-catalog-inputs/issue-98/exercise-catalog-batch-5-critical-37.manifest.json`
  to 36 rows by removing only `hip-adduction-machine` and updating its derived
  summary counts.
- Added all 36 compatible exercises and their exact tracking metadata to the
  static TypeScript catalog without adding aliases or video URLs.
- Added an additive, idempotent migration that writes only the 36 system-owned
  identities and refuses canonical-ID ownership, active normalized canonical
  name, or reviewed-alias conflicts across owner scopes.
- Added exact manifest-to-runtime and catalog-to-SQL parity tests, protected
  history-table safety checks, and read-only hosted verification for all 36
  identities.
- Preserved the existing Issue #69 and Issue #92 catalog identity behavior and
  historical migrations.

## Validation Expectations

Run the supported repository gate:

```bash
npm run check
```

On the Windows-native development environment, also run:

```powershell
.\scripts\validate.ps1
.\scripts\verify-branch-pushed.ps1
```

## Next Action

Review the Issue #98 Slice 1 draft PR. After merge, apply
`20260728120000_issue98_critical_36_identities.sql` through the normal hosted
Supabase migration workflow, then run
`issue-98-critical-36-readonly.sql`. Every verification query must report zero
affected rows before the remaining Issue #98 catalog batches are authorized.
