import clsx from "clsx";
import type { ReactNode } from "react";

type LandingSectionProps = {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
};

export function LandingSection({
  children,
  className,
  contentClassName
}: LandingSectionProps) {
  return (
    <section className={clsx("px-4 py-10 sm:px-6 sm:py-14 lg:px-8", className)}>
      <div className={clsx("mx-auto max-w-6xl", contentClassName)}>{children}</div>
    </section>
  );
}
