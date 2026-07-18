import {
  exerciseCatalog,
  type ExerciseCatalogItem,
} from "@/lib/exercise-library";

export type ExerciseIdentityOwnerScope = "system" | "user";
export type ExerciseIdentityResolutionStatus =
  | "resolved"
  | "ambiguous"
  | "unresolved";

export type ExerciseIdentityCandidate = {
  canonicalId: string;
  displayName: string;
  normalizedKey: string;
  ownerScope: ExerciseIdentityOwnerScope;
  equipmentTags: string[];
  movementPattern: ExerciseCatalogItem["movementPattern"];
  qualifierText: string;
};

export type ExerciseIdentityResolution =
  | {
      status: "resolved";
      candidate: ExerciseIdentityCandidate;
      reviewedAlias: string | null;
    }
  | {
      status: "ambiguous";
      normalizedKey: string;
      candidates: ExerciseIdentityCandidate[];
    }
  | { status: "unresolved"; normalizedKey: string };

export const reviewedSystemAliases: Record<string, string[]> = {
  "push-up": ["push up", "pushup", "press up", "push ups"],
  "romanian-deadlift": [
    "barbell rdl",
    "barbell romanian deadlift",
    "barbell romanian deadlifts",
    "romanian dead lift with barbell",
  ],
  "bodyweight-squat": ["bodyweight squat", "air squat", "bodyweight squats"],
  "goblet-squat": ["goblet squats", "kb goblet squat", "db goblet squat"],
  "dumbbell-row": [
    "db row",
    "dumbbell row",
    "one arm dumbbell row",
    "single arm dumbbell row",
  ],
  "dumbbell-bench-press": ["db bench press", "dumbbell bench", "db bench"],
  "barbell-bench-press": ["bb bench press", "bench press", "barbell bench"],
  "dumbbell-romanian-deadlift": [
    "db rdl",
    "dumbbell rdl",
    "dumbbell romanian deadlifts",
  ],
  "barbell-overhead-press": ["bb overhead press", "barbell shoulder press"],
  "dumbbell-shoulder-press": [
    "db shoulder press",
    "dumbbell overhead press",
    "db overhead press",
  ],
  "seated-cable-row": ["seated cable row"],
  "lat-pulldown": ["lat pull down", "lat pulldowns"],
  "triceps-pushdown": [
    "tricep pushdown",
    "cable triceps pushdown",
    "triceps pressdown",
  ],
  "calf-raise": ["calf raises", "standing calf raise"],
  plank: ["front plank"],
  "side-plank": ["side plank hold"],
  "pallof-press": ["pallof presses"],
  "farmer-carry": ["farmer walk"],
  "suitcase-carry": ["suitcase walk"],
  "leg-extension": ["leg extensions"],
  "seated-leg-curl": ["seated hamstring curl", "seated leg curls"],
  "split-squat": ["split squats"],
  "bulgarian-split-squat": ["rear foot elevated split squat", "rfess"],
  "forward-lunge": ["forward lunges"],
  "reverse-lunge": ["reverse lunges"],
  "walking-lunge": ["walking lunges"],
  "half-kneeling-hip-flexor-stretch": ["half kneeling hip flexor stretch"],
  "thoracic-rotation": [
    "open book thoracic rotation",
    "open-book thoracic rotations",
  ],
  "ankle-rock": [
    "knee to wall ankle mobilization",
    "knee-to-wall ankle mobilizations",
  ],
  "marching-drill": ["a march", "a-marches"],
  "hack-squat": ["machine hack squat", "hack squats"],
  "lying-leg-curl": ["lying hamstring curl", "lying leg curls"],
  "seated-calf-raise": ["seated calf raises"],
  "cable-fly": ["cable chest fly", "cable flyes"],
  "pec-deck": ["pec deck fly", "pec deck flyes"],
  "cable-lateral-raise": ["cable lateral raises"],
  "hammer-curl": ["dumbbell hammer curl", "hammer curls"],
  "cable-overhead-triceps-extension": [
    "cable overhead tricep extension",
    "overhead cable triceps extension",
  ],
  "hip-abduction-machine": ["machine hip abduction", "hip abductor machine"],
  "hip-adduction-machine": ["machine hip adduction", "hip adductor machine"],
};

