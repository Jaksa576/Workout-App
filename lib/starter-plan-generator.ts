import {
  exerciseCatalog,
  toPlanExercise,
  type CautionTag,
  type ExerciseCatalogItem
} from "@/lib/exercise-library";
import type {
  AdvancementPreset,
  DeloadPreset,
  PlanDraftInput,
  PlanPreferredSplit,
  ProgressionSettings,
  StructuredExerciseInput,
  StructuredPhaseInput,
  StructuredPlanInput,
  StructuredWorkoutInput,
  TrainingGoalType,
  Weekday
} from "@/lib/types";

const defaultDays: Weekday[] = ["mon", "wed", "fri", "tue", "thu", "sat", "sun"];

const goalLabels: Record<TrainingGoalType, string> = {
  recovery: "Recovery",
  general_fitness: "General Fitness",
  strength: "Strength",
  hypertrophy: "Hypertrophy",
  running: "Running",
  sport_performance: "Sport Performance",
  consistency: "Consistency"
};

const splitLabels: Record<PlanPreferredSplit, string> = {
  full_body: "full-body",
  upper_lower: "upper/lower",
  push_pull_legs: "push/pull/legs",
  run_strength: "run plus strength",
  mobility_strength: "mobility plus strength",
  flexible: "flexible"
};

type DraftShape =
  | "simple_foundation"
  | "balanced_3_day"
  | "strength_full_body"
  | "upper_lower"
  | "run_strength";

type ExerciseSlot = {
  ids: string[];
  overrides?: Partial<StructuredExerciseInput>;
};

type WorkoutSpec = {
  name: string;
  focus: string;
  summary: string;
  slots: ExerciseSlot[];
};

type PhaseSpec = {
  goal: string;
  workouts: WorkoutSpec[];
};

const exerciseById = new Map(exerciseCatalog.map((exercise) => [exercise.id, exercise]));

function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

function includesAny(value: string, terms: string[]) {
  const normalizedValue = normalizeText(value);
  return terms.some((term) => normalizedValue.includes(term));
}

function makeSchedule(input: PlanDraftInput): Weekday[] {
  const setupDays = input.setup.weeklySchedule.length
    ? input.setup.weeklySchedule
    : defaultDays.slice(0, input.setup.daysPerWeek);
  const normalizedDays = setupDays.length ? setupDays : defaultDays.slice(0, 1);

  return Array.from(new Set(normalizedDays)).slice(0, Math.max(1, input.setup.daysPerWeek));
}

function dayAt(schedule: Weekday[], index: number) {
  return [schedule[index % schedule.length]];
}

function getAvailableEquipment(input: PlanDraftInput) {
  return new Set(["Bodyweight", ...(input.profile?.equipment ?? [])]);
}

function getDislikeTerms(input: PlanDraftInput) {
  return (input.profile?.exerciseDislikes ?? [])
    .map(normalizeText)
    .filter((term) => term.length > 0);
}

function getPreferenceTerms(input: PlanDraftInput) {
  return [
    ...(input.profile?.exercisePreferences ?? []),
    ...(input.profile?.sportsInterests ?? []),
    ...input.setup.focusAreas
  ]
    .map(normalizeText)
    .filter((term) => term.length > 0);
}

function getConstraintText(input: PlanDraftInput) {
  return [
    ...(input.profile?.injuries ?? []),
    input.profile?.limitationsDetail ?? "",
    ...input.setup.currentConstraints
  ]
    .map(normalizeText)
    .filter((term) => term.length > 0 && term !== "none right now")
    .join(" ");
}

function getCautionTags(input: PlanDraftInput) {
  const text = getConstraintText(input);
  const cautionTags = new Set<CautionTag>();

  if (includesAny(text, ["knee", "patella", "meniscus"])) {
    cautionTags.add("knee");
  }

  if (includesAny(text, ["back", "spine", "sciatica"])) {
    cautionTags.add("back");
    cautionTags.add("loaded_spine");
  }

  if (includesAny(text, ["shoulder", "rotator", "neck"])) {
    cautionTags.add("shoulder");
  }

  if (includesAny(text, ["ankle", "achilles", "foot", "plantar"])) {
    cautionTags.add("ankle");
  }

  if (includesAny(text, ["hamstring"])) {
    cautionTags.add("hamstring");
  }

  if (includesAny(text, ["impact", "jump", "plyo", "running bothers", "no running"])) {
    cautionTags.add("impact");
  }

  if (includesAny(text, ["overhead", "no pressing overhead"])) {
    cautionTags.add("overhead");
  }

  return cautionTags;
}

