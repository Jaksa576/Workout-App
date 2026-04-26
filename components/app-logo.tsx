import clsx from "clsx";

type AppLogoProps = {
  className?: string;
  iconClassName?: string;
  variant?: "default" | "mark" | "appIconReady";
  compact?: boolean;
  showTagline?: boolean;
};

export function AppLogo({
  className,
  iconClassName,
  variant = "default",
  compact = false,
  showTagline = true
}: AppLogoProps) {
  const markOnly = variant === "mark";
  const appIconReady = variant === "appIconReady";

  return (
    <span className={clsx("inline-flex items-center gap-2.5 text-left sm:gap-3", className)}>
      <span
        className={clsx(
          "flex shrink-0 items-center justify-center rounded-2xl shadow-sm",
          appIconReady
            ? "h-10 w-10 bg-surface-dark text-text-inverse sm:h-11 sm:w-11"
            : "h-10 w-10 bg-hero text-white sm:h-11 sm:w-11",
          iconClassName
        )}
        aria-hidden="true"
      >
        {appIconReady ? (
          <svg
            viewBox="0 0 48 48"
            className="h-7 w-7 sm:h-8 sm:w-8"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M14 36L24 12L34 36"
              stroke="rgb(var(--color-goal-green))"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M18 27H30"
              stroke="rgb(var(--color-secondary))"
              strokeWidth="4.5"
              strokeLinecap="round"
            />
            <path
              d="M15 27H18M30 27H33"
              stroke="rgb(var(--color-secondary))"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
        ) : (
          <svg
            viewBox="0 0 48 48"
            className="h-7 w-7 sm:h-8 sm:w-8"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect x="10" y="11" width="28" height="27" rx="6" stroke="currentColor" strokeWidth="3" />
            <path d="M16 18h16" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            <path d="M17 8v7M31 8v7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            <path d="M15 29h4M29 29h4" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            <path d="M20 29h8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
          </svg>
        )}
      </span>
      {!markOnly ? (
      <span>
        <span
          className={clsx(
            "block font-display leading-none text-copy",
            compact ? "text-lg sm:text-xl" : "text-xl sm:text-2xl"
          )}
        >
          Adaptive Training
        </span>
        {showTagline ? (
          <span className="mt-1 block text-xs font-medium text-muted">
            Structured plans that progress with you.
          </span>
        ) : null}
      </span>
      ) : null}
    </span>
  );
}
