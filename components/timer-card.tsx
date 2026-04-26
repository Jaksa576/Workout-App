"use client";

import { useEffect, useState } from "react";
import { SectionCard } from "@/components/section-card";
import { ProductPreviewCard } from "@/components/product-preview-card";

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
      <ProductPreviewCard eyebrow="Default rest" title="Focused workout timing">
        <p className="font-display text-6xl text-text-inverse">
          {minutes}:{seconds}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={() => setRunning((current) => !current)}
            className="ui-button-primary"
          >
            {running ? "Pause" : "Start"}
          </button>
          <button
            onClick={() => {
              setRunning(false);
              setSecondsLeft(90);
            }}
            className="rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-surface-dark"
          >
            Reset
          </button>
        </div>
      </ProductPreviewCard>
    </SectionCard>
  );
}
