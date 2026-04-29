# AI Draft Plan UX Campaign

## Purpose

Improve the existing provider-free Draft with AI flow so it is easier to complete on mobile, clearer for non-technical users, and less error-prone when moving plan output between the app and an external LLM.

The app must continue to use the existing user-directed workflow:

1. The user completes setup inputs.
2. The app generates a structured prompt.
3. The user copies the prompt into an external LLM.
4. The user brings generated output back into the app.
5. The app validates and normalizes the output.
6. The user reviews and edits before saving.

## Campaign Status

Slice 9K-9M is a planned implementation campaign before Slice 10.

This document cleanup is docs-only. It does not implement Slice 9K, 9L, or 9M.

## Non-goals

- No provider-backed LLM integration.
- No API-key handling.
- No runtime LLM dependency.
- No schema or RLS changes.
- No auth changes.
- No progression-engine changes.
- No replacement of Guided Setup or Manual Builder.
- No bypassing review-before-save.
- No accepting unvalidated AI output into saved plans.

## Scope

### Docs Alignment Scope

Allowed in docs-only planning passes:

- Update roadmap sequencing so Slice 9K-9M is planned before Slice 10.
- Update current-task and handoff docs so future agents understand the next campaign.
- Keep this campaign doc current as the source of truth for Slice 9K-9M.
- Clarify scope boundaries, acceptance criteria, validation, and stop conditions.

Not allowed in docs-only planning passes:

- Application code changes.
- Package changes.
- Supabase changes.
- Schema changes.
- Auth changes.
- RLS changes.
- Progression logic changes.
- Provider-backed LLM integration.
- Implementation of Slice 9K, 9L, or 9M.

### Future Implementation Scope

Allowed in future Slice 9K-9M implementation PRs:

- Improve Draft with AI setup UX.
- Improve external LLM handoff copy, links, and copy-prompt actions.
- Improve import instructions, transfer format guidance, and validation error guidance.
- Update tests or focused QA coverage for changed behavior.

Not allowed in future Slice 9K-9M implementation PRs:

- Provider-backed LLM calls.
- API-key collection or storage.
- Runtime LLM dependency.
- Schema or RLS changes.
- Auth model changes.
- Progression-engine changes.
- Exercise media or instruction-layer work from Slice 10.
- Broad dashboard, typography, theme, or app-wide polish unless explicitly rescoped.

## Slice 9K: AI Draft Setup Wizard

### Goal

Make Draft with AI feel closer to Guided Setup.

### Expected Outcome

Draft with AI setup becomes a mobile-first step flow with clearer choices, less long-form friction, and better setup progression.

### Implementation Direction

- Convert Draft with AI setup from a long-form page into a guided, mobile-first step flow.
- Align the interaction model more closely with Guided Setup.
- Ask for one or a small number of choices per step.
- Reduce redundant setup choices where Guided Setup, Manual Builder, and Draft with AI overlap.
- Preserve existing validation, draft, review/edit, and save behavior.
- Do not add provider-backed LLM integration.

### Acceptance Criteria

- Draft with AI setup is presented as a step-by-step flow on mobile and desktop.
- Each step asks for one or a small number of related choices.
- The step model feels consistent with Guided Setup without replacing Guided Setup.
- Manual Builder remains available as an existing plan creation path.
- Existing setup data still produces a prompt-ready Draft with AI context.
- Existing setup -> draft -> review/edit -> save behavior is preserved.
- No provider-backed LLM integration is introduced.

### Validation Expectations

- Verify Guided Setup still works.
- Verify Manual Builder still works.
- Verify Draft with AI setup can be completed on mobile and desktop widths.
- Verify Draft with AI still generates a prompt after setup.
- Verify setup validation still blocks incomplete or invalid setup where appropriate.
- Verify no schema, RLS, auth, progression, or provider-backed LLM changes were introduced.

## Slice 9L: External LLM Handoff UX

### Goal

Make it obvious how to use the generated prompt with an external LLM.

### Expected Outcome

The user understands:

1. Copy the prompt.
2. Open ChatGPT, Claude, or Gemini.
3. Paste the prompt.
4. Copy or download the generated plan.
5. Return to the app and import it.

### Recommended Provider Framing

- Recommended: ChatGPT.
- Also works with Claude or Gemini.

### Implementation Direction

