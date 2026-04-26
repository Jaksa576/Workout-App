import clsx from "clsx";

type SurfaceCardProps = {
  children: React.ReactNode;
  className?: string;
  tone?: "default" | "soft" | "dark" | "darkElevated";
  padding?: "compact" | "default" | "comfortable";
};

const toneClasses: Record<NonNullable<SurfaceCardProps["tone"]>, string> = {
  default: "surface-card",
  soft: "surface-card-soft",
  dark: "surface-card-dark",
  darkElevated: "surface-card-dark-elevated"
};

const paddingClasses: Record<NonNullable<SurfaceCardProps["padding"]>, string> = {
  compact: "p-4 sm:p-5",
  default: "p-5 sm:p-6",
  comfortable: "p-6 sm:p-7"
};

export function SurfaceCard({
  children,
  className,
  tone = "default",
  padding = "default"
}: SurfaceCardProps) {
  return (
    <div className={clsx(toneClasses[tone], paddingClasses[padding], className)}>
      {children}
    </div>
  );
}