function hasUsableEquipment(item: ExerciseCatalogItem, availableEquipment: Set<string>) {
  return item.equipmentTags.some((tag) => tag === "Bodyweight" || availableEquipment.has(tag));
}

function matchesDislike(item: ExerciseCatalogItem, dislikeTerms: string[]) {
  if (!dislikeTerms.length) {
    return false;
  }

  const searchable = [
    item.name,
    item.category,
    item.movementPattern,
    ...item.equipmentTags,
    ...item.goalTags,
    ...item.traitTags,
    ...item.preferenceTags
  ]
    .join(" ")
    .toLowerCase();

  return dislikeTerms.some((term) => searchable.includes(term));
}

function hasCaution(item: ExerciseCatalogItem, cautionTags: Set<CautionTag>) {
  return item.cautionTags.some((tag) => cautionTags.has(tag));
}

function preferenceScore(item: ExerciseCatalogItem, preferenceTerms: string[]) {
  if (!preferenceTerms.length) {
    return 0;
  }

  const searchable = [
    item.name,
    item.category,
    item.movementPattern,
    ...item.equipmentTags,
    ...item.goalTags,
    ...item.traitTags,
    ...item.preferenceTags
  ]
    .join(" ")
    .toLowerCase();

  return preferenceTerms.filter((term) => searchable.includes(term)).length;
}

