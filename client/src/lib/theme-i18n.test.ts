import { describe, expect, it } from "vitest";
import { pageTranslations } from "./page-translations";
import type { Language } from "@/contexts/LanguageContext";
import { getAllThemes } from "@/config/themes";

const languages: Language[] = ["zh", "en", "ja", "ko"];
const themeKeys = ["starry", "kraft", "cherry", "autumn", "festive"] as const;

describe("theme translations", () => {
  it("provides names, descriptions, and animation descriptions for every theme", () => {
    for (const language of languages) {
      const themes = pageTranslations[language].write.themes;
      expect(Object.keys(themes)).toEqual(expect.arrayContaining([
        ...themeKeys,
        "themeDescriptions",
        "animationDescriptions",
        "themePreview",
      ]));
      for (const key of themeKeys) {
        expect(themes[key]).toBeTruthy();
        expect(themes.themeDescriptions[key]).toBeTruthy();
        expect(themes.animationDescriptions[key]).toBeTruthy();
      }
      expect(themes.themePreview).toBeTruthy();
    }
  });

  it("keeps the five configured themes aligned with the translation keys", () => {
    expect(getAllThemes()).toHaveLength(themeKeys.length);
  });
});
