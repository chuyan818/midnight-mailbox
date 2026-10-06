import { describe, expect, it } from "vitest";
import { BACKGROUND_TO_THEME, THEME_TO_BACKGROUND } from "./write-theme-mapping";

describe("Write theme mapping", () => {
  it("keeps every selectable theme connected to one background", () => {
    expect(Object.keys(THEME_TO_BACKGROUND)).toHaveLength(5);
    expect(new Set(Object.values(THEME_TO_BACKGROUND)).size).toBe(5);
    Object.entries(THEME_TO_BACKGROUND).forEach(([themeId, background]) => {
      expect(BACKGROUND_TO_THEME[background]).toBe(themeId);
    });
  });
});