- Replace confusing "external assistance" language with clear copy/paste instructions.
- Recommend ChatGPT as the default external LLM option.
- Also provide Claude and Gemini as alternatives.
- Provide simple external links and a primary copy-prompt action.
- Explain that the user copies the prompt, opens an LLM, pastes the prompt, then returns with the generated plan.
- Keep this as a user-directed workflow, not an in-app provider integration.

### Acceptance Criteria

- The copy clearly says to copy the prompt into an LLM.
- ChatGPT is presented as the recommended option.
- Claude and Gemini are presented as alternatives.
- External links or options are available without implying an app integration.
- The copy-prompt action is visually and interaction-wise primary.
- The page explains that the user returns to the app with the generated plan.
- No provider credential, API-key, or in-app model configuration is introduced.

### Validation Expectations

- Verify prompt copy works on mobile and desktop.
- Verify ChatGPT, Claude, and Gemini handoff options are clear.
- Verify external links do not change app auth or plan state.
- Verify the app still works if the user does not open any external link.
- Verify the generated prompt remains deterministic from local setup data.
- Verify no provider-backed LLM dependency is introduced.

## Slice 9M: AI Draft Import Ergonomics

### Goal

Make generated output easier to bring back into the app.

### Expected Outcome

The external LLM prompt produces a cleaner transfer format, and the import step better explains what the app expects.

### Transfer Format Direction

Preferred:

- Ask the external LLM to return the plan in a clearly fenced markdown transfer block.

Optional:

- Include guidance that some external LLMs may offer a downloadable markdown file, and that users can use it if the app supports upload in the implemented slice.

The fenced markdown transfer block is the primary transfer approach. Downloadable markdown guidance is secondary and should not replace paste/import support.

### Implementation Direction

- Improve the import step so users can easily paste or upload the generated plan.
- Update generated prompt instructions so external LLMs return a cleaner transfer format.
- Prefer a fenced markdown transfer block.
- Treat downloadable markdown file guidance as optional.
- Improve paste/import instructions and validation error guidance.
- Preserve strict validation and review-before-save behavior.
- Do not weaken parser validation just to accept messy output.

### Acceptance Criteria

- The generated prompt asks for a fenced markdown transfer block.
- The import step tells users exactly what to paste or upload.
- Downloadable markdown guidance is secondary and optional.
- Valid generated output can be imported, normalized, reviewed, edited, and saved.
- Invalid generated output fails before review/save with clear guidance.
- Parser validation remains strict and is not weakened to accept arbitrary messy output.
- Review-before-save remains required.
- No provider-backed LLM integration is introduced.

### Validation Expectations

- Verify external output in the preferred fenced markdown format imports successfully.
- Verify invalid or incomplete output fails with clear guidance.
- Verify imported output enters the existing review/edit stage before save.
- Verify saved plans still use the existing compatible save path.
- Verify Guided Setup and Manual Builder still work.
- Verify no schema, RLS, auth, progression, or provider-backed LLM changes were introduced.

## Campaign QA Expectations

Each implementation slice should verify:

- Guided Setup still works.
- Manual Builder still works.
- Draft with AI still generates a prompt.
- Prompt copy works on mobile and desktop.
- External output can be imported, validated, reviewed, edited, and saved.
- Invalid output fails with clear guidance.
- No provider-backed LLM dependency is introduced.
- No schema, RLS, auth, or progression behavior changes occur.

## Stop Conditions

Stop and ask for clarification before continuing if a proposed change requires:

- Provider-backed LLM integration.
- API-key handling.
- Runtime LLM dependency.
- Schema, migration, or Supabase RLS changes.
- Auth model changes.
- Progression-engine changes.
- Saving AI output without validation.
- Saving AI output without review/edit.
- Replacing Guided Setup or Manual Builder.
- Broad dashboard, desktop, typography, theme, or app-wide polish.
- Slice 10 exercise media or instruction-layer work.
- A parser change that weakens validation just to accept messy output.

## One-Slice Execution Guidance

Implement one slice at a time:

1. Start with Slice 9K, AI Draft Setup Wizard.
2. Then implement Slice 9L, External LLM Handoff UX.
3. Then implement Slice 9M, AI Draft Import Ergonomics.

Each slice should be independently reviewable, preserve existing plan creation behavior, and keep the app functional without any LLM provider.
