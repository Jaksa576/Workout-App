# Current Task

## Current Priority

GitHub Issue #48 Slice 2: assess and, only when a genuine route-level
exercise-library list/detail flow exists, preserve its return browsing position
without replacing native browser history behavior. The foundation slice is
complete in merged PR #86.

## Completed Foundation (PR #86)

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

## Slice 2 Readiness Finding

- The current repository has no exercise-library/catalog list route or exercise
  detail route. `exerciseCatalog` is a static data source used by the in-page
  “Add from library” selector in `PlanBuilderForm`; selecting an item adds it
  directly to the workout and does not navigate to a detail view.
- Therefore this is not a true list/detail navigation flow, and no scoped
  restoration state, history manipulation, or scroll behavior was added. This
  avoids redundant custom restoration where browser Back/Forward behavior cannot
  be meaningfully evaluated.
- The next representative flow must be selected from a future route-backed,
  long-list/detail surface. It should first demonstrate a native-restoration gap
  before adopting a small, route-scoped helper.

## Validation Expectations

Run:

```powershell
.\scripts\validate.ps1
.\scripts\verify-branch-pushed.ps1
```

For any future Issue #48 list/detail slice, first verify that the candidate has
distinct list and detail routes, then test native browser Back/Forward with
query state before adding custom restoration. The existing PR #86 coverage
verifies destination positioning, heading focus, reduced-motion behavior,
explicit target support, avoidance of input focus, and an intended attention
destination for each of the seven AI wizard steps.

## Deferred Work

- Select a genuine route-backed, long-list/detail flow for Issue #48 list/detail
  restoration; the present exercise catalog cannot serve as the representative
  flow because it has no detail navigation.
- List/detail back-position restoration and browser Back/Forward policy after a
  candidate flow demonstrates a native-restoration gap.
- Route-level adoption outside the involved workout flow and external AI plan
  draft wizard.
- Broader route-entry focus conventions, if later issue scope proves them
  necessary.
