import clsx from "clsx";

type SectionCardProps = {
  title: string;
  eyebrow?: string;
  description?: string;
  compact?: boolean;
  children: React.ReactNode;
};

export function SectionCard({
  title,
  eyebrow,
  description,
  compact = false,
  children
}: SectionCardProps) {
  return (
    <section
      className={clsx(
        "rounded-[32px] border border-white/70 bg-[#fffdf9]/85 shadow-card backdrop-blur",
        compact ? "p-5" : "p-6"
      )}
    >
      {eyebrow ? (
        <p className="text-xs uppercase tracking-[0.24em] text-slate">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="mt-2 font-display text-3xl text-ink">{title}</h2>
      {description ? (
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate">
          {description}
        </p>
      ) : null}
      <div className="mt-5">{children}</div>
    </section>
  );
}

