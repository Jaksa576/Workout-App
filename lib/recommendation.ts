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
        "Log the pain details, avoid automatic load increases, and consider a deload or exercise substitution before the next session."
    };
  }

  if (!completed) {
    return {
      title: "Repeat the workout before changing phases",
      description:
        "Treat this as incomplete data. Keep the current phase active and identify what prevented completion."
    };
  }

  if (effort === "Too easy") {
    return {
      title: "Stay in phase, but mark the plan for a progression check",
      description:
        "If this rating repeats across the week with clean technique and no pain, the next phase or a load increase may be appropriate."
    };
  }

  if (effort === "Too hard") {
    return {
      title: "Hold the current phase and monitor recovery",
      description:
        "Do not progress yet. If the next session is also too hard, review volume, load, or rest before moving forward."
    };
  }

  return {
    title: "Keep building in the current phase",
    description:
      "The session landed where it should. Continue collecting clean, pain-free reps until the advancement criteria are met."
  };
}

