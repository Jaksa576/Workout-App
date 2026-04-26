import clsx from "clsx";
import type { ReactNode } from "react";
import { SurfaceCard } from "@/components/surface-card";

type MetricCardProps = {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  tone?: "default" | "success" | "secondary" | "dark";
  icon?: ReactNode;
  className?: string;
};

const toneClasses: Record<NonNullable<MetricCardProps["tone"]>, string> = {
  default: "",
  success: "border-success/25 bg-success/8",
  secondary: "border-secondary/25 bg-secondary/8",
  dark: ""
};

export function MetricCard({
  label,
  value,
  detail,
  tone = "default",
  icon,
  className
}: MetricCardProps) {
  const isDark = tone === "dark";

  return (
    <SurfaceCard
      tone={isDark ? "dark" : "default"}
      className={clsx(!isDark && toneClasses[tone], className)}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className={clsx("ui-eyebrow", isDark && "text-white/65")}>{label}</p>
          <p className={clsx("mt-3 text-2xl font-semibold", isDark ? "text-text-inverse" : "text-copy")}>
            {value}
          </p>
        </div>
        {icon ? <div className={clsx("shrink-0", isDark ? "text-white/80" : "text-secondary")}>{icon}</div> : null}
      </div>
      {detail ? (
        <p className={clsx("mt-2 text-sm leading-6", isDark ? "text-white/72" : "text-muted")}>{detail}</p>
      ) : null}
    </SurfaceCard>
  );
}
