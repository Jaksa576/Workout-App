import { describe, expect, it } from "vitest";
import type { OnboardingInput } from "@/lib/types";
import { isOnboardingInput } from "@/lib/validation";

const enrichedOnboardingInput: OnboardingInput = {
  goal: "Build a sustainable routine.",
  goalNotes: "",
  injuries: ["Back"],
  limitationsDetail: "Avoid heavy spinal loading for now.",
  equipment: ["Bodyweight", "Dumbbells"],
  age: 38,
  weight: 185.5,
  trainingExperience: "returning",
  activityLevel: "lightly_active",
  trainingEnvironment: "home",
  exercisePreferences: ["Strength training", "Short sessions"],
  exerciseDislikes: ["Jumping"],
  sportsInterests: ["Hiking"],
  daysPerWeek: 3,
  sessionMinutes: 45,
  weeklySchedule: ["mon", "wed", "fri"],
  planSetupChoice: "guided"
};

describe("onboarding profile validation", () => {
  it("accepts enriched durable profile fields with transient plan setup choice", () => {
    expect(isOnboardingInput(enrichedOnboardingInput)).toBe(true);
    expect(isOnboardingInput({ ...enrichedOnboardingInput, planSetupChoice: "manual" })).toBe(
      true
    );
  });

  it("keeps legacy-compatible payloads valid for the guided draft provider", () => {
    expect(
      isOnboardingInput({
        goal: "Build a sustainable routine.",
        goalNotes: "",
        injuries: [],
        equipment: ["Bodyweight"],
        daysPerWeek: 2,
        sessionMinutes: 30,
        weeklySchedule: ["tue", "thu"],
        planSetupChoice: "guided"
      })
    ).toBe(true);
  });

  it("accepts empty optional profile values without treating them as plan data", () => {
    expect(
      isOnboardingInput({
        ...enrichedOnboardingInput,
        age: null,
        weight: null,
        limitationsDetail: "",
        exercisePreferences: [],
        exerciseDislikes: [],
        sportsInterests: []
      })
    ).toBe(true);
  });

  it("rejects invalid profile values", () => {
    expect(isOnboardingInput({ ...enrichedOnboardingInput, age: 12 })).toBe(false);
    expect(isOnboardingInput({ ...enrichedOnboardingInput, weight: 0 })).toBe(false);
    expect(isOnboardingInput({ ...enrichedOnboardingInput, trainingExperience: "expert" })).toBe(
      false
    );
    expect(isOnboardingInput({ ...enrichedOnboardingInput, activityLevel: "sometimes" })).toBe(
      false
    );
    expect(isOnboardingInput({ ...enrichedOnboardingInput, trainingEnvironment: "studio" })).toBe(
      false
    );
    expect(isOnboardingInput({ ...enrichedOnboardingInput, exercisePreferences: [42] })).toBe(
      false
    );
    expect(isOnboardingInput({ ...enrichedOnboardingInput, planSetupChoice: "llm" })).toBe(false);
  });
});
