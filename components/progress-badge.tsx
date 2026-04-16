import clsx from "clsx";

type ProgressBadgeProps = {
  label: string;
  tone: "green" | "gold" | "ink";
};

export function ProgressBadge({ label, tone }: ProgressBadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em]",
        {
          "border-success/20 bg-success/10 text-success": tone === "green",
          "border-warning/25 bg-warning/10 text-warning": tone === "gold",
          "border-transparent bg-hero text-white": tone === "ink"
        }
      )}
    >
      {label}
    </span>
  );
}
