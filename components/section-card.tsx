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
        "rounded-[24px] border border-white/70 bg-[#fffdf9]/85 shadow-card backdrop-blur sm:rounded-[32px]",
        compact ? "p-4 sm:p-5" : "p-5 sm:p-6"
      )}
    >
      {eyebrow ? (
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate sm:tracking-[0.22em]">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="mt-2 font-display text-2xl leading-tight text-ink sm:text-3xl">{title}</h2>
      {description ? (
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate">
          {description}
        </p>
      ) : null}
      <div className="mt-5">{children}</div>
    </section>
  );
}
