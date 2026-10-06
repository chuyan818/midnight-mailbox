import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const animationCss = readFileSync(new URL("../styles/theme-animations.css", import.meta.url), "utf8");
const writePage = readFileSync(new URL("../pages/Write.tsx", import.meta.url), "utf8");

describe("theme browser and responsive safeguards", () => {
  it("provides reduced-motion and GPU-friendly fallbacks", () => {
    expect(animationCss).toContain("prefers-reduced-motion: reduce");
    expect(animationCss).toContain("will-change: transform");
    expect(animationCss).toContain("backface-visibility: hidden");
  });

  it("keeps the writing layout mobile-first and non-interactive for decorations", () => {
    expect(writePage).toContain("grid-cols-1 lg:grid-cols-3");
    expect(writePage).toContain("pointer-events-none");
    expect(writePage).toContain("prefers-reduced-motion");
  });
});
