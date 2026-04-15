import { describe, expect, it } from "vitest";
import type { ProfileSettingsInput } from "@/lib/types";
import { buildProfileUpdateValues } from "@/lib/profile-settings";
import { isProfileSettingsInput } from "@/lib/validation";

const settingsInput: ProfileSettingsInput = {
  age: 38,
  weight: 185.5,
  trainingExperience: "returning",
  activityLevel: "lightly_active",
  trainingEnvironment: "home",
  limitationsDetail: "Avoid heavy spinal loading for now.",
  injuries: ["Back"],
  equipment: ["Bodyweight", "Dumbbells"],
  exercisePreferences: ["Strength training", "Short sessions"],
  exerciseDislikes: ["Jumping"],
  sportsInterests: ["Hiking"],
  daysPerWeek: 3,
  sessionMinutes: 45
};

describe("profile settings validation", () => {
  it("accepts durable profile settings fields", () => {
    expect(isProfileSettingsInput(settingsInput)).toBe(true);
    expect(isProfileSettingsInput({ equipment: [], limitationsDetail: "", age: null })).toBe(true);
  });

  it("rejects invalid or onboarding-only settings fields", () => {
    expect(isProfileSettingsInput({ ...settingsInput, age: 12 })).toBe(false);
    expect(isProfileSettingsInput({ ...settingsInput, weight: 0 })).toBe(false);
    expect(isProfileSettingsInput({ ...settingsInput, trainingExperience: "expert" })).toBe(false);
    expect(isProfileSettingsInput({ ...settingsInput, activityLevel: "sometimes" })).toBe(false);
    expect(isProfileSettingsInput({ ...settingsInput, trainingEnvironment: "studio" })).toBe(false);
    expect(isProfileSettingsInput({ ...settingsInput, exercisePreferences: [42] })).toBe(false);
    expect(isProfileSettingsInput({ ...settingsInput, weeklySchedule: ["mon"] })).toBe(false);
    expect(isProfileSettingsInput({ ...settingsInput, planSetupChoice: "guided" })).toBe(false);
  });
});

describe("profile update value mapping", () => {
  it("preserves omitted fields while allowing explicit clears", () => {
    const updateValues = buildProfileUpdateValues({
      age: null,
      limitationsDetail: "",
      equipment: [],
      exerciseDislikes: [],
      daysPerWeek: 4
    });

    expect(updateValues).toEqual({
      age: null,
      limitations_detail: null,
      equipment: [],
      exercise_dislikes: [],
      days_per_week: 4
    });
    expect("weight" in updateValues).toBe(false);
    expect("training_experience" in updateValues).toBe(false);
    expect("sports_interests" in updateValues).toBe(false);
  });

  it("trims submitted text fields before saving", () => {
    expect(
      buildProfileUpdateValues({
        limitationsDetail: "  Keep running easy for now.  ",
        equipment: [" Bodyweight ", "", " Dumbbells "],
        sportsInterests: [" Hiking "]
      })
    ).toEqual({
      limitations_detail: "Keep running easy for now.",
      equipment: ["Bodyweight", "Dumbbells"],
      sports_interests: ["Hiking"]
    });
  });
});
