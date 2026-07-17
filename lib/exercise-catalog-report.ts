import { exerciseCatalog, type ExerciseCatalogItem } from "@/lib/exercise-library";
import { normalizeExerciseLookupKey, reviewedSystemAliases } from "@/lib/exercise-identity";
import { GENERIC_AMBIGUOUS_NAMES, resolveGeneratedExercise, type ProviderExerciseCandidate } from "@/lib/generated-plan-draft";
import { normalizeExerciseVideoUrl } from "@/lib/validation";

export type CatalogInventoryReport = ReturnType<typeof buildExerciseCatalogInventoryReport>;

const fixture = (name: string): ProviderExerciseCandidate => ({
  name,
  prescription: { sets: 3, reps: "8", rest: "60 sec" },
  coachingNote: "Use controlled form.",
  videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  videoSearchQuery: `${name} exercise demo`,
  trackingType: "reps_only",
  unilateralMode: "bilateral",
  primaryValueLabel: "Reps"
});

const generatedNameFixtures = [
  "DB Bench Press",
  "Dumbbell Bench",
  "Romanian Deadlifts",
  "RDL",
  "Shoulder Press",
  "Leg Curl",
  "Prowler March"
];

function countBy<T extends string>(items: ExerciseCatalogItem[], selector: (item: ExerciseCatalogItem) => T | T[]) {
  const counts: Record<string, number> = {};
  for (const item of items) {
    const values = selector(item);
    for (const value of Array.isArray(values) ? values : [values]) counts[value] = (counts[value] ?? 0) + 1;
  }
  return Object.fromEntries(Object.entries(counts).sort(([a], [b]) => a.localeCompare(b)));
}

