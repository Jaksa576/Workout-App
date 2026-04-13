# Roadmap

This is the practical feature order for the next few passes.

## 1. Finish First-User Onboarding And Structured Plan Creation

- Test onboarding, guided starter plan generation, structured plan builder, and phase progression.
- Keep the v1 starter exercise catalog static and maintainable.
- Keep AI disabled by default until a provider is intentionally configured.

## 2. Read-Only Plan Sharing

- Add share links for plan details only.
- Shared pages should show plan, phase, workout, exercise, and video-link information.
- Do not expose profile data, workout sessions, check-in notes, pain history, or progress data.
- Prefer a public-safe sharing model rather than weakening private user RLS policies.

## 3. AI-Assisted Workout Plan Drafts

- Generate editable draft plans from goal, schedule, equipment, injuries, and session length.
- Require user review before saving.
- Keep API keys server-side and validate all AI output before saving.
- Do not auto-save AI plans in v1.

## 4. Exercise Substitutions

- Start with manual substitution options for pain or equipment changes.
- Let users choose a substitution during a workout.
- Keep the original plan intact and log what changed.
- Leave automatic or AI substitutions out until the manual flow is solid.

## Supporting Work

- YouTube demo links v1 is working and should stay limited to normal YouTube links for now.
- Add editing flows for existing plans, phases, workouts, and exercises.
- Add active-plan switching when more than one plan exists.
- Add account/profile editing in Settings.
- Add richer session history and progress trend views.
