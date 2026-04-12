import clsx from "clsx";

type ProgressBadgeProps = {
  label: string;
  tone: "green" | "gold" | "ink";
};

export function ProgressBadge({ label, tone }: ProgressBadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]",
        {
          "bg-moss/15 text-moss": tone === "green",
          "bg-gold/20 text-[#8a6400]": tone === "gold",
          "bg-ink text-white": tone === "ink"
        }
      )}
    >
      {label}
    </span>
  );
}

