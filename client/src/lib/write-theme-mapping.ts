import { ThemeType } from "@/config/themes";

export type BackgroundType = "星空漫漫" | "牛皮纸" | "樱花来信" | "秋日落信" | "节日灯火";

export const THEME_TO_BACKGROUND: Record<ThemeType, BackgroundType> = {
  "starry-night": "星空漫漫",
  "vintage-kraft": "牛皮纸",
  "cherry-blossom": "樱花来信",
  "autumn-leaves": "秋日落信",
  "festive-lights": "节日灯火",
};

export const BACKGROUND_TO_THEME: Record<BackgroundType, ThemeType> = Object.entries(THEME_TO_BACKGROUND).reduce(
  (mapping, [themeId, background]) => {
    mapping[background as BackgroundType] = themeId as ThemeType;
    return mapping;
  },
  {} as Record<BackgroundType, ThemeType>,
);
