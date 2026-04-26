import clsx from "clsx";

type ProgressBadgeProps = {
  label: string;
  tone: "green" | "gold" | "ink" | "blue" | "coral" | "orange" | "purple";
};

export function ProgressBadge({ label, tone }: ProgressBadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em]",
        {
          "border-success/35 bg-success/15 text-copy": tone === "green",
          "border-warning/35 bg-warning/15 text-copy": tone === "gold",
          "border-transparent bg-hero text-white": tone === "ink",
          "border-goal-blue/35 bg-goal-blue/14 text-copy": tone === "blue",
          "border-goal-coral/35 bg-goal-coral/14 text-copy": tone === "coral",
          "border-goal-orange/35 bg-goal-orange/14 text-copy": tone === "orange",
          "border-goal-purple/35 bg-goal-purple/14 text-copy": tone === "purple"
        }
      )}
    >
      {label}
    </span>
  );
}
