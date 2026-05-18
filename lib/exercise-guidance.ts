export type ExerciseGuidance = {
  setup?: string;
  executionCues?: string[];
  commonMistakes?: string[];
  modifications?: string[];
  safetyNotes?: string;
  videoSearchQuery?: string;
};

const textLimits: Record<string, number> = {
  baseNote: 280,
  setup: 360,
  listItem: 140,
  safetyNotes: 360,
  videoSearchQuery: 120
};

const maxListItems = 4;

function clampText(value: string, maxLength: number) {
  const trimmed = value.trim().replace(/\s+/g, " ");

  if (trimmed.length <= maxLength) {
    return trimmed;
  }

  return trimmed.slice(0, maxLength).trim();
}

export function normalizeGuidanceText(value: unknown, maxLength = textLimits.setup) {
  return typeof value === "string" ? clampText(value, maxLength) : "";
}

export function normalizeGuidanceList(value: unknown) {
  const rawItems = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(",")
      : [];

  return rawItems
    .filter((item): item is string => typeof item === "string")
    .map((item) => clampText(item, textLimits.listItem))
    .filter(Boolean)
    .slice(0, maxListItems);
}

export function normalizeExerciseGuidance(value: unknown): ExerciseGuidance | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }

  const input = value as Partial<ExerciseGuidance>;
  const guidance: ExerciseGuidance = {};
  const setup = normalizeGuidanceText(input.setup, textLimits.setup);
  const executionCues = normalizeGuidanceList(input.executionCues);
  const commonMistakes = normalizeGuidanceList(input.commonMistakes);
  const modifications = normalizeGuidanceList(input.modifications);
  const safetyNotes = normalizeGuidanceText(input.safetyNotes, textLimits.safetyNotes);
  const videoSearchQuery = normalizeGuidanceText(
    input.videoSearchQuery,
    textLimits.videoSearchQuery
  );

  if (setup) {
    guidance.setup = setup;
  }

  if (executionCues.length) {
    guidance.executionCues = executionCues;
  }

  if (commonMistakes.length) {
    guidance.commonMistakes = commonMistakes;
  }

  if (modifications.length) {
    guidance.modifications = modifications;
  }

  if (safetyNotes) {
    guidance.safetyNotes = safetyNotes;
  }

  if (videoSearchQuery) {
    guidance.videoSearchQuery = videoSearchQuery;
  }

  return hasExerciseGuidance(guidance) ? guidance : undefined;
}

export function hasExerciseGuidance(guidance: ExerciseGuidance | undefined) {
  return Boolean(
    guidance?.setup ||
      guidance?.executionCues?.length ||
      guidance?.commonMistakes?.length ||
      guidance?.modifications?.length ||
      guidance?.safetyNotes ||
      guidance?.videoSearchQuery
  );
}

function formatList(items: string[] | undefined) {
  return (items ?? []).map((item) => item.trim()).filter(Boolean).join("; ");
}

export function formatExerciseGuidanceNote({
  coachingNote,
  guidance
}: {
  coachingNote: string;
  guidance?: ExerciseGuidance;
}) {
  const normalizedGuidance = normalizeExerciseGuidance(guidance);
  const lines: string[] = [];
  const baseNote = clampText(coachingNote, textLimits.baseNote);

  if (baseNote) {
    lines.push(baseNote);
  }

  if (!normalizedGuidance) {
    return lines.join("\n");
  }

  if (normalizedGuidance.setup) {
    lines.push(`Setup: ${normalizedGuidance.setup}`);
  }

  if (normalizedGuidance.executionCues?.length) {
    lines.push(`Cues: ${formatList(normalizedGuidance.executionCues)}`);
  }

  if (normalizedGuidance.commonMistakes?.length) {
    lines.push(`Common mistakes: ${formatList(normalizedGuidance.commonMistakes)}`);
  }

  if (normalizedGuidance.modifications?.length) {
    lines.push(`Modifications: ${formatList(normalizedGuidance.modifications)}`);
  }

  if (normalizedGuidance.safetyNotes) {
    lines.push(`Safety: ${normalizedGuidance.safetyNotes}`);
  }

  if (normalizedGuidance.videoSearchQuery) {
    lines.push(`Video search: ${normalizedGuidance.videoSearchQuery}`);
  }

  return lines.join("\n");
}

function parseList(value: string) {
  return normalizeGuidanceList(value.split(";"));
}

export function parseExerciseGuidanceNote(coachingNote: string): {
  coachingNote: string;
  guidance?: ExerciseGuidance;
} {
  const lines = coachingNote
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const baseLines: string[] = [];
  const guidance: ExerciseGuidance = {};

  for (const line of lines) {
    const separatorIndex = line.indexOf(":");
    const label = separatorIndex === -1 ? "" : line.slice(0, separatorIndex).toLowerCase();
    const value = separatorIndex === -1 ? "" : line.slice(separatorIndex + 1).trim();

    if (label === "setup") {
      guidance.setup = normalizeGuidanceText(value, textLimits.setup);
    } else if (label === "cues") {
      guidance.executionCues = parseList(value);
    } else if (label === "common mistakes") {
      guidance.commonMistakes = parseList(value);
    } else if (label === "modifications") {
      guidance.modifications = parseList(value);
    } else if (label === "safety") {
      guidance.safetyNotes = normalizeGuidanceText(value, textLimits.safetyNotes);
    } else if (label === "video search") {
      guidance.videoSearchQuery = normalizeGuidanceText(value, textLimits.videoSearchQuery);
    } else {
      baseLines.push(line);
    }
  }

  return {
    coachingNote: clampText(baseLines.join(" "), textLimits.baseNote),
    guidance: normalizeExerciseGuidance(guidance)
  };
}
