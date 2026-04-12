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
      title: "Pain logged, pause progression for now",
      description:
        "Keep the load steady and review what hurt before the next workout."
    };
  }

  if (!completed) {
    return {
      title: "Workout incomplete, repeat this session",
      description:
        "Stay with this workout next time and note what got in the way."
    };
  }

  if (effort === "Too easy") {
    return {
      title: "Workout felt easy, review progression soon",
      description:
        "If this keeps feeling easy with clean technique and no pain, you may be ready for a small step up."
    };
  }

  if (effort === "Too hard") {
    return {
      title: "Tough workout, repeat before progressing",
      description:
        "Hold off on progressing and give this workout another clean pass."
    };
  }

  return {
    title: "Successful workout, keep going with this plan",
    description:
      "This landed in the right range. Keep stacking clean, pain-free reps."
  };
}
