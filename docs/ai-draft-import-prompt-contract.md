# AI-Assisted Plan Draft Import: V1 Prompt Contract

## Purpose

This document defines the v1 contract for AI-assisted plan drafting.

The app will not call an LLM directly in this slice. Instead, the user will use their own external AI assistant to generate a structured workout-plan draft, then paste that draft back into the app for validation, review, editing, and save.

This contract exists to keep the flow deterministic enough for parsing while preserving the app as the system of record.

## Product Positioning

AI is an optional drafting helper.

The app remains responsible for:
- collecting structured setup inputs
- generating the prompt
- validating imported output
- converting valid output into the internal draft shape
- review/edit before save
- saving through the existing plan write path

The app should remain fully functional without any LLM provider.

## Scope

This contract is for:
- prompt generation inside `/plans/new`
- paste-back import of structured AI output
- validation and normalization into the existing draft/review/edit/save flow

This contract is not for:
- provider-backed LLM generation
- server-side AI calls
- onboarding redesign
- progression-engine redesign
- workout execution redesign

## V1 Strategy

Use:
- one shared output schema
- one parser
- one validation layer
- light goal-specific instruction variants

Do not use:
- arbitrary prose import
- multiple output formats in v1
- silent auto-repair of malformed output

## Input Contract

These are the app-side inputs used to generate the prompt.

### Required fields

- `goal_track`
- `days_per_week`
- `session_duration_min`
- `equipment_access`
- `experience_level`
- `limitations`
- `primary_focus`

### Optional fields

- `progression_mode`
- `training_environment`
- `preferences`
- `dislikes`
- `sports_interests`
- `freeform_context`

## Allowed Enums

### `goal_track`

Allowed values:
- `recovery`
- `general_fitness`
- `strength`
- `hypertrophy`
- `running`
- `sport_performance`
- `consistency`

### `progression_mode`

Allowed values:
- `symptom_based`
- `adherence_based`
- `performance_based`
- `hybrid`

## Output Contract

The external AI assistant must return **strict structured markdown**.

Do not return:
- JSON
- bullet lists
- tables
- commentary before the plan
- commentary after the plan
- multiple options
- extra metadata fields

## Canonical Output Format

The AI must return output in exactly this structure:

```text
PLAN
title: <string>
goal_track: <enum>
progression_mode: <enum or blank>
days_per_week: <integer>
session_duration_min: <integer>
summary: <short string>

PHASE 1
name: <string>
duration_weeks: <integer>
objective: <short string>

WORKOUT
name: <string>
focus: <short string>

EXERCISE
name: <string>
sets: <integer>
reps: <string>
rest_seconds: <integer or blank>
notes: <short string or blank>

EXERCISE
...

WORKOUT
...

PHASE 2
name: <string>
duration_weeks: <integer>
objective: <short string>

WORKOUT
...

EXERCISE
...
```

## Structural Rules

The AI must follow these rules:
- return only the required markdown structure
- use the exact section labels and field labels
- include at least 1 phase
- include at least 1 workout per phase
- include at least 1 exercise per workout
- keep values concise and parseable
- keep notes short
- do not add extra fields
- do not include medical diagnosis or treatment advice

## Prompt Template Structure

The generated prompt should contain three parts:
1. stable instruction block
2. user context block
3. exact output example

## Stable Instruction Block

Use this as the base instruction block when generating the prompt:

```text
You are drafting a structured workout plan for import into a workout application.

Important rules:
- Return ONLY the required markdown format.
- Do not include commentary before or after the plan.
- Do not use bullet points, tables, or JSON.
- Use the exact section labels and field labels shown below.
- Keep all values concise and parseable.
- Use only the allowed enum values for goal_track and progression_mode.
- Include at least 1 phase.
- Include at least 1 workout per phase.
- Include at least 1 exercise per workout.
- Keep notes short.
- Do not include medical advice or diagnosis.
- Do not add extra fields.
```

## App-Supplied User Context Block

The app should inject user inputs into the prompt in a rigid block like this:

```text
User context:
goal_track: strength
days_per_week: 4
session_duration_min: 60
equipment_access: full gym
experience_level: intermediate
limitations: mild shoulder irritation with overhead pressing
primary_focus: build strength while avoiding overhead aggravation
progression_mode: performance_based
training_environment: commercial gym
preferences: barbell and dumbbell lifts
dislikes: burpees
sports_interests:
freeform_context: prioritize sustainable weekly progress
```

## Exact Output Example Block

