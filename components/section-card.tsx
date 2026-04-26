import clsx from "clsx";
import { SurfaceCard } from "@/components/surface-card";

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
    <section>
      <SurfaceCard
        className={clsx("h-full")}
        padding={compact ? "compact" : "default"}
      >
      {eyebrow ? (
        <p className="ui-eyebrow">{eyebrow}</p>
      ) : null}
      <h2 className="mt-2 font-display text-2xl leading-tight text-copy sm:text-3xl">{title}</h2>
      {description ? (
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">{description}</p>
      ) : null}
      <div className="mt-5">{children}</div>
      </SurfaceCard>
    </section>
  );
}