export function normalizeExerciseLookupKey(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("en-US")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function toCandidate(exercise: ExerciseCatalogItem): ExerciseIdentityCandidate {
  return {
    canonicalId: exercise.id,
    displayName: exercise.name,
    normalizedKey: normalizeExerciseLookupKey(exercise.name),
    ownerScope: "system",
    equipmentTags: exercise.equipmentTags,
    movementPattern: exercise.movementPattern,
    qualifierText: [
      exercise.equipmentTags.join("/"),
      exercise.unilateralMode.replace(/_/g, " "),
      exercise.movementPattern,
    ]
      .filter(Boolean)
      .join(" · "),
  };
}

const candidatesById = new Map(
  exerciseCatalog.map((exercise) => [exercise.id, toCandidate(exercise)]),
);

const reviewedLookup = new Map<
  string,
  Array<{ candidate: ExerciseIdentityCandidate; alias: string | null }>
>();

for (const exercise of exerciseCatalog) {
  const candidate = candidatesById.get(exercise.id)!;
  const names = new Set([
    exercise.name,
    ...(reviewedSystemAliases[exercise.id] ?? []),
  ]);

  for (const name of names) {
    const key = normalizeExerciseLookupKey(name);
    if (!key) continue;
    reviewedLookup.set(key, [
      ...(reviewedLookup.get(key) ?? []),
      {
        candidate,
        alias: key === normalizeExerciseLookupKey(exercise.name) ? null : name,
      },
    ]);
  }
}

export function resolveExerciseIdentityByCanonicalId(
  canonicalId?: string | null,
): ExerciseIdentityResolution {
  const normalizedKey = normalizeExerciseLookupKey(canonicalId ?? "");
  if (!canonicalId) return { status: "unresolved", normalizedKey };
  const candidate = candidatesById.get(canonicalId);
  return candidate
    ? { status: "resolved", candidate, reviewedAlias: null }
    : { status: "unresolved", normalizedKey };
}

export function resolveExerciseIdentityByReviewedName(
  name: string,
): ExerciseIdentityResolution {
  const normalizedKey = normalizeExerciseLookupKey(name);
  const matches = reviewedLookup.get(normalizedKey) ?? [];
  const unique = Array.from(
    new Map(
      matches.map((match) => [match.candidate.canonicalId, match]),
    ).values(),
  );

  if (unique.length === 1) {
    return {
      status: "resolved",
      candidate: unique[0].candidate,
      reviewedAlias: unique[0].alias,
    };
  }

  if (unique.length > 1) {
    return {
      status: "ambiguous",
      normalizedKey,
      candidates: unique.map((match) => match.candidate),
    };
  }

  return { status: "unresolved", normalizedKey };
}

export function resolveSystemExerciseIdentity(input: {
  canonicalId?: string | null;
  displayName: string;
}): ExerciseIdentityResolution {
  const byId = resolveExerciseIdentityByCanonicalId(input.canonicalId);
  if (byId.status === "resolved") return byId;
  return resolveExerciseIdentityByReviewedName(input.displayName);
}

export function getReviewedAliasesForExercise(canonicalId: string) {
  return reviewedSystemAliases[canonicalId] ?? [];
}

export function getExerciseSearchKeys(
  exercise: Pick<ExerciseCatalogItem, "id" | "name" | "equipmentTags">,
) {
  return [
    exercise.name,
    exercise.id.replace(/-/g, " "),
    ...exercise.equipmentTags,
    ...getReviewedAliasesForExercise(exercise.id),
  ].map(normalizeExerciseLookupKey);
}