export function buildExerciseCatalogInventoryReport() {
  const canonicalByKey = new Map<string, string[]>();
  for (const exercise of exerciseCatalog) {
    const key = normalizeExerciseLookupKey(exercise.name);
    canonicalByKey.set(key, [...(canonicalByKey.get(key) ?? []), exercise.id]);
  }

  const aliasByKey = new Map<string, Array<{ catalogId: string; alias: string }>>();
  const blankAliases: Array<{ catalogId: string; alias: string }> = [];
  const missingAliasTargets: string[] = [];
  for (const [catalogId, aliases] of Object.entries(reviewedSystemAliases).sort(([a], [b]) => a.localeCompare(b))) {
    if (!exerciseCatalog.some((e) => e.id === catalogId)) missingAliasTargets.push(catalogId);
    for (const alias of aliases) {
      const key = normalizeExerciseLookupKey(alias);
      if (!key) blankAliases.push({ catalogId, alias });
      aliasByKey.set(key, [...(aliasByKey.get(key) ?? []), { catalogId, alias }]);
    }
  }

  const aliasCountByExercise = Object.fromEntries(exerciseCatalog.map((e) => [e.id, reviewedSystemAliases[e.id]?.length ?? 0]).sort(([a], [b]) => String(a).localeCompare(String(b))));
  const duplicateAliases = Array.from(aliasByKey.entries()).filter(([, values]) => values.length > 1 && new Set(values.map((v) => v.catalogId)).size === 1).map(([key, values]) => ({ key, aliases: values }));
  const aliasToAliasCollisions = Array.from(aliasByKey.entries()).filter(([, values]) => new Set(values.map((v) => v.catalogId)).size > 1).map(([key, values]) => ({ key, aliases: values }));
  const aliasToCanonicalCollisions = Array.from(aliasByKey.entries()).flatMap(([key, aliases]) => (canonicalByKey.get(key) ?? []).filter((id) => !aliases.every((a) => a.catalogId === id)).map((canonicalId) => ({ key, canonicalId, aliases })));

  const missingPrimaryLabels = exerciseCatalog.filter((e) => !e.primaryValueLabel).map((e) => e.id);
  const missingSecondaryLabels = exerciseCatalog.filter((e) => (e.trackingType === "weight_reps" || e.trackingType === "distance_duration") && !e.secondaryValueLabel).map((e) => e.id);
  const missingUnsupportedUnits = exerciseCatalog.filter((e) => (e.trackingType === "weight_reps" && (!e.loadUnit || !e.supportedLoadUnits.includes(e.loadUnit))) || ((e.trackingType === "distance" || e.trackingType === "distance_duration") && (!e.distanceUnit || !e.supportedDistanceUnits.includes(e.distanceUnit))) || (!["weight_reps", "distance", "distance_duration"].includes(e.trackingType) && (e.loadUnit || e.distanceUnit || e.supportedLoadUnits.length || e.supportedDistanceUnits.length))).map((e) => e.id);
  const missingGuidance = exerciseCatalog.filter((e) => !e.coachingNote?.trim() && !e.guidance).map((e) => e.id);
  const missingCautionExpected = exerciseCatalog.filter((e) => (e.preferenceTags.join(" ") + e.traitTags.join(" ")).match(/overhead|jump|plyometric|loaded|running|knee|shoulder|back/i) && e.cautionTags.length === 0).map((e) => e.id);
  const missingReviewedYouTubeUrls = exerciseCatalog.filter((e) => !e.videoUrl).map((e) => e.id);
  const invalidReviewedYouTubeUrls = exerciseCatalog.filter((e) => e.videoUrl && !normalizeExerciseVideoUrl(e.videoUrl)).map((e) => ({ id: e.id, videoUrl: e.videoUrl }));

  const fixtureResults = generatedNameFixtures.map((name) => {
    const result = resolveGeneratedExercise(fixture(name));
    return { name, status: result.status, provenance: result.provenance.kind };
  });

  return {
    totals: { activeCatalogExercises: exerciseCatalog.length, reviewedAliases: Object.values(reviewedSystemAliases).reduce((sum, aliases) => sum + aliases.length, 0), reviewedYouTubeUrls: exerciseCatalog.filter((e) => e.videoUrl).length },
    aliasCountByExercise,
    normalizedCanonicalNameCollisions: Array.from(canonicalByKey.entries()).filter(([, ids]) => ids.length > 1).map(([key, ids]) => ({ key, ids })),
    duplicateAliases,
    aliasToAliasCollisions,
    aliasToCanonicalCollisions,
    blankAliases,
    missingAliasTargets,
    intentionallyAmbiguousGenericNames: Array.from(GENERIC_AMBIGUOUS_NAMES).sort(),
    byCategory: countBy(exerciseCatalog, (e) => e.category),
    byMovementPattern: countBy(exerciseCatalog, (e) => e.movementPattern),
    byEquipment: countBy(exerciseCatalog, (e) => e.equipmentTags),
    byGoal: countBy(exerciseCatalog, (e) => e.goalTags),
    byTrackingType: countBy(exerciseCatalog, (e) => e.trackingType),
    byUnilateralMode: countBy(exerciseCatalog, (e) => e.unilateralMode),
    metadataFindings: { missingUnsupportedUnits, missingPrimaryLabels, missingSecondaryLabels, missingGuidance, missingCautionExpected, missingReviewedYouTubeUrls, invalidReviewedYouTubeUrls },
    materialCoverageGaps: ["hack squat", "pec deck", "hip abduction machine", "hip adduction machine", "mountain climber", "cable fly", "front-rack carry", "overhead carry"],
    fixtureBasedUnmatchedGeneratedNames: fixtureResults.filter((r) => r.status === "custom").map((r) => r.name),
    fixtureBasedNeedsReviewGeneratedNames: fixtureResults.filter((r) => r.status === "needs_review").map((r) => r.name),
    humanReviewQueue: [
      { exerciseName: "Hack squat", proposedCanonicalName: "Hack squat", proposedAliases: ["machine hack squat"], proposedTrackingMetadata: "weight_reps, bilateral", unresolvedIdentityQuestion: "Confirm machine variation scope.", unresolvedGuidanceOrCautionQuestion: "Confirm knee/back caution wording.", missingOrUnverifiedYouTubeUrl: true, reason: "Useful but needs variation and demo review." },
      { exerciseName: "Overhead carry", proposedCanonicalName: "Overhead carry", proposedAliases: [], proposedTrackingMetadata: "weight_reps or distance_duration", unresolvedIdentityQuestion: "Current tracking model cannot cleanly pair load and distance/duration.", unresolvedGuidanceOrCautionQuestion: "Overhead caution needs careful review.", missingOrUnverifiedYouTubeUrl: true, reason: "Nuanced tracking and shoulder-risk review needed." }
    ]
  };
}

export function renderExerciseCatalogInventoryMarkdown(report = buildExerciseCatalogInventoryReport()) {
  return `${JSON.stringify(report, null, 2)}\n`;
}
