import { exerciseCatalog, getCatalogExercise, type ExerciseCatalogItem, type ExerciseTrackingMetadata } from "@/lib/exercise-library";
import { normalizeExerciseLookupKey, resolveExerciseIdentityByCanonicalId, resolveExerciseIdentityByReviewedName, reviewedSystemAliases } from "@/lib/exercise-identity";
import type { ExerciseGuidance } from "@/lib/exercise-guidance";
import type { ExerciseTrackingType, StructuredExerciseInput, StructuredPlanInput, UnilateralMode, Weekday } from "@/lib/types";

export type ProviderExerciseCandidate = {
  proposedCatalogId?: string | null;
  name: string;
  prescription: { sets: number; reps: string; rest: string; tempo?: string | null };
  trackingType?: ExerciseTrackingType;
  unilateralMode?: UnilateralMode;
  loadUnit?: "lb" | "kg" | null;
  supportedLoadUnits?: Array<"lb" | "kg">;
  distanceUnit?: "mi" | "km" | "m" | null;
  supportedDistanceUnits?: Array<"mi" | "km" | "m">;
  primaryValueLabel?: string | null;
  secondaryValueLabel?: string | null;
  guidance?: ExerciseGuidance;
  coachingNote: string;
  safetyNotes?: string | null;
  videoUrl?: string | null;
  videoSearchQuery?: string | null;
};

export type GeneratedPlanDraft = {
  version: "generated-plan-draft-v1";
  name: string;
  description: string;
  weeklySchedule: Weekday[];
  phases: Array<{
    goal: string;
    workouts: Array<{ name: string; focus: string; summary: string; scheduledDays: Weekday[]; exercises: ProviderExerciseCandidate[] }>;
  }>;
};

export type MatchProvenance =
  | { kind: "catalog_id"; catalogId: string }
  | { kind: "canonical_name"; catalogId: string; normalizedKey: string }
  | { kind: "reviewed_alias"; catalogId: string; alias: string; normalizedKey: string }
  | { kind: "invalid_id_name_match"; invalidCatalogId: string; catalogId: string; via: "canonical_name" | "reviewed_alias" }
  | { kind: "custom_candidate"; normalizedKey: string }
  | { kind: "ambiguous"; normalizedKey: string; catalogIds: string[] }
  | { kind: "id_name_conflict"; suppliedCatalogId: string; suppliedName: string; resolvedNameCatalogId: string };

export type ExerciseResolutionIssue =
  | { code: "ambiguous_catalog_identity"; message: string; candidates: Array<{ catalogId: string; name: string }> }
  | { code: "supplied_id_name_conflict"; message: string; suppliedCatalogId: string; resolvedNameCatalogId: string }
  | { code: "invalid_custom_candidate"; message: string; field: string };

export type NormalizedGeneratedExercise =
  | { status: "matched"; exercise: StructuredExerciseInput; provenance: MatchProvenance; planSpecificCoaching: string }
  | { status: "custom"; exercise: StructuredExerciseInput; provenance: MatchProvenance }
  | { status: "needs_review"; displayName: string; prescription: ProviderExerciseCandidate["prescription"]; issues: ExerciseResolutionIssue[]; provenance: MatchProvenance; proposedCatalogExercises: Array<{ catalogId: string; name: string }>; candidate: ProviderExerciseCandidate };

export type FatalGeneratedDraftError = { code: "invalid_plan_hierarchy" | "invalid_exercise_structure" | "missing_required_prescription" | "unsupported_tracking_metadata"; message: string; path: string };

export type NormalizedGeneratedPlanDraft = { plan: StructuredPlanInput; exercises: NormalizedGeneratedExercise[]; reviewBlockingIssues: ExerciseResolutionIssue[] };

const GENERIC_AMBIGUOUS_NAMES = new Set(["row", "press", "curl", "lunge"]);
const trackingTypes = new Set<ExerciseTrackingType>(["weight_reps", "reps_only", "duration", "distance", "distance_duration", "completion"]);
const unilateralModes = new Set<UnilateralMode>(["bilateral", "same_each_side", "independent_sides"]);

function isYoutubeUrl(value?: string | null) {
  if (!value) return false;
  try {
    const host = new URL(value).hostname.toLowerCase();
    return host === "youtu.be" || host.endsWith(".youtube.com") || host === "youtube.com";
  } catch { return false; }
}

