import { exerciseCatalog, getCatalogExercise, type ExerciseCatalogItem, type ExerciseTrackingMetadata } from "@/lib/exercise-library";
import { normalizeExerciseLookupKey, resolveExerciseIdentityByCanonicalId, resolveExerciseIdentityByReviewedName, reviewedSystemAliases } from "@/lib/exercise-identity";
import { hasExerciseGuidance, normalizeExerciseGuidance, type ExerciseGuidance } from "@/lib/exercise-guidance";
import { isStructuredPlanInput, isWeekday, normalizeExerciseVideoUrl } from "@/lib/validation";
import type { ExerciseTrackingType, StructuredExerciseInput, StructuredPlanInput, UnilateralMode, Weekday } from "@/lib/types";

export type ProviderExerciseCandidate = {
  proposedCatalogId?: string | null;
  name: string;
  prescription?: { sets: number; reps: string; rest: string; tempo?: string | null };
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
    progression?: {
      advancementPreset: "clean_sessions_in_window" | "clean_sessions_streak" | "all_scheduled_workouts";
      advancementSettings: Record<string, number>;
      deloadPreset: "pain_flags_in_window" | "too_hard_streak";
      deloadSettings: Record<string, number>;
    };
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
  | { status: "matched"; exercise: StructuredExerciseInput; provenance: MatchProvenance; planSpecificCoaching: string; tempo?: string | null; safetyNotes?: string | null; videoSearchQuery?: string | null }
  | { status: "custom"; exercise: StructuredExerciseInput; provenance: MatchProvenance; tempo?: string | null; safetyNotes?: string | null; videoSearchQuery?: string | null }
  | { status: "needs_review"; displayName: string; prescription: NonNullable<ProviderExerciseCandidate["prescription"]>; issues: ExerciseResolutionIssue[]; provenance: MatchProvenance; proposedCatalogExercises: Array<{ catalogId: string; name: string }>; candidate: ProviderExerciseCandidate };

export type FatalGeneratedDraftError = { code: "invalid_plan_hierarchy" | "invalid_exercise_structure" | "missing_required_prescription" | "unsupported_tracking_metadata"; message: string; path: string };

export type NormalizedGeneratedPlanDraft = { plan: StructuredPlanInput; exercises: NormalizedGeneratedExercise[]; reviewBlockingIssues: ExerciseResolutionIssue[] };

export const GENERIC_AMBIGUOUS_NAMES = new Set(["row", "press", "shoulder press", "curl", "lunge", "leg curl", "squat", "deadlift"]);
const trackingTypes = new Set<ExerciseTrackingType>(["weight_reps", "reps_only", "duration", "distance", "distance_duration", "completion"]);
const unilateralModes = new Set<UnilateralMode>(["bilateral", "same_each_side", "independent_sides"]);

const appOwnedGeneratedPhaseProgression = {
  advancementPreset: "clean_sessions_in_window" as const,
  advancementSettings: { sessions: 4, weeks: 2 },
  deloadPreset: "pain_flags_in_window" as const,
  deloadSettings: { painFlags: 2, days: 7 }
};

function normalizeOptionalString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeOptionalNullableString(value: unknown) {
  const normalized = normalizeOptionalString(value);
  return normalized || null;
}

function normalizePrescription(candidate: ProviderExerciseCandidate) {
  const p = candidate.prescription;
  const reps = normalizeOptionalString(p?.reps);
  const rest = normalizeOptionalString(p?.rest);
  if (!p || !Number.isInteger(p.sets) || p.sets <= 0 || !reps || !rest) return null;
  return { ...p, reps, rest, tempo: normalizeOptionalNullableString(p.tempo) };
}

function hasIncompatibleUnits(candidate: ProviderExerciseCandidate) {
  if (candidate.trackingType === "completion") return Boolean(candidate.loadUnit || candidate.distanceUnit || candidate.supportedLoadUnits?.length || candidate.supportedDistanceUnits?.length);
  if (candidate.trackingType === "weight_reps") return !candidate.loadUnit || !(candidate.supportedLoadUnits ?? []).includes(candidate.loadUnit);
  if (candidate.trackingType === "distance" || candidate.trackingType === "distance_duration") return !candidate.distanceUnit || !(candidate.supportedDistanceUnits ?? []).includes(candidate.distanceUnit);
  return Boolean(candidate.loadUnit || candidate.distanceUnit);
}

function requiresSecondaryLabel(type?: ExerciseTrackingType) {
  return type === "weight_reps" || type === "distance_duration";
}

export function validateReviewedAliasIntegrity(aliases = reviewedSystemAliases) {
  const byKey = new Map<string, string>();
  for (const exercise of exerciseCatalog) {
    const key = normalizeExerciseLookupKey(exercise.name);
    if (!key) throw new Error(`Blank normalized canonical exercise name: ${exercise.id}`);
    const existing = byKey.get(key);
    if (existing && existing !== exercise.id) throw new Error(`Canonical exercise name collision for ${exercise.name}`);
    byKey.set(key, exercise.id);
  }
  for (const [catalogId, values] of Object.entries(aliases)) {
    if (!getCatalogExercise(catalogId)) throw new Error(`Reviewed alias target does not exist: ${catalogId}`);
    const targetKeys = new Set<string>();
    for (const alias of values) {
      const key = normalizeExerciseLookupKey(alias);
      if (!key) throw new Error(`Reviewed alias normalizes blank for ${catalogId}`);
      if (targetKeys.has(key)) throw new Error(`Duplicate reviewed alias for ${catalogId}: ${alias}`);
      targetKeys.add(key);
      const existing = byKey.get(key);
      if (existing && existing !== catalogId) throw new Error(`Reviewed alias collision for ${alias}`);
      byKey.set(key, catalogId);
    }
  }
}

function metadataFromCatalog(item: ExerciseCatalogItem) {
  return { trackingType: item.trackingType, unilateralMode: item.unilateralMode, loadUnit: item.loadUnit, distanceUnit: item.distanceUnit, primaryValueLabel: item.primaryValueLabel, secondaryValueLabel: item.secondaryValueLabel };
}

function toMatchedExercise(item: ExerciseCatalogItem, candidate: ProviderExerciseCandidate, prescription: NonNullable<ProviderExerciseCandidate["prescription"]>): StructuredExerciseInput {
  return { sourceExerciseId: item.id, name: item.name, sets: prescription.sets, reps: prescription.reps, rest: prescription.rest, coachingNote: normalizeOptionalString(candidate.coachingNote), guidance: item.guidance, videoUrl: item.videoUrl, ...metadataFromCatalog(item) };
}

function validateCustom(candidate: ProviderExerciseCandidate): ExerciseResolutionIssue[] {
  const issues: ExerciseResolutionIssue[] = [];
  const normalizedVideoUrl = typeof candidate.videoUrl === "string" ? normalizeExerciseVideoUrl(candidate.videoUrl) : null;
  const guidance = normalizeExerciseGuidance(candidate.guidance);
  if (!normalizeOptionalString(candidate.name)) issues.push({ code: "invalid_custom_candidate", message: "Custom exercise name is required.", field: "name" });
  if (!normalizeOptionalString(candidate.coachingNote) && !hasExerciseGuidance(guidance)) issues.push({ code: "invalid_custom_candidate", message: "Custom exercise guidance is required.", field: "coachingNote" });
  if (!normalizeOptionalString(candidate.videoSearchQuery)) issues.push({ code: "invalid_custom_candidate", message: "Custom exercise video search query is required.", field: "videoSearchQuery" });
  if (!normalizedVideoUrl) issues.push({ code: "invalid_custom_candidate", message: "Custom exercise requires a supported YouTube video URL.", field: "videoUrl" });
  if (!candidate.trackingType || !trackingTypes.has(candidate.trackingType)) issues.push({ code: "invalid_custom_candidate", message: "Supported tracking type is required.", field: "trackingType" });
  if (!candidate.unilateralMode || !unilateralModes.has(candidate.unilateralMode)) issues.push({ code: "invalid_custom_candidate", message: "Supported unilateral mode is required.", field: "unilateralMode" });
  if (hasIncompatibleUnits(candidate)) issues.push({ code: "invalid_custom_candidate", message: "Tracking units must match the tracking type.", field: "units" });
  if (!normalizeOptionalString(candidate.primaryValueLabel)) issues.push({ code: "invalid_custom_candidate", message: "Primary display label is required.", field: "primaryValueLabel" });
  if (requiresSecondaryLabel(candidate.trackingType) && !normalizeOptionalString(candidate.secondaryValueLabel)) issues.push({ code: "invalid_custom_candidate", message: "Secondary display label is required.", field: "secondaryValueLabel" });
  return issues;
}

export function resolveGeneratedExercise(candidate: ProviderExerciseCandidate): NormalizedGeneratedExercise {
  const prescription = normalizePrescription(candidate);
  if (!prescription) throw new Error("resolveGeneratedExercise requires a valid prescription; call normalizeGeneratedPlanDraft for typed fatal errors.");
  const candidateName = normalizeOptionalString(candidate.name);
  const key = normalizeExerciseLookupKey(candidateName);
  const byId = typeof candidate.proposedCatalogId === "string" && candidate.proposedCatalogId ? resolveExerciseIdentityByCanonicalId(candidate.proposedCatalogId) : null;
  const byName = resolveExerciseIdentityByReviewedName(candidateName);
  if (byId?.status === "resolved") {
    if (byName.status === "resolved" && byName.candidate.canonicalId !== byId.candidate.canonicalId) {
      return { status: "needs_review", displayName: candidateName, prescription, issues: [{ code: "supplied_id_name_conflict", message: "Supplied catalog ID conflicts with exercise name.", suppliedCatalogId: byId.candidate.canonicalId, resolvedNameCatalogId: byName.candidate.canonicalId }], provenance: { kind: "id_name_conflict", suppliedCatalogId: byId.candidate.canonicalId, suppliedName: candidateName, resolvedNameCatalogId: byName.candidate.canonicalId }, proposedCatalogExercises: [byId.candidate, byName.candidate].map((c) => ({ catalogId: c.canonicalId, name: c.displayName })), candidate };
    }
    return { status: "matched", exercise: toMatchedExercise(getCatalogExercise(byId.candidate.canonicalId)!, candidate, prescription), provenance: { kind: "catalog_id", catalogId: byId.candidate.canonicalId }, planSpecificCoaching: normalizeOptionalString(candidate.coachingNote), tempo: prescription.tempo, safetyNotes: normalizeOptionalNullableString(candidate.safetyNotes), videoSearchQuery: normalizeOptionalNullableString(candidate.videoSearchQuery) };
  }
  if (byName.status === "ambiguous") return { status: "needs_review", displayName: candidateName, prescription, issues: [{ code: "ambiguous_catalog_identity", message: "Multiple catalog exercises match.", candidates: byName.candidates.map((c) => ({ catalogId: c.canonicalId, name: c.displayName })) }], provenance: { kind: "ambiguous", normalizedKey: key, catalogIds: byName.candidates.map((c) => c.canonicalId) }, proposedCatalogExercises: byName.candidates.map((c) => ({ catalogId: c.canonicalId, name: c.displayName })), candidate };
  if (byName.status === "resolved") {
    const item = getCatalogExercise(byName.candidate.canonicalId)!;
    const via = byName.reviewedAlias ? "reviewed_alias" : "canonical_name";
    const provenance: MatchProvenance = candidate.proposedCatalogId ? { kind: "invalid_id_name_match", invalidCatalogId: candidate.proposedCatalogId, catalogId: item.id, via } : via === "reviewed_alias" ? { kind: "reviewed_alias", catalogId: item.id, alias: byName.reviewedAlias!, normalizedKey: key } : { kind: "canonical_name", catalogId: item.id, normalizedKey: key };
    return { status: "matched", exercise: toMatchedExercise(item, candidate, prescription), provenance, planSpecificCoaching: normalizeOptionalString(candidate.coachingNote), tempo: prescription.tempo, safetyNotes: normalizeOptionalNullableString(candidate.safetyNotes), videoSearchQuery: normalizeOptionalNullableString(candidate.videoSearchQuery) };
  }
  if (GENERIC_AMBIGUOUS_NAMES.has(key)) {
    const proposed = exerciseCatalog.filter((e) => normalizeExerciseLookupKey(e.name).includes(key)).map((e) => ({ catalogId: e.id, name: e.name }));
    return { status: "needs_review", displayName: candidateName, prescription, issues: [{ code: "ambiguous_catalog_identity", message: "Generic exercise name needs review.", candidates: proposed }], provenance: { kind: "ambiguous", normalizedKey: key, catalogIds: proposed.map((p) => p.catalogId) }, proposedCatalogExercises: proposed, candidate };
  }
  const customIssues = validateCustom(candidate);
  if (customIssues.length) return { status: "needs_review", displayName: candidateName, prescription, issues: customIssues, provenance: { kind: "custom_candidate", normalizedKey: key }, proposedCatalogExercises: [], candidate };
  const normalizedVideoUrl = typeof candidate.videoUrl === "string" ? normalizeExerciseVideoUrl(candidate.videoUrl) : null;
  return { status: "custom", provenance: { kind: "custom_candidate", normalizedKey: key }, tempo: prescription.tempo, safetyNotes: normalizeOptionalNullableString(candidate.safetyNotes), videoSearchQuery: normalizeOptionalNullableString(candidate.videoSearchQuery), exercise: { name: candidateName, sets: prescription.sets, reps: prescription.reps, rest: prescription.rest, coachingNote: normalizeOptionalString(candidate.coachingNote), guidance: normalizeExerciseGuidance(candidate.guidance), videoUrl: normalizedVideoUrl!, trackingType: candidate.trackingType, unilateralMode: candidate.unilateralMode, loadUnit: candidate.loadUnit ?? null, distanceUnit: candidate.distanceUnit ?? null, primaryValueLabel: normalizeOptionalString(candidate.primaryValueLabel), secondaryValueLabel: normalizeOptionalNullableString(candidate.secondaryValueLabel) } };
}

function validateDraftStructure(draft: GeneratedPlanDraft) {
  const fatalErrors: FatalGeneratedDraftError[] = [];
  if (draft.version !== "generated-plan-draft-v1") fatalErrors.push({ code: "invalid_plan_hierarchy", message: "Unsupported draft version.", path: "version" });
  if (!normalizeOptionalString(draft.name)) fatalErrors.push({ code: "invalid_plan_hierarchy", message: "Plan name is required.", path: "name" });
  if (!Array.isArray(draft.weeklySchedule) || draft.weeklySchedule.length === 0 || !draft.weeklySchedule.every(isWeekday)) fatalErrors.push({ code: "invalid_plan_hierarchy", message: "Draft needs a valid weekly schedule.", path: "weeklySchedule" });
  if (!Array.isArray(draft.phases) || draft.phases.length === 0) fatalErrors.push({ code: "invalid_plan_hierarchy", message: "Draft needs at least one phase.", path: "phases" });
  (draft.phases ?? []).forEach((phase, pi) => {
    if (!normalizeOptionalString(phase?.goal)) fatalErrors.push({ code: "invalid_plan_hierarchy", message: "Phase goal is required.", path: `phases.${pi}.goal` });
    if (!Array.isArray(phase.workouts) || phase.workouts.length === 0) fatalErrors.push({ code: "invalid_plan_hierarchy", message: "Phase needs at least one workout.", path: `phases.${pi}.workouts` });
    (phase.workouts ?? []).forEach((workout, wi) => {
      if (!normalizeOptionalString(workout?.name)) fatalErrors.push({ code: "invalid_plan_hierarchy", message: "Workout name is required.", path: `phases.${pi}.workouts.${wi}.name` });
      if (!Array.isArray(workout.scheduledDays) || workout.scheduledDays.length === 0 || !workout.scheduledDays.every(isWeekday)) fatalErrors.push({ code: "invalid_plan_hierarchy", message: "Workout scheduled days are required.", path: `phases.${pi}.workouts.${wi}.scheduledDays` });
      if (!Array.isArray(workout.exercises) || workout.exercises.length === 0) fatalErrors.push({ code: "invalid_plan_hierarchy", message: "Workout needs at least one exercise.", path: `phases.${pi}.workouts.${wi}.exercises` });
      (workout.exercises ?? []).forEach((exercise, ei) => {
        if (!exercise || typeof exercise.name !== "string") fatalErrors.push({ code: "invalid_exercise_structure", message: "Exercise name is required.", path: `phases.${pi}.workouts.${wi}.exercises.${ei}.name` });
        if (!normalizePrescription(exercise)) fatalErrors.push({ code: "missing_required_prescription", message: "Exercise prescription is required and must include positive integer sets, reps, and rest.", path: `phases.${pi}.workouts.${wi}.exercises.${ei}.prescription` });
      });
    });
  });
  return fatalErrors;
}

export function normalizeGeneratedPlanDraft(draft: GeneratedPlanDraft): NormalizedGeneratedPlanDraft | { fatalErrors: FatalGeneratedDraftError[] } {
  const fatalErrors = validateDraftStructure(draft);
  if (fatalErrors.length) return { fatalErrors };
  const resolved: NormalizedGeneratedExercise[] = [];
  const phases = draft.phases.map((phase) => ({
    goal: phase.goal,
    ...(phase.progression ?? appOwnedGeneratedPhaseProgression),
    workouts: phase.workouts.map((workout) => ({ ...workout, exercises: workout.exercises.map((exercise) => {
      const outcome = resolveGeneratedExercise(exercise);
      resolved.push(outcome);
      return outcome.status === "matched" || outcome.status === "custom" ? outcome.exercise : { name: outcome.displayName, sets: outcome.prescription.sets, reps: outcome.prescription.reps, rest: outcome.prescription.rest, coachingNote: "Resolve exercise identity before saving." };
    }) }))
  }));
  const plan = { version: "structured-v1" as const, name: draft.name, description: draft.description, creationSource: "llm_draft" as const, weeklySchedule: draft.weeklySchedule, phases };
  if (!isStructuredPlanInput(plan)) return { fatalErrors: [{ code: "invalid_plan_hierarchy", message: "Generated draft does not satisfy the structured plan contract.", path: "plan" }] };
  return { plan, exercises: resolved, reviewBlockingIssues: resolved.flatMap((e) => e.status === "needs_review" ? e.issues : []) };
}

export function canSaveNormalizedGeneratedDraft(normalized: NormalizedGeneratedPlanDraft) { return normalized.reviewBlockingIssues.length === 0 && isStructuredPlanInput(normalized.plan); }