function rankCandidates(items: ExerciseCatalogItem[], input: PlanDraftInput) {
  const preferenceTerms = getPreferenceTerms(input);

  return items
    .map((item, index) => ({ item, index, score: preferenceScore(item, preferenceTerms) }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map(({ item }) => item);
}

function pickCatalogItem(
  input: PlanDraftInput,
  ids: string[],
  selectedIds: Set<string>
): ExerciseCatalogItem {
  const availableEquipment = getAvailableEquipment(input);
  const dislikeTerms = getDislikeTerms(input);
  const cautionTags = getCautionTags(input);
  const candidates = ids
    .map((id) => exerciseById.get(id))
    .filter((item): item is ExerciseCatalogItem => Boolean(item));
  const rankedCandidates = rankCandidates(candidates, input);

  const selected =
    rankedCandidates.find(
      (item) =>
        hasUsableEquipment(item, availableEquipment) &&
        !matchesDislike(item, dislikeTerms) &&
        !hasCaution(item, cautionTags) &&
        !selectedIds.has(item.id)
    ) ??
    rankedCandidates.find(
      (item) =>
        hasUsableEquipment(item, availableEquipment) &&
        !matchesDislike(item, dislikeTerms) &&
        !selectedIds.has(item.id)
    ) ??
    rankedCandidates.find(
      (item) => hasUsableEquipment(item, availableEquipment) && !matchesDislike(item, dislikeTerms)
    ) ??
    rankedCandidates.find(
      (item) => hasUsableEquipment(item, availableEquipment) && !hasCaution(item, cautionTags)
    ) ??
    rankedCandidates.find((item) => hasUsableEquipment(item, availableEquipment)) ??
    rankedCandidates.find(
      (item) => !matchesDislike(item, dislikeTerms) && !selectedIds.has(item.id)
    ) ??
    rankedCandidates.find((item) => !matchesDislike(item, dislikeTerms)) ??
    rankedCandidates[0] ??
    exerciseCatalog[0];

  selectedIds.add(selected.id);
  return selected;
}

function makeExercises(input: PlanDraftInput, slots: ExerciseSlot[]) {
  const selectedIds = new Set<string>();

  return slots.map((slot) => ({
    ...toPlanExercise(pickCatalogItem(input, slot.ids, selectedIds)),
    ...slot.overrides
  }));
}

function makeWorkout(
  input: PlanDraftInput,
  schedule: Weekday[],
  index: number,
  spec: WorkoutSpec
): StructuredWorkoutInput {
  return {
    name: spec.name,
    focus: spec.focus,
    summary: spec.summary,
    scheduledDays: dayAt(schedule, index),
    exercises: makeExercises(input, spec.slots)
  };
}

function getPhasePresets(input: PlanDraftInput, phaseNumber: number) {
  const goalType = input.setup.goalType;
  const targetSessions = Math.max(2, Math.min(input.setup.daysPerWeek, 4));

  if (goalType === "recovery") {
    return {
      advancementPreset: "clean_sessions_in_window" as AdvancementPreset,
      advancementSettings: { sessions: targetSessions, weeks: 2 },
      deloadPreset: "pain_flags_in_window" as DeloadPreset,
      deloadSettings: { painFlags: 2, days: 7 }
    };
  }

  if (goalType === "strength" || goalType === "hypertrophy") {
    return {
      advancementPreset: "clean_sessions_streak" as AdvancementPreset,
      advancementSettings: { sessions: targetSessions },
      deloadPreset: "too_hard_streak" as DeloadPreset,
      deloadSettings: { sessions: 2 }
    };
  }

  return {
    advancementPreset:
      phaseNumber === 1
        ? ("clean_sessions_in_window" as AdvancementPreset)
        : ("clean_sessions_streak" as AdvancementPreset),
    advancementSettings:
      phaseNumber === 1
        ? ({ sessions: targetSessions, weeks: 2 } satisfies ProgressionSettings)
        : ({ sessions: targetSessions } satisfies ProgressionSettings),
    deloadPreset:
      goalType === "running" || goalType === "sport_performance"
        ? ("pain_flags_in_window" as DeloadPreset)
        : ("too_hard_streak" as DeloadPreset),
    deloadSettings:
      goalType === "running" || goalType === "sport_performance"
        ? ({ painFlags: 2, days: 7 } satisfies ProgressionSettings)
        : ({ sessions: 2 } satisfies ProgressionSettings)
  };
}

function trimWorkouts(workouts: WorkoutSpec[], requestedDays: number, maxWorkouts: number) {
  const count = Math.max(1, Math.min(workouts.length, requestedDays, maxWorkouts));
  return workouts.slice(0, count);
}

function makePhases(
  input: PlanDraftInput,
  schedule: Weekday[],
  phaseSpecs: [PhaseSpec, PhaseSpec],
  maxWorkouts: number
): StructuredPhaseInput[] {
  return phaseSpecs.map((phase, phaseIndex) => {
    const workouts = trimWorkouts(
      phase.workouts,
      input.setup.daysPerWeek,
      maxWorkouts
    ).map((workout, workoutIndex) =>
      makeWorkout(input, schedule, workoutIndex, workout)
    );

    return {
      goal: phase.goal,
      ...getPhasePresets(input, phaseIndex + 1),
      workouts
    };
  });
}

function strengthRepOverride(goalType: TrainingGoalType, emphasis: "main" | "accessory") {
  if (goalType === "hypertrophy") {
    return emphasis === "main"
      ? { reps: "8-12", rest: "75-90 sec" }
      : { reps: "10-15", rest: "60 sec" };
  }

  if (goalType === "strength") {
    return emphasis === "main"
      ? { reps: "4-6", rest: "2-3 min" }
      : { reps: "6-10", rest: "90 sec" };
  }

  return undefined;
}

function simpleFoundationSpecs(input: PlanDraftInput): [PhaseSpec, PhaseSpec] {
  const isRecovery = input.setup.goalType === "recovery";
  const label = goalLabels[input.setup.goalType].toLowerCase();

  return [
    {
      goal: isRecovery
        ? "Build a comfortable baseline while respecting current symptoms and constraints."
        : `Build a repeatable ${label} rhythm that is easy to complete.`,
      workouts: [
        {
          name: isRecovery ? "Mobility Reset" : "Quick Full Body",
          focus: isRecovery ? "Mobility and control" : "Simple full-body rhythm",
          summary: isRecovery
            ? "A conservative session for moving well without chasing fatigue."
            : "A short session with low setup and clear wins.",
          slots: isRecovery
            ? [
                { ids: ["hip-flexor-rockback", "thoracic-rotation"] },
                { ids: ["ankle-rock", "bird-dog"] }
              ]
            : [
                { ids: ["bodyweight-squat", "glute-bridge", "reverse-lunge"] },
                { ids: ["incline-push-up", "push-up"] },
                { ids: ["dead-bug", "side-plank"] }
              ]
        },
        {
          name: isRecovery ? "Core + Low-Load Strength" : "Walk + Mobility",
          focus: isRecovery ? "Low-load strength" : "Easy conditioning",
          summary: isRecovery
            ? "Gentle support work that keeps effort and symptoms in check."
            : "A flexible session for staying consistent when time is tight.",
          slots: isRecovery
            ? [
                { ids: ["glute-bridge", "hip-hinge-drill"] },
                { ids: ["dead-bug", "bird-dog"] },
                { ids: ["box-squat", "hip-flexor-rockback"] }
              ]
            : [
                { ids: ["brisk-walk", "low-impact-cardio-march"] },
                { ids: ["hip-flexor-rockback", "thoracic-rotation"] }
              ]
        }
      ]
    },
    {
      goal: isRecovery
        ? "Add a little more work while keeping symptoms and effort in check."
        : `Repeat the ${label} plan with a slightly stronger weekly rhythm.`,
      workouts: [
        {
          name: isRecovery ? "Gentle Strength" : "Repeatable Strength",
          focus: isRecovery ? "Comfortable strength exposure" : "Repeatable strength",
          summary: isRecovery
            ? "A slightly stronger session that still stays conservative."
            : "A simple strength session built to be repeated without friction.",
          slots: [
            { ids: ["box-squat", "bodyweight-squat", "glute-bridge"] },
            { ids: ["incline-push-up", "band-row", "dead-bug"] },
            { ids: ["bird-dog", "hip-flexor-rockback"] }
          ]
        },
        {
          name: isRecovery ? "Mobility + Walk" : "Easy Cardio + Core",
          focus: isRecovery ? "Easy movement" : "Cardio and core",
          summary: isRecovery
            ? "A low-stress session for keeping the week moving."
            : "A short support day that protects the routine.",
          slots: isRecovery
            ? [
                { ids: ["brisk-walk", "low-impact-cardio-march"] },
                { ids: ["hip-flexor-rockback", "thoracic-rotation"] },
                { ids: ["dead-bug", "bird-dog"] }
              ]
            : [
                { ids: ["brisk-walk", "low-impact-cardio-march"] },
                { ids: ["side-plank", "dead-bug"] }
              ]
        }
      ]
    }
  ];
}

function balancedThreeDaySpecs(input: PlanDraftInput): [PhaseSpec, PhaseSpec] {
  const label = goalLabels[input.setup.goalType].toLowerCase();

  return [
    {
      goal: `Build a balanced ${label} baseline with strength, cardio, and mobility support.`,
      workouts: [
        {
          name: "Full Body Strength",
          focus: "Strength base",
          summary: "A balanced strength day built around easy-to-repeat patterns.",
          slots: [
            { ids: ["goblet-squat", "bodyweight-squat", "reverse-lunge"] },
            { ids: ["incline-push-up", "push-up", "dumbbell-floor-press"] },
            { ids: ["band-row", "dumbbell-row", "dead-bug"] }
          ]
        },
        {
          name: "Cardio + Core",
          focus: "Conditioning and trunk control",
          summary: "Simple conditioning with core support for a more rounded week.",
          slots: [
            { ids: ["brisk-walk", "low-impact-cardio-march"] },
            { ids: ["dead-bug", "side-plank"] },
            { ids: ["hip-flexor-rockback", "thoracic-rotation"] }
          ]
        },
        {
          name: "Mobility Strength",
          focus: "Movement quality and support strength",
          summary: "A lighter session that builds useful capacity without piling on fatigue.",
          slots: [
            { ids: ["romanian-deadlift", "glute-bridge", "hip-hinge-drill"] },
            { ids: ["farmer-carry", "band-row", "side-plank"] },
            { ids: ["ankle-rock", "hip-flexor-rockback"] }
          ]
        }
      ]
    },
    {
      goal: `Add a little more ${label} work while keeping the week sustainable.`,
      workouts: [
        {
          name: "Full Body Strength B",
          focus: "Stronger full-body practice",
          summary: "A slightly more capable full-body day while keeping the structure familiar.",
          slots: [
            { ids: ["goblet-squat", "reverse-lunge", "bodyweight-squat"] },
            { ids: ["dumbbell-row", "band-row", "side-plank"] },
            { ids: ["push-up", "incline-push-up", "dumbbell-floor-press"] }
          ]
        },
        {
          name: "Conditioning + Core B",
          focus: "Repeatable conditioning",
          summary: "A steady support session for maintaining momentum between strength days.",
          slots: [
            { ids: ["brisk-walk", "low-impact-cardio-march"] },
            { ids: ["calf-raise", "glute-bridge"] },
            { ids: ["side-plank", "dead-bug"] }
          ]
        },
        {
          name: "Support Strength B",
          focus: "Hinge, carry, and mobility",
          summary: "A support day that rounds out the week and keeps recovery manageable.",
          slots: [
            { ids: ["romanian-deadlift", "glute-bridge", "hip-hinge-drill"] },
            { ids: ["farmer-carry", "band-row", "dead-bug"] },
            { ids: ["thoracic-rotation", "hip-flexor-rockback"] }
          ]
        }
      ]
    }
  ];
}

function fullBodyStrengthSpecs(input: PlanDraftInput): [PhaseSpec, PhaseSpec] {
  const label = goalLabels[input.setup.goalType];
  const main = strengthRepOverride(input.setup.goalType, "main");
  const accessory = strengthRepOverride(input.setup.goalType, "accessory");
  const accessoryIds =
    input.setup.goalType === "hypertrophy"
      ? ["dumbbell-lateral-raise", "dumbbell-curl", "push-up"]
      : ["dead-bug", "side-plank", "calf-raise"];

  return [
    {
      goal: `Build ${label.toLowerCase()} with repeatable full-body sessions and clear movement patterns.`,
      workouts: [
        {
          name: `${label} Full Body A`,
          focus: "Squat, push, pull",
          summary: "A main full-body day with clear strength patterns.",
          slots: [
            {
              ids: ["barbell-back-squat", "goblet-squat", "bodyweight-squat", "reverse-lunge", "glute-bridge"],
              overrides: main
            },
            { ids: ["dumbbell-floor-press", "push-up", "incline-push-up"], overrides: main },
            { ids: ["dumbbell-row", "band-row", "side-plank"], overrides: accessory },
            { ids: ["dead-bug", "farmer-carry"], overrides: accessory }
          ]
        },
        {
          name: `${label} Full Body B`,
          focus: "Hinge, push, core",
          summary: "A hinge-focused strength day with enough support work to stay balanced.",
          slots: [
            { ids: ["romanian-deadlift", "glute-bridge", "hip-hinge-drill", "step-up"], overrides: main },
            { ids: ["dumbbell-shoulder-press", "dumbbell-floor-press", "incline-push-up"], overrides: main },
            { ids: ["farmer-carry", "band-row", "dead-bug"], overrides: accessory },
            { ids: ["side-plank", "dead-bug"], overrides: accessory }
          ]
        },
        {
          name: `${label} Full Body C`,
          focus: "Unilateral and accessory strength",
          summary: "A third day for extra practice when your weekly schedule supports it.",
          slots: [
            { ids: ["step-up", "reverse-lunge", "walking-lunge", "glute-bridge"], overrides: main },
            { ids: ["dumbbell-row", "band-row", "farmer-carry", "side-plank"], overrides: accessory },
            { ids: accessoryIds, overrides: accessory }
          ]
        }
      ]
    },
    {
      goal: `Progress ${label.toLowerCase()} work while keeping the same full-body structure easy to review.`,
      workouts: [
        {
          name: `${label} Full Body A2`,
          focus: "Squat strength and upper support",
          summary: "A familiar main day with slightly stronger intent.",
          slots: [
            { ids: ["barbell-back-squat", "goblet-squat", "bodyweight-squat", "reverse-lunge"], overrides: main },
            { ids: ["dumbbell-row", "band-row", "side-plank"], overrides: accessory },
            { ids: ["dumbbell-floor-press", "push-up", "incline-push-up"], overrides: main },
            { ids: ["farmer-carry", "dead-bug"], overrides: accessory }
          ]
        },
        {
          name: `${label} Full Body B2`,
          focus: "Hinge strength and trunk control",
          summary: "A stronger hinge day that still respects your setup and constraints.",
          slots: [
            { ids: ["romanian-deadlift", "glute-bridge", "hip-hinge-drill"], overrides: main },
            { ids: ["step-up", "reverse-lunge", "walking-lunge"], overrides: accessory },
            { ids: ["side-plank", "dead-bug", "farmer-carry"], overrides: accessory }
          ]
        },
        {
          name: `${label} Full Body C2`,
          focus: "Accessories and repeatable volume",
          summary: "A sustainable third day for additional useful work.",
          slots: [
            { ids: ["push-up", "incline-push-up", "dumbbell-floor-press"], overrides: accessory },
            { ids: ["band-row", "dumbbell-row", "farmer-carry", "dead-bug"], overrides: accessory },
            { ids: accessoryIds, overrides: accessory }
          ]
        }
      ]
    }
  ];
}

function upperLowerSpecs(input: PlanDraftInput): [PhaseSpec, PhaseSpec] {
  const label = goalLabels[input.setup.goalType];
  const main = strengthRepOverride(input.setup.goalType, "main");
  const accessory = strengthRepOverride(input.setup.goalType, "accessory");
  const upperAccessory =
    input.setup.goalType === "hypertrophy"
      ? ["dumbbell-lateral-raise", "dumbbell-curl", "side-plank"]
      : ["farmer-carry", "side-plank", "dead-bug"];

  return [
    {
      goal: `Build ${label.toLowerCase()} with an upper/lower split and equipment-aware loading.`,
      workouts: [
        {
          name: `${label} Lower A`,
          focus: "Lower-body main work",
          summary: "A lower-body day centered on the main squat and hinge patterns.",
          slots: [
            { ids: ["barbell-back-squat", "goblet-squat", "bodyweight-squat", "reverse-lunge"], overrides: main },
            { ids: ["romanian-deadlift", "glute-bridge", "hip-hinge-drill"], overrides: main },
            { ids: ["calf-raise", "dead-bug", "side-plank"], overrides: accessory }
          ]
        },
        {
          name: `${label} Upper A`,
          focus: "Upper-body push and pull",
          summary: "A simple upper-body session with balanced pressing and rowing.",
          slots: [
            { ids: ["dumbbell-floor-press", "push-up", "incline-push-up"], overrides: main },
            { ids: ["dumbbell-row", "band-row", "farmer-carry", "side-plank"], overrides: main },
            { ids: upperAccessory, overrides: accessory }
          ]
        },
        {
          name: `${label} Lower B`,
          focus: "Unilateral lower-body work",
          summary: "A second lower-body day with unilateral strength and posterior-chain support.",
          slots: [
            { ids: ["step-up", "reverse-lunge", "walking-lunge", "glute-bridge"], overrides: main },
            { ids: ["romanian-deadlift", "glute-bridge", "hip-hinge-drill"], overrides: accessory },
            { ids: ["side-plank", "dead-bug", "calf-raise"], overrides: accessory }
          ]
        },
        {
          name: `${label} Upper B`,
          focus: "Upper-body accessories",
          summary: "A second upper-body day that adds useful support volume.",
          slots: [
            { ids: ["dumbbell-shoulder-press", "dumbbell-floor-press", "incline-push-up"], overrides: main },
            { ids: ["band-row", "dumbbell-row", "farmer-carry", "dead-bug"], overrides: accessory },
            { ids: upperAccessory, overrides: accessory }
          ]
        }
      ]
    },
    {
      goal: `Progress the ${label.toLowerCase()} split with familiar sessions and slightly more intent.`,
      workouts: [
        {
          name: `${label} Lower A2`,
          focus: "Lower-body progression",
          summary: "Repeat the lower-body base with a slightly stronger training rhythm.",
          slots: [
            { ids: ["barbell-back-squat", "goblet-squat", "bodyweight-squat", "reverse-lunge"], overrides: main },
            { ids: ["step-up", "walking-lunge", "glute-bridge"], overrides: accessory },
            { ids: ["dead-bug", "calf-raise", "side-plank"], overrides: accessory }
          ]
        },
        {
          name: `${label} Upper A2`,
          focus: "Upper-body progression",
          summary: "Repeat the upper-body base with clearer intent and manageable volume.",
          slots: [
            { ids: ["dumbbell-floor-press", "push-up", "incline-push-up"], overrides: main },
            { ids: ["dumbbell-row", "band-row", "farmer-carry", "side-plank"], overrides: main },
            { ids: upperAccessory, overrides: accessory }
          ]
        },
        {
          name: `${label} Lower B2`,
          focus: "Lower-body accessories",
          summary: "Support lower-body strength or volume with controlled unilateral work.",
          slots: [
            { ids: ["romanian-deadlift", "glute-bridge", "hip-hinge-drill"], overrides: main },
            { ids: ["reverse-lunge", "step-up", "walking-lunge"], overrides: accessory },
            { ids: ["calf-raise", "side-plank", "dead-bug"], overrides: accessory }
          ]
        },
        {
          name: `${label} Upper B2`,
          focus: "Upper-body support",
          summary: "A final upper-body support day to round out the split.",
          slots: [
            { ids: ["dumbbell-shoulder-press", "dumbbell-floor-press", "incline-push-up"], overrides: main },
            { ids: ["band-row", "dumbbell-row", "farmer-carry", "dead-bug"], overrides: accessory },
            { ids: upperAccessory, overrides: accessory }
          ]
        }
      ]
    }
  ];
}

function runningSpecs(): [PhaseSpec, PhaseSpec] {
  return [
    {
      goal: "Build running readiness with run/walk intervals and simple support strength.",
      workouts: [
        {
          name: "Run/Walk Intervals",
          focus: "Easy running exposure",
          summary: "A run/walk session represented in the current exercise-style plan model.",
          slots: [
            { ids: ["run-walk-intervals"] },
            { ids: ["tibialis-raise", "calf-raise"] }
          ]
        },
        {
          name: "Running Prep Strength",
          focus: "Lower-body support",
          summary: "Strength work that supports running without turning the day into a heavy lift.",
          slots: [
            { ids: ["glute-bridge", "hip-hinge-drill"] },
            { ids: ["step-up", "walking-lunge", "reverse-lunge"] },
            { ids: ["dead-bug", "side-plank"] }
          ]
        },
        {
          name: "Mobility + Core",
          focus: "Running mobility",
          summary: "Mobility and trunk work to keep the running week manageable.",
          slots: [
            { ids: ["hip-flexor-rockback", "thoracic-rotation"] },
            { ids: ["ankle-rock", "tibialis-raise"] },
            { ids: ["side-plank", "dead-bug"] }
          ]
        }
      ]
    },
    {
      goal: "Add more easy running while keeping strength and mobility work supportive.",
      workouts: [
        {
          name: "Easy Run",
          focus: "Easy aerobic work",
          summary: "A simple easy-run session represented in the current exercise-style plan model.",
          slots: [
            { ids: ["easy-run", "run-walk-intervals"] },
            { ids: ["calf-raise", "tibialis-raise"] }
          ]
        },
        {
          name: "Stride Prep Strength",
          focus: "Running support strength",
          summary: "Support strength for a slightly stronger running phase.",
          slots: [
            { ids: ["step-up", "walking-lunge", "glute-bridge"] },
            { ids: ["calf-raise", "tibialis-raise"] },
            { ids: ["side-plank", "dead-bug"] }
          ]
        },
        {
          name: "Running Mobility Reset",
          focus: "Mobility and relaxed mechanics",
          summary: "A light support day that can absorb fatigue from the run day.",
          slots: [
            { ids: ["stride-drills", "brisk-walk"] },
            { ids: ["hip-flexor-rockback", "ankle-rock"] },
            { ids: ["dead-bug", "side-plank"] }
          ]
        }
      ]
    }
  ];
}

function sportPerformanceSpecs(input: PlanDraftInput): [PhaseSpec, PhaseSpec] {
  const sportLabel =
    input.profile?.sportsInterests?.[0]?.trim() ||
    input.setup.focusAreas[0]?.trim() ||
    "Sport";

  return [
    {
      goal: `Build a ${sportLabel.toLowerCase()} support base with strength, lateral prep, and mobility.`,
      workouts: [
        {
          name: `${sportLabel} Strength Base`,
          focus: "Strength and trunk control",
          summary: "A general strength day to support sport work without over-specializing.",
          slots: [
            { ids: ["goblet-squat", "bodyweight-squat", "reverse-lunge"] },
            { ids: ["romanian-deadlift", "glute-bridge", "hip-hinge-drill"] },
            { ids: ["dumbbell-row", "band-row", "dead-bug"] }
          ]
        },
        {
          name: `${sportLabel} Lateral Prep`,
          focus: "Lateral movement and control",
          summary: "Lateral preparation with conservative athletic intent.",
          slots: [
            { ids: ["lateral-lunge", "side-plank", "dead-bug"] },
            { ids: ["lateral-shuffle", "skater-hop", "brisk-walk"] },
            { ids: ["ankle-rock", "hip-flexor-rockback"] }
          ]
        },
        {
          name: `${sportLabel} Mobility + Carry`,
          focus: "Mobility, carry, and core",
          summary: "A support day for repeatable sport performance work.",
          slots: [
            { ids: ["farmer-carry", "band-row", "side-plank"] },
            { ids: ["thoracic-rotation", "hip-flexor-rockback"] },
            { ids: ["calf-raise", "dead-bug"] }
          ]
        }
      ]
    },
    {
      goal: `Progress the ${sportLabel.toLowerCase()} support work while keeping it repeatable.`,
      workouts: [
        {
          name: `${sportLabel} Strength B`,
          focus: "Strength progression",
          summary: "Repeat the strength base with a slightly stronger support pattern.",
          slots: [
            { ids: ["goblet-squat", "reverse-lunge", "bodyweight-squat"] },
            { ids: ["push-up", "incline-push-up", "dumbbell-floor-press"] },
            { ids: ["dumbbell-row", "band-row", "farmer-carry", "side-plank"] }
          ]
        },
        {
          name: `${sportLabel} Lateral B`,
          focus: "Lateral power and control",
          summary: "A second lateral day that remains conservative when constraints are present.",
          slots: [
            { ids: ["lateral-lunge", "step-up", "side-plank"] },
            { ids: ["lateral-shuffle", "skater-hop", "brisk-walk"] },
            { ids: ["dead-bug", "ankle-rock"] }
          ]
        },
        {
          name: `${sportLabel} Support B`,
          focus: "Mobility and durability",
          summary: "A support session for the pieces that keep sport training sustainable.",
          slots: [
            { ids: ["farmer-carry", "romanian-deadlift", "glute-bridge"] },
            { ids: ["thoracic-rotation", "hip-flexor-rockback"] },
            { ids: ["side-plank", "dead-bug"] }
          ]
        }
      ]
    }
  ];
}

function chooseDraftShape(input: PlanDraftInput): DraftShape {
  const { daysPerWeek, goalType, preferredSplit } = input.setup;

  if (goalType === "running" || preferredSplit === "run_strength") {
    return "run_strength";
  }

  if (goalType === "recovery" || goalType === "consistency") {
    return "simple_foundation";
  }

  if (
    (goalType === "strength" || goalType === "hypertrophy") &&
    (daysPerWeek >= 4 ||
      preferredSplit === "upper_lower" ||
      preferredSplit === "push_pull_legs")
  ) {
    return "upper_lower";
  }

  if (goalType === "strength" || goalType === "hypertrophy") {
    return "strength_full_body";
  }

  return "balanced_3_day";
}

function getPlanName(input: PlanDraftInput) {
  if (input.setup.goalType === "recovery") {
    return "Recovery Foundation Plan";
  }

  if (input.setup.goalType === "sport_performance") {
    const sport = input.profile?.sportsInterests?.[0]?.trim();
    return sport ? `${sport} Performance Starter Plan` : "Sport Performance Starter Plan";
  }

  return `${goalLabels[input.setup.goalType]} Starter Plan`;
}

function getPlanDescription(input: PlanDraftInput) {
  const objective = input.setup.objectiveSummary?.trim();
  const focusText = input.setup.focusAreas.length
    ? ` Focus areas: ${input.setup.focusAreas.join(", ")}.`
    : "";
  const constraintText = input.setup.currentConstraints.length
    ? ` Current constraints: ${input.setup.currentConstraints.join(", ")}.`
    : "";

  return (
    objective ||
    `A ${splitLabels[input.setup.preferredSplit]} starter plan for ${goalLabels[
      input.setup.goalType
    ].toLowerCase()}.`
  ).concat(focusText, constraintText);
}

function getPhaseSpecs(input: PlanDraftInput, shape: DraftShape): [PhaseSpec, PhaseSpec] {
  if (shape === "simple_foundation") {
    return simpleFoundationSpecs(input);
  }

  if (shape === "run_strength") {
    return runningSpecs();
  }

  if (shape === "upper_lower") {
    return upperLowerSpecs(input);
  }

  if (input.setup.goalType === "sport_performance") {
    return sportPerformanceSpecs(input);
  }

  if (shape === "balanced_3_day") {
    return balancedThreeDaySpecs(input);
  }

  return fullBodyStrengthSpecs(input);
}

function getMaxWorkouts(shape: DraftShape, input: PlanDraftInput) {
  if (shape === "simple_foundation") {
    return 2;
  }

  if (shape === "upper_lower") {
    return 4;
  }

  if (shape === "strength_full_body" || shape === "run_strength") {
    return input.setup.daysPerWeek >= 3 ? 3 : 2;
  }

  return 3;
}

export function createGuidedStarterPlan(input: PlanDraftInput): StructuredPlanInput {
  const weeklySchedule = makeSchedule(input);
  const shape = chooseDraftShape(input);
  const phases = makePhases(
    input,
    weeklySchedule,
    getPhaseSpecs(input, shape),
    getMaxWorkouts(shape, input)
  );

  return {
    version: "structured-v1",
    name: getPlanName(input),
    description: getPlanDescription(input),
    weeklySchedule,
    phases
  };
}
