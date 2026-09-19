import { describe, expect, it } from "vitest";
import { THEME_ELEMENT_LIMITS, THEME_FRAME_INTERVAL_MS } from "./theme-performance";

describe("theme performance policy", () => {
  it("caps simultaneous animated elements for mobile devices", () => {
    expect(THEME_ELEMENT_LIMITS.stars).toBeLessThanOrEqual(20);
    expect(THEME_ELEMENT_LIMITS.petals).toBeLessThanOrEqual(6);
    expect(THEME_ELEMENT_LIMITS.leaves).toBeLessThanOrEqual(5);
    expect(THEME_ELEMENT_LIMITS.lanterns).toBeLessThanOrEqual(8);
  });

  it("targets a 30fps frame interval", () => {
    expect(THEME_FRAME_INTERVAL_MS).toBeCloseTo(33.333, 2);
  });
});
