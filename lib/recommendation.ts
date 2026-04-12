type RecommendationInput = {
  completed: boolean;
  pain: boolean;
  effort: "Too easy" | "Appropriate" | "Too hard";
};

export function generateRecommendation({
  completed,
  pain,
  effort
}: RecommendationInput) {
  if (pain) {
    return {
      title: "Pause progression and review this phase",
      description:
        "Note what hurt, keep the load steady, and consider a lighter day or exercise swap before the next session."
    };
  }

  if (!completed) {
    return {
      title: "Repeat the workout before changing phases",
      description:
        "Stay with this phase for now and note what got in the way."
    };
  }

  if (effort === "Too easy") {
    return {
      title: "Stay in phase and watch for a progression opening",
      description:
        "If this keeps feeling easy with clean technique and no pain, you may be ready for more load or the next phase."
    };
  }

  if (effort === "Too hard") {
    return {
      title: "Hold the current phase and monitor recovery",
      description:
        "Hold off on progressing. If the next session also feels too hard, review volume, load, or rest."
    };
  }

  return {
    title: "Keep building in the current phase",
    description:
      "This landed in the right range. Keep stacking clean, pain-free reps until your advance criteria are met."
  };
}
