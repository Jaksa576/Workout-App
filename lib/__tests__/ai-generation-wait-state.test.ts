import { describe, expect, it, vi } from "vitest";
import {
  attachGenerationNavigationWarning,
  GENERATION_LONG_RUNNING_THRESHOLD_MS,
  getGenerationWaitState
} from "@/lib/ai-generation/generation-wait-state";

describe("AI generation wait state", () => {
  it("shows an immediate elapsed state and long-running guidance after forty-five seconds", () => {
    expect(getGenerationWaitState(0)).toMatchObject({
      activityMessage: "Creating your program structure…",
      elapsedLabel: "0s",
      showLongRunningGuidance: false
    });
    expect(getGenerationWaitState(12_000)).toMatchObject({
      activityMessage: "Building workouts around your schedule…",
      elapsedLabel: "12s"
    });
    expect(getGenerationWaitState(GENERATION_LONG_RUNNING_THRESHOLD_MS)).toMatchObject({
      elapsedLabel: "45s",
      showLongRunningGuidance: true
    });
    expect(getGenerationWaitState(61_000).elapsedLabel).toBe("1:01");
  });

  it("warns only while the generation listener is attached and cleans up cleanly", () => {
    const listeners = new Map<string, EventListener>();
    const target = {
      addEventListener: vi.fn((type: string, listener: EventListener) => listeners.set(type, listener)),
      removeEventListener: vi.fn((type: string, listener: EventListener) => {
        if (listeners.get(type) === listener) listeners.delete(type);
      })
    } as unknown as Window;

    const cleanup = attachGenerationNavigationWarning(target);
    const event = {
      preventDefault: vi.fn(),
      returnValue: undefined
    } as unknown as BeforeUnloadEvent;
    listeners.get("beforeunload")?.(event);

    expect(event.preventDefault).toHaveBeenCalledOnce();
    expect(event.returnValue).toBe("");
    cleanup();
    expect(listeners.has("beforeunload")).toBe(false);
    expect(target.removeEventListener).toHaveBeenCalledOnce();
  });
});