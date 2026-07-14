import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { DashboardEmptyState } from "./page";
import type { WorkoutPlan } from "@/lib/types";

const activePlan: WorkoutPlan = {
  id: "plan-active-1",
  name: "Active Plan",
  description: "Plan under review.",
  goalType: "strength",
  progressionMode: "performance_based",
  creationSource: "guided_template",
  setupContext: null,
  isActive: true,
  scheduleSummary: "Mon / Wed / Fri",
  weeklySchedule: ["mon", "wed", "fri"],
  completedAt: null,
  archivedAt: null,
  currentPhase: {
    id: "phase-1",
    phaseNumber: 1,
    goal: "Build repeatable strength.",
    advanceCriteria: "Complete four clean sessions.",
    deloadCriteria: "Review pain or repeated tough sessions.",
    advancementPreset: "clean_sessions_in_window",
    advancementSettings: { sessions: 4, weeks: 2 },
    deloadPreset: "pain_flags_in_window",
    deloadSettings: { painFlags: 2, days: 7 }
  },
  phases: [],
  workouts: []
};

function hrefs(markup: string) {
  return Array.from(markup.matchAll(/href="([^"]+)"/g), (match) => match[1]);
}

describe("DashboardEmptyState", () => {
  it("links users without an active plan directly to plan creation", () => {
    const markup = renderToStaticMarkup(<DashboardEmptyState activePlan={null} />);

    expect(hrefs(markup)).toEqual(["/plans/new"]);
    expect(markup).toContain("Create a plan");
  });

  it("links active-plan users without today's workout to the specific plan review surface", () => {
    const markup = renderToStaticMarkup(<DashboardEmptyState activePlan={activePlan} />);

    expect(hrefs(markup)).toEqual(["/plans/plan-active-1"]);
    expect(markup).toContain("Review plan");
  });

  it("does not expose workout or plan-creation fallthrough links for active-plan users without today's workout", () => {
    const markup = renderToStaticMarkup(<DashboardEmptyState activePlan={activePlan} />);
    const destinations = hrefs(markup);

    expect(markup).not.toContain("Choose workout");
    expect(destinations).not.toContain("/workout");
    expect(destinations).not.toContain("/plans/new");
    expect(destinations.every((href) => !href.startsWith("/workout"))).toBe(true);
  });
});