export function validateReviewedAliasIntegrity(aliases = reviewedSystemAliases) {
  const byKey = new Map<string, string>();
  for (const [catalogId, values] of Object.entries(aliases)) {
    if (!getCatalogExercise(catalogId)) throw new Error(`Reviewed alias target does not exist: ${catalogId}`);
    for (const alias of values) {
      const key = normalizeExerciseLookupKey(alias);
      const existing = byKey.get(key);
      if (existing && existing !== catalogId) throw new Error(`Reviewed alias collision for ${alias}`);
      byKey.set(key, catalogId);
    }
  }
}

function metadataFromCatalog(item: ExerciseCatalogItem) {
  return { trackingType: item.trackingType, unilateralMode: item.unilateralMode, loadUnit: item.loadUnit, distanceUnit: item.distanceUnit, primaryValueLabel: item.primaryValueLabel, secondaryValueLabel: item.secondaryValueLabel };
}

function toMatchedExercise(item: ExerciseCatalogItem, candidate: ProviderExerciseCandidate): StructuredExerciseInput {
  return { sourceExerciseId: item.id, name: item.name, sets: candidate.prescription.sets, reps: candidate.prescription.reps, rest: candidate.prescription.rest, coachingNote: candidate.coachingNote, guidance: item.guidance, videoUrl: item.videoUrl, ...metadataFromCatalog(item) };
}

function validateCustom(candidate: ProviderExerciseCandidate): ExerciseResolutionIssue[] {
  const issues: ExerciseResolutionIssue[] = [];
  if (!candidate.name.trim()) issues.push({ code: "invalid_custom_candidate", message: "Custom exercise name is required.", field: "name" });
  if (!candidate.coachingNote.trim() && !candidate.guidance) issues.push({ code: "invalid_custom_candidate", message: "Custom exercise guidance is required.", field: "coachingNote" });
  if (!candidate.videoSearchQuery?.trim()) issues.push({ code: "invalid_custom_candidate", message: "Custom exercise video search query is required.", field: "videoSearchQuery" });
  if (!isYoutubeUrl(candidate.videoUrl)) issues.push({ code: "invalid_custom_candidate", message: "Custom exercise requires a supported YouTube URL.", field: "videoUrl" });
  if (!candidate.trackingType || !trackingTypes.has(candidate.trackingType)) issues.push({ code: "invalid_custom_candidate", message: "Supported tracking type is required.", field: "trackingType" });
  if (!candidate.unilateralMode || !unilateralModes.has(candidate.unilateralMode)) issues.push({ code: "invalid_custom_candidate", message: "Supported unilateral mode is required.", field: "unilateralMode" });
  return issues;
}

