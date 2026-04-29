# AI Draft Plan UX Campaign

## Purpose

Improve the existing provider-free Draft with AI flow so it is easier to complete on mobile, clearer for non-technical users, and less error-prone when moving plan output between the app and an external LLM.

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

## Slice 9K: AI Draft Setup Wizard

Goal:
Make Draft with AI feel closer to Guided Setup.

Expected outcome:
A mobile-first step flow with clearer choices, less long-form friction, and better setup progression.

## Slice 9L: External LLM Handoff UX

Goal:
Make it obvious how to use the generated prompt with an external LLM.

Expected outcome:
The user understands:

1. Copy the prompt.
2. Open ChatGPT, Claude, or Gemini.
3. Paste the prompt.
4. Copy or download the generated plan.
5. Return to the app and import it.

Recommended provider framing:

- Recommended: ChatGPT.
- Also works with Claude or Gemini.

## Slice 9M: AI Draft Import Ergonomics

Goal:
Make generated output easier to bring back into the app.

Expected outcome:
The external LLM prompt produces a cleaner transfer format, and the import step better explains what the app expects.

Options to consider:

- fenced markdown block
- downloadable markdown file guidance
- clearer paste instructions
- clearer validation error messages

## QA Expectations For Future Implementation

Each future implementation slice should verify:

- Guided Setup still works.
- Manual Builder still works.
- Draft with AI still generates a prompt.
- Prompt copy works on mobile and desktop.
- External output can be imported, validated, reviewed, edited, and saved.
- Invalid output fails with clear guidance.
- No provider-backed LLM dependency is introduced.
- No schema, RLS, auth, or progression behavior changes occur.

## Scope Boundaries

Allowed:

- docs-only roadmap updates
- current-task update
- agent-handoff update
- campaign doc

Not allowed:

- application code changes
- package changes
- Supabase changes
- schema changes
- auth changes
- progression logic changes
- provider-backed LLM integration
