# Current Task

## Current Priority

Implement the first bounded foundation slice of GitHub Issue #48: predictable
navigation attention for the highest-value workout and plan-creation workflow
transitions, without app-wide scroll restoration.

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

- List/detail back-position restoration and browser Back/Forward policy.
- Route-level adoption outside the involved workout flow and external AI plan
  draft wizard.
- Broader route-entry focus conventions, if later issue scope proves them
  necessary.
