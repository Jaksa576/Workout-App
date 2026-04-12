"use client";

import { useEffect, useState } from "react";
import { SectionCard } from "@/components/section-card";

export function TimerCard() {
  const [secondsLeft, setSecondsLeft] = useState(90);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running || secondsLeft <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setSecondsLeft((current) => current - 1);
    }, 1000);

    return () => window.clearInterval(timer);
  }, [running, secondsLeft]);

  const minutes = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const seconds = String(secondsLeft % 60).padStart(2, "0");

  return (
    <SectionCard
      title="Rest timer"
      eyebrow="Built in"
      description="Time your rest without leaving the workout."
    >
      <div className="rounded-[28px] bg-ink p-6 text-white">
        <p className="text-xs uppercase tracking-[0.22em] text-white/60">
          Default rest
        </p>
        <p className="mt-4 font-display text-6xl">
          {minutes}:{seconds}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={() => setRunning((current) => !current)}
            className="rounded-full bg-coral px-5 py-3 text-sm font-semibold text-white"
          >
            {running ? "Pause" : "Start"}
          </button>
          <button
            onClick={() => {
              setRunning(false);
              setSecondsLeft(90);
            }}
            className="rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white"
          >
            Reset
          </button>
        </div>
      </div>
    </SectionCard>
  );
}