export function resolveGeneratedExercise(candidate: ProviderExerciseCandidate): NormalizedGeneratedExercise {
  const key = normalizeExerciseLookupKey(candidate.name);
  if (GENERIC_AMBIGUOUS_NAMES.has(key)) {
    const proposed = exerciseCatalog.filter((e) => normalizeExerciseLookupKey(e.name).includes(key)).map((e) => ({ catalogId: e.id, name: e.name }));
    return { status: "needs_review", displayName: candidate.name, prescription: candidate.prescription, issues: [{ code: "ambiguous_catalog_identity", message: "Generic exercise name needs review.", candidates: proposed }], provenance: { kind: "ambiguous", normalizedKey: key, catalogIds: proposed.map((p) => p.catalogId) }, proposedCatalogExercises: proposed, candidate };
  }
  const byId = candidate.proposedCatalogId ? resolveExerciseIdentityByCanonicalId(candidate.proposedCatalogId) : null;
  const byName = resolveExerciseIdentityByReviewedName(candidate.name);
  if (byId?.status === "resolved") {
    if (byName.status === "resolved" && byName.candidate.canonicalId !== byId.candidate.canonicalId) {
      return { status: "needs_review", displayName: candidate.name, prescription: candidate.prescription, issues: [{ code: "supplied_id_name_conflict", message: "Supplied catalog ID conflicts with exercise name.", suppliedCatalogId: byId.candidate.canonicalId, resolvedNameCatalogId: byName.candidate.canonicalId }], provenance: { kind: "id_name_conflict", suppliedCatalogId: byId.candidate.canonicalId, suppliedName: candidate.name, resolvedNameCatalogId: byName.candidate.canonicalId }, proposedCatalogExercises: [byId.candidate, byName.candidate].map((c) => ({ catalogId: c.canonicalId, name: c.displayName })), candidate };
    }
    return { status: "matched", exercise: toMatchedExercise(getCatalogExercise(byId.candidate.canonicalId)!, candidate), provenance: { kind: "catalog_id", catalogId: byId.candidate.canonicalId }, planSpecificCoaching: candidate.coachingNote };
  }
  if (byName.status === "ambiguous") return { status: "needs_review", displayName: candidate.name, prescription: candidate.prescription, issues: [{ code: "ambiguous_catalog_identity", message: "Multiple catalog exercises match.", candidates: byName.candidates.map((c) => ({ catalogId: c.canonicalId, name: c.displayName })) }], provenance: { kind: "ambiguous", normalizedKey: key, catalogIds: byName.candidates.map((c) => c.canonicalId) }, proposedCatalogExercises: byName.candidates.map((c) => ({ catalogId: c.canonicalId, name: c.displayName })), candidate };
  if (byName.status === "resolved") {
    const item = getCatalogExercise(byName.candidate.canonicalId)!;
    const via = byName.reviewedAlias ? "reviewed_alias" : "canonical_name";
    const provenance: MatchProvenance = candidate.proposedCatalogId ? { kind: "invalid_id_name_match", invalidCatalogId: candidate.proposedCatalogId, catalogId: item.id, via } : via === "reviewed_alias" ? { kind: "reviewed_alias", catalogId: item.id, alias: byName.reviewedAlias!, normalizedKey: key } : { kind: "canonical_name", catalogId: item.id, normalizedKey: key };
    return { status: "matched", exercise: toMatchedExercise(item, candidate), provenance, planSpecificCoaching: candidate.coachingNote };
  }
  const customIssues = validateCustom(candidate);
  if (customIssues.length) return { status: "needs_review", displayName: candidate.name, prescription: candidate.prescription, issues: customIssues, provenance: { kind: "custom_candidate", normalizedKey: key }, proposedCatalogExercises: [], candidate };
  return { status: "custom", provenance: { kind: "custom_candidate", normalizedKey: key }, exercise: { name: candidate.name.trim(), sets: candidate.prescription.sets, reps: candidate.prescription.reps, rest: candidate.prescription.rest, coachingNote: candidate.coachingNote, guidance: candidate.guidance, videoUrl: candidate.videoUrl!, trackingType: candidate.trackingType, unilateralMode: candidate.unilateralMode, loadUnit: candidate.loadUnit, distanceUnit: candidate.distanceUnit, primaryValueLabel: candidate.primaryValueLabel, secondaryValueLabel: candidate.secondaryValueLabel } };
}

export function normalizeGeneratedPlanDraft(draft: GeneratedPlanDraft): NormalizedGeneratedPlanDraft | { fatalErrors: FatalGeneratedDraftError[] } {
  const fatalErrors: FatalGeneratedDraftError[] = [];
  if (draft.version !== "generated-plan-draft-v1" || !draft.phases?.length) fatalErrors.push({ code: "invalid_plan_hierarchy", message: "Draft needs at least one phase.", path: "phases" });
  const resolved: NormalizedGeneratedExercise[] = [];
  const phases = (draft.phases ?? []).map((phase, pi) => ({ goal: phase.goal, advancementPreset: "clean_sessions_in_window" as const, advancementSettings: { sessions: 4, weeks: 2 }, deloadPreset: "pain_flags_in_window" as const, deloadSettings: { painFlags: 2, days: 7 }, workouts: (phase.workouts ?? []).map((workout, wi) => ({ ...workout, exercises: (workout.exercises ?? []).map((exercise, ei) => {
    if (!exercise?.prescription || !Number.isInteger(exercise.prescription.sets) || !exercise.prescription.reps || !exercise.prescription.rest) fatalErrors.push({ code: "missing_required_prescription", message: "Exercise prescription is required.", path: `phases.${pi}.workouts.${wi}.exercises.${ei}.prescription` });
    const outcome = resolveGeneratedExercise(exercise); resolved.push(outcome);
    return outcome.status === "matched" || outcome.status === "custom" ? outcome.exercise : { name: outcome.displayName, sets: outcome.prescription.sets || 1, reps: outcome.prescription.reps || "Needs review", rest: outcome.prescription.rest || "Needs review", coachingNote: "Resolve exercise identity before saving." };
  }) })) }));
  if (fatalErrors.length) return { fatalErrors };
  return { plan: { version: "structured-v1", name: draft.name, description: draft.description, creationSource: "llm_draft", weeklySchedule: draft.weeklySchedule, phases }, exercises: resolved, reviewBlockingIssues: resolved.flatMap((e) => e.status === "needs_review" ? e.issues : []) };
}

export function canSaveNormalizedGeneratedDraft(normalized: NormalizedGeneratedPlanDraft) { return normalized.reviewBlockingIssues.length === 0; }
