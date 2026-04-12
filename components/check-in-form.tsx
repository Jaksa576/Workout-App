"use client";

import { useState } from "react";
import { generateRecommendation } from "@/lib/recommendation";

const effortOptions = ["Too easy", "Appropriate", "Too hard"] as const;

export function CheckInForm() {
  const [completed, setCompleted] = useState(true);
  const [pain, setPain] = useState(false);
  const [effort, setEffort] = useState<(typeof effortOptions)[number]>(
    "Appropriate"
  );
  const [notes, setNotes] = useState("");

  const recommendation = generateRecommendation({
    completed,
    pain,
    effort
  });

  return (
    <form className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <fieldset className="rounded-3xl bg-white/70 p-4">
          <legend className="text-sm font-semibold text-ink">
            Workout completed?
          </legend>
          <div className="mt-4 flex gap-3">
            {[
              { label: "Yes", value: true },
              { label: "No", value: false }
            ].map((option) => (
              <button
                key={option.label}
                type="button"
                onClick={() => setCompleted(option.value)}
                className={`rounded-full px-4 py-2 text-sm font-semibold ${
                  completed === option.value
                    ? "bg-ink text-white"
                    : "bg-mist text-slate"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="rounded-3xl bg-white/70 p-4">
          <legend className="text-sm font-semibold text-ink">
            Did pain occur?
          </legend>
          <div className="mt-4 flex gap-3">
            {[
              { label: "No pain", value: false },
              { label: "Yes", value: true }
            ].map((option) => (
              <button
                key={option.label}
                type="button"
                onClick={() => setPain(option.value)}
                className={`rounded-full px-4 py-2 text-sm font-semibold ${
                  pain === option.value
                    ? "bg-ink text-white"
                    : "bg-mist text-slate"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      <fieldset className="rounded-3xl bg-white/70 p-4">
        <legend className="text-sm font-semibold text-ink">
          Session difficulty
        </legend>
        <div className="mt-4 flex flex-wrap gap-3">
          {effortOptions.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setEffort(option)}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                effort === option ? "bg-coral text-white" : "bg-mist text-slate"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </fieldset>

      <label className="block rounded-3xl bg-white/70 p-4">
        <span className="text-sm font-semibold text-ink">Notes</span>
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          rows={5}
          placeholder="Anything worth remembering for the next session?"
          className="mt-3 w-full rounded-3xl border border-ink/10 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-coral"
        />
      </label>

      <div className="rounded-[28px] border border-coral/20 bg-coral/10 p-5">
        <p className="text-xs uppercase tracking-[0.22em] text-coral">
          Recommendation
        </p>
        <p className="mt-3 text-lg font-semibold text-ink">
          {recommendation.title}
        </p>
        <p className="mt-2 text-sm leading-6 text-slate">
          {recommendation.description}
        </p>
      </div>

      <button className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white">
        Save session response
      </button>
    </form>
  );
}

