import { describe, expect, it } from "vitest";
import { pageTranslations } from "./page-translations";
import type { Language } from "@/contexts/LanguageContext";
import { getAllThemes } from "@/config/themes";

const languages: Language[] = ["zh", "en", "ja", "ko"];
const themeKeys = ["starry", "kraft", "cherry", "autumn", "festive"] as const;
const emotionKeys = ["伤心", "失落", "焦虑", "愤怒", "困惑", "委屈", "疲惫", "平静"] as const;

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
      expect(Object.keys(pageTranslations[language].write.emotionTags)).toEqual(expect.arrayContaining(emotionKeys));
      expect(pageTranslations[language].write.share.title).toBeTruthy();
      expect(pageTranslations[language].write.share.text).toBeTruthy();
      expect(pageTranslations[language].write.share.close).toBeTruthy();
    }
  });

  it("keeps the five configured themes aligned with the translation keys", () => {
    expect(getAllThemes()).toHaveLength(themeKeys.length);
  });
});
