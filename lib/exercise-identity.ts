import { exerciseCatalog, type ExerciseCatalogItem } from "@/lib/exercise-library";

export type ExerciseIdentityOwnerScope = "system" | "user";
export type ExerciseIdentityResolutionStatus = "resolved" | "ambiguous" | "unresolved";

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
  | { status: "resolved"; candidate: ExerciseIdentityCandidate; reviewedAlias: string | null }
  | { status: "ambiguous"; normalizedKey: string; candidates: ExerciseIdentityCandidate[] }
  | { status: "unresolved"; normalizedKey: string };

const reviewedSystemAliases: Record<string, string[]> = {
  "push-up": ["push up", "pushup"],
  "romanian-deadlift": ["rdl", "romanian dead lift"],
  "bodyweight-squat": ["bodyweight squat", "air squat"],
  "dumbbell-row": ["db row", "dumbbell row"]
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
    qualifierText: [exercise.equipmentTags.join("/"), exercise.unilateralMode.replace(/_/g, " "), exercise.movementPattern]
      .filter(Boolean)
      .join(" · ")
  };
}

const candidatesById = new Map(exerciseCatalog.map((exercise) => [exercise.id, toCandidate(exercise)]));

const reviewedLookup = new Map<string, Array<{ candidate: ExerciseIdentityCandidate; alias: string | null }>>();

for (const exercise of exerciseCatalog) {
  const candidate = candidatesById.get(exercise.id)!;
  const names = new Set([exercise.name, exercise.id.replace(/-/g, " "), ...(reviewedSystemAliases[exercise.id] ?? [])]);

  for (const name of names) {
    const key = normalizeExerciseLookupKey(name);
    if (!key) continue;
    reviewedLookup.set(key, [...(reviewedLookup.get(key) ?? []), { candidate, alias: name === exercise.name ? null : name }]);
  }
}

export function resolveExerciseIdentityByCanonicalId(canonicalId?: string | null): ExerciseIdentityResolution {
  const normalizedKey = normalizeExerciseLookupKey(canonicalId ?? "");
  if (!canonicalId) return { status: "unresolved", normalizedKey };
  const candidate = candidatesById.get(canonicalId);
  return candidate ? { status: "resolved", candidate, reviewedAlias: null } : { status: "unresolved", normalizedKey };
}

export function resolveExerciseIdentityByReviewedName(name: string): ExerciseIdentityResolution {
  const normalizedKey = normalizeExerciseLookupKey(name);
  const matches = reviewedLookup.get(normalizedKey) ?? [];
  const unique = Array.from(new Map(matches.map((match) => [match.candidate.canonicalId, match])).values());

  if (unique.length === 1) {
    return { status: "resolved", candidate: unique[0].candidate, reviewedAlias: unique[0].alias };
  }

  if (unique.length > 1) {
    return { status: "ambiguous", normalizedKey, candidates: unique.map((match) => match.candidate) };
  }

  return { status: "unresolved", normalizedKey };
}

export function resolveSystemExerciseIdentity(input: { canonicalId?: string | null; displayName: string }): ExerciseIdentityResolution {
  const byId = resolveExerciseIdentityByCanonicalId(input.canonicalId);
  if (byId.status === "resolved") return byId;
  return resolveExerciseIdentityByReviewedName(input.displayName);
}
