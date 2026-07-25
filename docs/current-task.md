# Current Task

## Current Priority

Implement GitHub Issue #48 Slice 3A: validation attention in the manual
plan builder, using the shared navigation-attention contract without creating
an app-wide form-validation or scrolling system.

## Implemented Scope

- Added the small typed `lib/navigation-attention.ts` contract for destination
  positioning, optional non-input focus, explicit targets, and
  reduced-motion-aware smooth scrolling.
- Migrated active workout → Finish/check-in and Finish/check-in → saved
  confirmation to position and focus their headings.
- Migrated the external AI plan-draft wizard's step transition from
  unconditional smooth scrolling to the shared contract.
- Patched the Import and Review wizard steps with their own focusable primary
  headings, so all seven steps have exactly one sticky-header-safe navigation
  attention target without focusing the import textarea.
- Preserved Next.js/browser history behavior, existing dialog focus management,
  and selected-workout-card explicit positioning.
- PR #86 is complete. The exercise-library candidate was rejected because it
  is not route-backed and therefore cannot use a list/detail browser-return
  flow.
- PR #88 and Issue #48 Slice 2 are complete. Manual QA confirmed native
  plans-list return behavior.

## Active Slice

- On an invalid manual-builder save, render a concise, focusable validation
  summary near the form top from the existing structured-plan rules.
- After the summary renders, position and focus it through
  `lib/navigation-attention.ts`; do not focus an input or move focus while a
  person is editing fields.
- Keep the existing save path, entered values, generated-exercise inline
  review errors, and valid-save behavior unchanged.

## Validation Expectations

Run:

```powershell
.\scripts\validate.ps1
.\scripts\verify-branch-pushed.ps1
```

Focused coverage must verify destination positioning, heading focus,
reduced-motion behavior, explicit target support, avoidance of input focus, and
an intended attention destination for each of the seven AI wizard steps.

## Deferred Work

- Remaining navigation anchors, settings, and route adoption pending a
  post-slice inventory.
