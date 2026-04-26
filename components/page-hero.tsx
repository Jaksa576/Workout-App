import clsx from "clsx";
import type { ReactNode } from "react";
import { SurfaceCard } from "@/components/surface-card";

type PageHeroProps = {
  eyebrow: string;
  title: string;
  description?: string;
  tone?: "default" | "secondary";
  badges?: ReactNode;
  actions?: ReactNode;
  aside?: ReactNode;
};

export function PageHero({
  eyebrow,
  title,
  description,
  tone = "default",
  badges,
  actions,
  aside
}: PageHeroProps) {
  const isSecondary = tone === "secondary";

  return (
    <section>
      <SurfaceCard
        tone={isSecondary ? "soft" : "default"}
        className="rounded-[28px] sm:rounded-[36px]"
      >
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <div>
          <p className="ui-eyebrow">{eyebrow}</p>
          <h1 className="mt-3 font-display text-3xl leading-tight text-copy sm:text-4xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">{description}</p>
          ) : null}
          {badges ? <div className="mt-4 flex flex-wrap items-center gap-2">{badges}</div> : null}
          {actions ? <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">{actions}</div> : null}
        </div>
        {aside ? <div className="surface-panel">{aside}</div> : null}
      </div>
      </SurfaceCard>
    </section>
  );
}
