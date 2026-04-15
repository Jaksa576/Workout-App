"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type {
  ActivityLevel,
  Profile,
  ProfileSettingsInput,
  TrainingEnvironment,
  TrainingExperience
} from "@/lib/types";
import {
  activityLevelOptions,
  equipmentOptions,
  exerciseDislikeOptions,
  exercisePreferenceOptions,
  limitationAreas,
  sessionLengths,
  sportsInterestOptions,
  trainingEnvironmentOptions,
  trainingExperienceOptions
} from "@/lib/profile-options";

type ProfileSettingsFormProps = {
  profile: Profile;
};

function toggleListValue(values: string[], value: string) {
  if (value === "None right now") {
    return values.includes(value) ? [] : [value];
  }

  const nextValues = values.filter((item) => item !== "None right now");
  return nextValues.includes(value)
    ? nextValues.filter((item) => item !== value)
    : [...nextValues, value];
}

function toNullableNumber(value: string) {
  return value.trim() ? Number(value) : null;
}

function getInitialForm(profile: Profile): ProfileSettingsInput {
  return {
    age: profile.age ?? null,
    weight: profile.weight ?? null,
    trainingExperience: profile.trainingExperience ?? null,
    activityLevel: profile.activityLevel ?? null,
    trainingEnvironment: profile.trainingEnvironment ?? null,
    limitationsDetail: profile.limitationsDetail ?? "",
    injuries: profile.injuries,
    equipment: profile.equipment,
    exercisePreferences: profile.exercisePreferences ?? [],
    exerciseDislikes: profile.exerciseDislikes ?? [],
    sportsInterests: profile.sportsInterests ?? [],
    daysPerWeek: profile.daysPerWeek,
    sessionMinutes: profile.sessionMinutes
  };
}

function Field({
  label,
  helper,
  children
}: {
  label: string;
  helper?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-ink">{label}</span>
      {helper ? <span className="mt-1 block text-xs leading-5 text-slate">{helper}</span> : null}
      <div className="mt-3">{children}</div>
    </label>
  );
}

function collectVisibleOptions(options: string[], values: string[]) {
  return [...options, ...values.filter((value) => !options.includes(value))];
}

function OptionButtons({
  label,
  options,
  values,
  onChange,
  helper
}: {
  label: string;
  options: string[];
  values: string[];
  onChange: (values: string[]) => void;
  helper?: string;
}) {
  const visibleOptions = collectVisibleOptions(options, values);

  return (
    <div>
      <p className="text-sm font-semibold text-ink">{label}</p>
      {helper ? <p className="mt-1 text-xs leading-5 text-slate">{helper}</p> : null}
      <div className="mt-3 flex flex-wrap gap-3">
        {visibleOptions.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => onChange(toggleListValue(values, item))}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              values.includes(item) ? "bg-coral text-white" : "bg-white text-ink"
            }`}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}

export function ProfileSettingsForm({ profile }: ProfileSettingsFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState<ProfileSettingsInput>(() => getInitialForm(profile));
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    setStatus(null);

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(result.error ?? "Unable to save profile settings.");
      }

      setStatus("Profile settings saved.");
      startTransition(() => router.refresh());
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to save profile settings.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Age">
          <input
            type="number"
            min={13}
            max={120}
            value={form.age ?? ""}
            onChange={(event) =>
              setForm((current) => ({ ...current, age: toNullableNumber(event.target.value) }))
            }
            placeholder="Optional"
            className="w-full rounded-3xl border border-ink/10 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-coral"
          />
        </Field>
        <Field label="Weight">
          <input
            type="number"
            min={1}
            step="0.1"
            value={form.weight ?? ""}
            onChange={(event) =>
              setForm((current) => ({ ...current, weight: toNullableNumber(event.target.value) }))
            }
            placeholder="Optional"
            className="w-full rounded-3xl border border-ink/10 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-coral"
          />
        </Field>
        <Field label="Training experience">
          <select
            value={form.trainingExperience ?? ""}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                trainingExperience: event.target.value
                  ? (event.target.value as TrainingExperience)
                  : null
              }))
            }
            className="w-full rounded-3xl border border-ink/10 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-coral"
          >
            <option value="">Select experience</option>
            {trainingExperienceOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Current activity level">
          <select
            value={form.activityLevel ?? ""}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                activityLevel: event.target.value ? (event.target.value as ActivityLevel) : null
              }))
            }
            className="w-full rounded-3xl border border-ink/10 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-coral"
          >
            <option value="">Select activity level</option>
            {activityLevelOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid gap-5">
        <Field label="Training environment">
          <select
            value={form.trainingEnvironment ?? ""}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                trainingEnvironment: event.target.value
                  ? (event.target.value as TrainingEnvironment)
                  : null
              }))
            }
            className="w-full rounded-3xl border border-ink/10 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-coral"
          >
            <option value="">Select environment</option>
            {trainingEnvironmentOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>

        <OptionButtons
          label="Equipment you can usually use"
          options={equipmentOptions}
          values={form.equipment ?? []}
          onChange={(values) => setForm((current) => ({ ...current, equipment: values }))}
        />

        <OptionButtons
          label="Limitations"
          helper="Pick the areas a future plan should respect. Add details below if needed."
          options={limitationAreas}
          values={form.injuries ?? []}
          onChange={(values) => setForm((current) => ({ ...current, injuries: values }))}
        />

        <Field label="Limitations detail">
          <textarea
            value={form.limitationsDetail ?? ""}
            onChange={(event) =>
              setForm((current) => ({ ...current, limitationsDetail: event.target.value }))
            }
            rows={4}
            placeholder="Optional: pain triggers, movements to modify, or anything a future plan should respect."
            className="w-full rounded-3xl border border-ink/10 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-coral"
          />
        </Field>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Typical days per week">
          <input
            type="range"
            min={1}
            max={7}
            value={form.daysPerWeek ?? 3}
            onChange={(event) =>
              setForm((current) => ({ ...current, daysPerWeek: Number(event.target.value) }))
            }
            className="w-full"
          />
          <span className="mt-2 block text-sm text-slate">
            {form.daysPerWeek ?? 3} days per week
          </span>
        </Field>
        <Field label="Typical session duration">
          <select
            value={form.sessionMinutes ?? 45}
            onChange={(event) =>
              setForm((current) => ({ ...current, sessionMinutes: Number(event.target.value) }))
            }
            className="w-full rounded-3xl border border-ink/10 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-coral"
          >
            {sessionLengths.map((length) => (
              <option key={length} value={length}>
                {length} minutes
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid gap-5">
        <OptionButtons
          label="Exercise preferences"
          options={exercisePreferenceOptions}
          values={form.exercisePreferences ?? []}
          onChange={(values) =>
            setForm((current) => ({ ...current, exercisePreferences: values }))
          }
        />
        <OptionButtons
          label="Exercise dislikes or hard no's"
          options={exerciseDislikeOptions}
          values={form.exerciseDislikes ?? []}
          onChange={(values) => setForm((current) => ({ ...current, exerciseDislikes: values }))}
        />
        <OptionButtons
          label="Sports or interests"
          options={sportsInterestOptions}
          values={form.sportsInterests ?? []}
          onChange={(values) => setForm((current) => ({ ...current, sportsInterests: values }))}
        />
      </div>

      <div className="flex flex-col gap-3 border-t border-ink/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || isPending}
          className="rounded-full bg-coral px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#f95a2b] disabled:opacity-60"
        >
          {saving || isPending ? "Saving..." : "Save Profile Settings"}
        </button>
        {status ? <p className="text-sm leading-6 text-slate">{status}</p> : null}
      </div>
    </div>
  );
}
