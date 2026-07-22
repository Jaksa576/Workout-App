export type NavigationAttentionOptions = {
  focus?: boolean;
  behavior?: ScrollBehavior;
};

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true
  );
}

export function getNavigationScrollBehavior(
  behavior: ScrollBehavior = "auto",
): ScrollBehavior {
  return behavior === "smooth" && !prefersReducedMotion() ? "smooth" : "auto";
}

function isNonInputFocusTarget(target: HTMLElement) {
  return !target.matches("input, textarea, select, button");
}

/**
 * Positions a new workflow destination or an explicitly requested target.
 * Callers choose scrolling and focus independently; focus is limited to
 * non-input landmarks/headings so it cannot summon a mobile keyboard.
 */
export function directNavigationAttention(
  target: HTMLElement | null,
  { focus = false, behavior = "auto" }: NavigationAttentionOptions = {},
) {
  if (!target) return;

  target.scrollIntoView({
    block: "start",
    inline: "nearest",
    behavior: getNavigationScrollBehavior(behavior),
  });

  if (focus && isNonInputFocusTarget(target)) {
    target.focus({ preventScroll: true });
  }
}
