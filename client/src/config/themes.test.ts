import { describe, expect, it } from "vitest";
import { getAllThemes, getThemeConfig, THEMES } from "./themes";

describe("write themes", () => {
  it("defines five complete themes", () => {
    const themes = getAllThemes();
    expect(themes).toHaveLength(5);
    expect(themes.map((theme) => theme.id)).toEqual([
      "starry-night",
      "vintage-kraft",
      "cherry-blossom",
      "autumn-leaves",
      "festive-lights",
    ]);
    themes.forEach((theme) => {
      expect(theme.name).toBeTruthy();
      expect(theme.backgroundColor).toMatch(/^#/);
      expect(theme.animations.primary).toBeTruthy();
      expect(Object.keys(theme.cssVariables).length).toBeGreaterThan(0);
    });
  });

  it("returns stable configuration objects by theme id", () => {
    expect(getThemeConfig("starry-night")).toBe(THEMES["starry-night"]);
    expect(getThemeConfig("festive-lights").animations.tertiary).toBe("warm-glow");
  });
});