The generated prompt should end with an exact output example:

```text
Return the plan in exactly this format:

PLAN
title: Example Plan
goal_track: strength
progression_mode: performance_based
days_per_week: 4
session_duration_min: 60
summary: Brief one-line summary

PHASE 1
name: Foundation
duration_weeks: 4
objective: Build base tolerance and movement quality

WORKOUT
name: Lower A
focus: Squat and hinge emphasis

EXERCISE
name: Goblet Squat
sets: 3
reps: 8
rest_seconds: 90
notes: Controlled tempo

EXERCISE
name: Romanian Deadlift
sets: 3
reps: 8
rest_seconds: 90
notes: Stop with 2 reps in reserve
```

## Goal-Specific Guidance Variants

The output schema must stay the same for all goal tracks.

Only the planning guidance block should vary.

### Recovery

Add:

```text
Planning guidance for this goal:
- Use conservative progression.
- Favor symptom-aware exercise selection.
- Prefer simple, repeatable sessions.
- Keep exercise notes practical and caution-oriented.
- Avoid implying diagnosis or treatment.
```

### General Fitness

Add:

```text
Planning guidance for this goal:
- Prioritize balanced, sustainable training.
- Keep the structure simple and repeatable.
- Avoid unnecessary complexity or excessive exercise variety.
```

### Strength

Add:

```text
Planning guidance for this goal:
- Organize training around a few clear movement priorities.
- Use progressive loading logic appropriate for performance-based progress.
- Keep accessory work supportive, not dominant.
```

### Hypertrophy

Add:

```text
Planning guidance for this goal:
- Emphasize repeatable volume and muscle-group coverage.
- Keep exercise variety moderate, not excessive.
- Use concise notes oriented toward effort and control.
```

### Running

Add:

```text
Planning guidance for this goal:
- Keep running sessions simple and structured.
- Use exercise-like workout items only if needed for compatibility with the app.
- Avoid highly specialized running terminology unless clearly useful.
```

### Sport Performance

Add:

```text
Planning guidance for this goal:
- Keep the structure practical and broadly applicable.
- Emphasize supportive strength, power, or conditioning work without over-specializing.
- Keep the plan usable for a general adaptive training app.
```

### Consistency

Add:

```text
Planning guidance for this goal:
- Prioritize low-friction adherence.
- Keep sessions approachable and easy to repeat consistently.
- Favor simpler structure over aggressive progression.
```

## Validation Contract

The app must validate imported output before it becomes a draft.

### Plan-level validation

- `title` required
- `goal_track` required and must match an allowed enum
- `days_per_week` required and must be an integer greater than 0
- `session_duration_min` required and must be an integer greater than 0
- `progression_mode` optional, but if present must match an allowed enum

### Phase-level validation

- at least 1 phase required
- `name` required
- `duration_weeks` required and must be an integer greater than 0

### Workout-level validation

- at least 1 workout per phase required
- `name` required

### Exercise-level validation

- at least 1 exercise per workout required
- `name` required
- `sets` required and must be an integer greater than 0
- `reps` required as a string
- `rest_seconds` optional, but must be an integer if present

## Import Failure Behavior

For v1, the app should be strict.

If the pasted content does not satisfy the contract:
- show parse and validation errors
- point to the offending section when possible
- let the user edit the pasted text or regenerate externally
- do not silently repair output
- do not save malformed output

## V1 Boundaries

Keep v1 intentionally narrow.

Recommended limits:
- 1 to 4 phases
- 1 to 7 workouts per phase
- 1 to 10 exercises per workout

Avoid these fields in v1:
- tempo
- RPE
- RIR
- supersets
- exercise pairings
- unilateral-side metadata
- substitution options
- warmup/cooldown blocks unless explicitly added later

## Manual Test Matrix

Before finalizing UX or parser behavior, test the prompt contract with at least:
- recovery with symptom-sensitive constraints
- beginner general fitness with minimal equipment
- intermediate strength with full gym access
- hypertrophy with higher weekly frequency
- running-focused plan
- consistency-focused low-friction plan
- noisy freeform context input
- progression mode omitted

Test for:
- format adherence
- enum compliance
- missing fields
- excessive verbosity
- broken nesting between phases, workouts, and exercises

## Definition of Done For The Contract

The prompt contract is stable enough for implementation when:
- outputs follow the required shape reliably enough for manual testing
- the parser can remain strict
- common failure modes are understandable
- imported drafts map cleanly into the existing review/edit flow
