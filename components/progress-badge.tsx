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
          "border-success/35 bg-success/15 text-copy": tone === "green",
          "border-warning/35 bg-warning/15 text-copy": tone === "gold",
          "border-transparent bg-hero text-white": tone === "ink"
        }
      )}
    >
      {label}
    </span>
  );
}
