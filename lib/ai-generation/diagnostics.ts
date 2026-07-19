export type InvalidDraftDiagnostic = {
  model: string;
  stage: "canonical_validation";
  fatalValidationErrorCodes: string[];
  reviewBlockingIssueCodes: string[];
  normalizedFieldPaths: string[];
  counts: {
    fatalValidationErrors: number;
    reviewBlockingIssues: number;
    phases: number;
    workouts: number;
    exercises: number;
  };
};

export type InvalidDraftDiagnosticSink = (
  diagnostic: InvalidDraftDiagnostic,
) => void;

const defaultDiagnosticSink: InvalidDraftDiagnosticSink = (diagnostic) => {
  console.warn(
    "AI generation invalid draft",
    JSON.stringify(diagnostic),
  );
};

/**
 * Emits allowlisted operational metadata only. Callers must never add generated
 * content, prompts, setup answers, provider bodies, or user identity fields.
 */
export function emitInvalidDraftDiagnostic(
  diagnostic: InvalidDraftDiagnostic,
  sink: InvalidDraftDiagnosticSink = defaultDiagnosticSink,
) {
  sink(diagnostic);
}
