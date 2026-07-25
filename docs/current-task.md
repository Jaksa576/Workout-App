# Current Task

## Current Priority

Issue #48 Slice 3B implements consistent validation attention for every
creation and edit mode of the structured `PlanBuilderForm`, using the proven
PR #89 pattern. PR #89 and Slice 3A are complete.

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

## Slice 3B Form Inventory

### Adopted

- `/plans/new` and `/plans/[planId]/edit` / `edit-setup` through
  `PlanBuilderForm`: very long, client-validated structured plan creation and
  editing whose hierarchy errors can be far above the save action. Creation
  already had the PR #89 summary for manual plans; Slice 3B removes creation
  source as an eligibility gate so manual, guided, generated, imported, and
  regenerated structured plans use one summary and attention lifecycle. POST
  `/api/plans` and PATCH `/api/plans/[planId]` remain unchanged.

### Already Acceptable

- `/plans/new` guided/direct-AI setup through `PlanSetupWizard`: a stepped
  flow with validation feedback at the current generation action; its final
  substantial review editor is `PlanBuilderForm` and therefore adopted above.
- `/onboarding` through `OnboardingFlow`: a stepped flow that keeps the active
  step and its controls together; final server/API failures render at the
  current action rather than masquerading as client field summaries.
- `/workout/active` through `WorkoutFlow`: workout entry is intentionally one
  long execution surface, but final check-in values have valid defaults and
  browser date constraints; save failures remain API status feedback at the
  submit action. Existing step-transition heading attention is retained.

### Not Needed

- `LoginForm`: short authentication form with browser-native input validation.
- `CheckInForm`: compact legacy check-in with valid defaults and a native date
  constraint; it has no distributed client-validation error model.
- Exercise video editing, plan archive/management, list actions, and workout
  settings: short dialogs or local controls whose errors remain visible. Their
  focus traps and restoration remain unchanged.

### Follow-up

- `ProfileSettingsForm` is visually long, but validation is currently
  server-owned by `/api/profile` with no client field-error model. Adding a
  current-error converter would change validation architecture rather than
  merely attention behavior, so it is deliberately unchanged in this slice.

No other clear adoption candidate was found. Issue #48 can close after Slice
3B once mobile and assistive-technology QA confirms the structured plan create
and edit paths; any future client-validation design for profile settings should
be separately scoped.

## Validation Expectations

Run:

```powershell
.\scripts\validate.ps1
.\scripts\verify-branch-pushed.ps1
```

Focused coverage verifies creation-source-independent structured-plan
validation, partial correction, summary clearing before POST/PATCH, preserved
request paths, no input focus, and separation of API failures from stale client
summaries. Run mobile manual QA for manual and generated/imported plan editing,
including partial correction, failed PATCH, keyboard navigation, announcement,
and reduced motion.

## Deferred Work

- Profile-settings client validation and attention, only under a separately
  scoped issue if field-specific client validation is introduced.
