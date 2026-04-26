import clsx from "clsx";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

type LandingSectionProps = {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
} & Omit<ComponentPropsWithoutRef<"section">, "children" | "className">;

export function LandingSection({
  children,
  className,
  contentClassName,
  ...props
}: LandingSectionProps) {
  return (
    <section className={clsx("px-4 py-10 sm:px-6 sm:py-14 lg:px-8", className)} {...props}>
      <div className={clsx("mx-auto max-w-6xl", contentClassName)}>{children}</div>
    </section>
  );
}
