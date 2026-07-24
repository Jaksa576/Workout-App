# Current Task

## Current Priority

Implement the bounded plans return-navigation portion of GitHub Issue #48
Slice 2 for the `/plans` → `/plans/[planId]` flow, without custom scroll
position storage or an app-wide history policy.

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

## Active Slice

- Plan-list detail links carry an explicit `from=plans` origin marker.
- A tab-scoped `sessionStorage` marker now proves an ordinary same-tab
  `/plans` → detail transition before the return control uses browser history;
  copied, bookmarked, new-tab, direct, mismatched, and malformed entries fall
  back safely to `/plans`.
- The marker is consumed before history traversal, preserving native
  Back/Forward behavior without authorizing a second unrelated return.
- Manual authenticated mobile and desktop restoration QA remains required
  before merge. It must verify deep-list return, active-plan return,
  Back/Forward, direct-entry fallback, Dashboard-origin fallback, and archive
  redirect behavior.

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

- Custom list-position or selected-item restoration if the native-history
  return patch proves insufficient after authenticated QA.
- Route-level adoption outside the involved workout flow and external AI plan
  draft wizard.
- Broader route-entry focus conventions, if later issue scope proves them
  necessary.
