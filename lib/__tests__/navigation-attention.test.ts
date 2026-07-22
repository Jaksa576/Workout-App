import { afterEach, describe, expect, it, vi } from "vitest";
import {
  directNavigationAttention,
  getNavigationScrollBehavior,
} from "@/lib/navigation-attention";

const originalWindow = globalThis.window;

afterEach(() => {
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: originalWindow,
  });
  vi.restoreAllMocks();
});

function mockWindow(reducedMotion: boolean) {
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      matchMedia: vi.fn(() => ({ matches: reducedMotion })),
    },
  });
}

function target(tagName = "H1") {
  return {
    matches: vi.fn((selector: string) => selector.includes(tagName.toLowerCase())),
    scrollIntoView: vi.fn(),
    focus: vi.fn(),
  } as unknown as HTMLElement;
}

describe("navigation attention", () => {
  it("positions a workflow destination and focuses a meaningful heading", () => {
    mockWindow(false);
    const heading = target();

    directNavigationAttention(heading, { focus: true });

    expect(heading.scrollIntoView).toHaveBeenCalledWith({
      block: "start", inline: "nearest", behavior: "auto",
    });
    expect(heading.focus).toHaveBeenCalledWith({ preventScroll: true });
  });

  it("removes smooth scrolling when reduced motion is requested", () => {
    mockWindow(true);
    expect(getNavigationScrollBehavior("smooth")).toBe("auto");
  });

  it("supports explicit targets without requiring focus", () => {
    mockWindow(false);
    const card = target("ARTICLE");
    directNavigationAttention(card, { behavior: "smooth" });
    expect(card.scrollIntoView).toHaveBeenCalledWith({
      block: "start", inline: "nearest", behavior: "smooth",
    });
    expect(card.focus).not.toHaveBeenCalled();
  });

  it("never automatically focuses an ordinary input", () => {
    mockWindow(false);
    const input = target("INPUT");
    directNavigationAttention(input, { focus: true });
    expect(input.focus).not.toHaveBeenCalled();
  });
});
