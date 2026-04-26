import clsx from "clsx";
import type { ReactNode } from "react";
import { SurfaceCard } from "@/components/surface-card";

type GoalIconCardProps = {
  title: string;
  description?: string;
  tone?: "green" | "blue" | "coral" | "orange" | "purple";
  icon?: ReactNode;
  className?: string;
};

const toneClasses: Record<NonNullable<GoalIconCardProps["tone"]>, string> = {
  green: "border-goal-green/25 bg-goal-green/10",
  blue: "border-goal-blue/25 bg-goal-blue/10",
  coral: "border-goal-coral/25 bg-goal-coral/10",
  orange: "border-goal-orange/25 bg-goal-orange/10",
  purple: "border-goal-purple/25 bg-goal-purple/10"
};

const iconToneClasses: Record<NonNullable<GoalIconCardProps["tone"]>, string> = {
  green: "bg-goal-green/14 text-goal-green",
  blue: "bg-goal-blue/14 text-goal-blue",
  coral: "bg-goal-coral/14 text-goal-coral",
  orange: "bg-goal-orange/14 text-goal-orange",
  purple: "bg-goal-purple/14 text-goal-purple"
};

export function GoalIconCard({
  title,
  description,
  tone = "green",
  icon,
  className
}: GoalIconCardProps) {
  return (
    <SurfaceCard
      tone="default"
      padding="compact"
      className={clsx(toneClasses[tone], className)}
    >
      <div className="flex items-start gap-4">
        {icon ? (
          <div
            className={clsx(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl",
              iconToneClasses[tone]
            )}
          >
            {icon}
          </div>
        ) : null}
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-copy">{title}</h3>
          {description ? <p className="mt-2 text-sm leading-6 text-muted">{description}</p> : null}
        </div>
      </div>
    </SurfaceCard>
  );
}
