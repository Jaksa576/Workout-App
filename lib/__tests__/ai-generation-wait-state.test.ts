import { describe, expect, it, vi } from "vitest";
import {
  attachGenerationNavigationWarning,
  GENERATION_LONG_RUNNING_THRESHOLD_MS,
  getGenerationWaitState
} from "@/lib/ai-generation/generation-wait-state";

describe("AI generation wait state", () => {
  it("shows an immediate elapsed state and long-running guidance after forty-five seconds", () => {
    expect(getGenerationWaitState(0)).toMatchObject({
      activityMessage: "Creating your program structure\u2026",
      elapsedLabel: "0s",
      showLongRunningGuidance: false
    });
    expect(getGenerationWaitState(12_000)).toMatchObject({
      activityMessage: "Building workouts around your schedule\u2026",
      elapsedLabel: "12s"
    });
    expect(getGenerationWaitState(GENERATION_LONG_RUNNING_THRESHOLD_MS)).toMatchObject({
      elapsedLabel: "45s",
      showLongRunningGuidance: true
    });
    expect(getGenerationWaitState(61_000).elapsedLabel).toBe("1:01");
  });

  it("warns only while generation is active and removes both listeners on cleanup", () => {
    const windowListeners = new Map<string, EventListener>();
    const documentListeners = new Map<string, EventListener>();
    const target = {
      addEventListener: vi.fn((type: string, listener: EventListener) => windowListeners.set(type, listener)),
      removeEventListener: vi.fn((type: string, listener: EventListener) => {
        if (windowListeners.get(type) === listener) windowListeners.delete(type);
      }),
      confirm: vi.fn(() => false),
      location: { origin: "https://example.test", assign: vi.fn() }
    } as unknown as Window;
    const documentTarget = {
      addEventListener: vi.fn((type: string, listener: EventListener) => documentListeners.set(type, listener)),
      removeEventListener: vi.fn((type: string, listener: EventListener) => {
        if (documentListeners.get(type) === listener) documentListeners.delete(type);
      })
    } as unknown as Document;

    const cleanup = attachGenerationNavigationWarning(target, documentTarget);
    const unloadEvent = {
      preventDefault: vi.fn(),
      returnValue: undefined
    } as unknown as BeforeUnloadEvent;
    windowListeners.get("beforeunload")?.(unloadEvent);

    expect(unloadEvent.preventDefault).toHaveBeenCalledOnce();
    expect(unloadEvent.returnValue).toBe("");
    cleanup();
    expect(windowListeners.has("beforeunload")).toBe(false);
    expect(documentListeners.has("click")).toBe(false);
    expect(target.removeEventListener).toHaveBeenCalledOnce();
    expect(documentTarget.removeEventListener).toHaveBeenCalledOnce();
  });

  it("confirms same-origin shell navigation while a draft is generating", () => {
    const documentListeners = new Map<string, EventListener>();
    const target = {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      confirm: vi.fn(() => true),
      location: { origin: "https://example.test", assign: vi.fn() }
    } as unknown as Window;
    const documentTarget = {
      addEventListener: vi.fn((type: string, listener: EventListener) => documentListeners.set(type, listener)),
      removeEventListener: vi.fn()
    } as unknown as Document;
    const link = {
      origin: "https://example.test",
      target: "",
      href: "https://example.test/plans",
      hasAttribute: vi.fn(() => false)
    };
    const clickEvent = {
      defaultPrevented: false,
      button: 0,
      metaKey: false,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      target: { closest: vi.fn(() => link) },
      preventDefault: vi.fn()
    } as unknown as MouseEvent;

    attachGenerationNavigationWarning(target, documentTarget);
    documentListeners.get("click")?.(clickEvent);

    expect(target.confirm).toHaveBeenCalledOnce();
    expect(clickEvent.preventDefault).toHaveBeenCalledOnce();
    expect(target.location.assign).toHaveBeenCalledWith("https://example.test/plans");
  });
});