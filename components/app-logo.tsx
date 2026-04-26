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

  return (
    <span className={clsx("inline-flex items-center gap-2.5 text-left sm:gap-3", className)}>
      <span
        className={clsx(
          "flex shrink-0 items-center justify-center overflow-hidden rounded-2xl shadow-sm",
          "h-10 w-10 sm:h-11 sm:w-11",
          iconClassName
        )}
        aria-hidden="true"
      >
        <img
          src="/icon-192.png"
          alt=""
          className="h-full w-full object-cover"
          width="44"
          height="44"
          decoding="async"
        />
      </span>
      {!markOnly ? (
      <span>
        <span
          className={clsx(
            "block font-black uppercase leading-none tracking-[0.12em] text-copy",
            compact ? "text-sm sm:text-base" : "text-base sm:text-lg"
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
