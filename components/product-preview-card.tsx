import type { ReactNode } from "react";
import clsx from "clsx";
import { SurfaceCard } from "@/components/surface-card";

type ProductPreviewCardProps = {
  children: ReactNode;
  title?: string;
  eyebrow?: string;
  className?: string;
};

export function ProductPreviewCard({
  children,
  title,
  eyebrow,
  className
}: ProductPreviewCardProps) {
  return (
    <SurfaceCard tone="dark" className={clsx("overflow-hidden", className)}>
      {(eyebrow || title) ? (
        <div className="mb-4">
          {eyebrow ? <p className="ui-eyebrow text-white/60">{eyebrow}</p> : null}
          {title ? <h3 className="mt-2 text-lg font-semibold text-text-inverse">{title}</h3> : null}
        </div>
      ) : null}
      {children}
    </SurfaceCard>
  );
}
