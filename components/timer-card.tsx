"use client";

import { useEffect, useState } from "react";
import { ProductPreviewCard } from "@/components/product-preview-card";
import { SurfaceCard } from "@/components/surface-card";

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
    <SurfaceCard className="h-full">
      <p className="ui-eyebrow">Built in</p>
      <h2 className="mt-2 text-2xl font-black leading-tight text-copy">Rest timer</h2>
      <p className="mt-3 text-sm leading-6 text-muted">
        Time your rest without leaving the workout.
      </p>
      <div className="mt-5">
      <ProductPreviewCard eyebrow="Default rest" title="Focused workout timing">
        <p className="text-6xl font-black text-text-inverse">
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
      </div>
    </SurfaceCard>
  );
}
