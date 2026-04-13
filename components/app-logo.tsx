import clsx from "clsx";

type AppLogoProps = {
  className?: string;
  iconClassName?: string;
};

export function AppLogo({ className, iconClassName }: AppLogoProps) {
  return (
    <span className={clsx("inline-flex items-center gap-2.5 text-left sm:gap-3", className)}>
      <span
        className={clsx(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-ink text-[#fffdf9] shadow-sm sm:h-11 sm:w-11",
          iconClassName
        )}
        aria-hidden="true"
      >
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
      </span>
      <span>
        <span className="block font-display text-xl leading-none text-ink sm:text-2xl">
          Workout App
        </span>
        <span className="mt-1 block text-xs font-medium text-slate">
          Workout planner
        </span>
      </span>
    </span>
  );
}
