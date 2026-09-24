import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { getAllThemes, getThemeConfig, ThemeType } from "@/config/themes";
import { useLanguage } from "@/contexts/LanguageContext";
import { pageTranslations } from "@/lib/page-translations";

interface ThemeSelectorProps {
  selectedTheme?: ThemeType;
  onThemeChange?: (themeId: ThemeType) => void;
  className?: string;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  selectedTheme = "starry-night",
  onThemeChange,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { language } = useLanguage();
  const copy = pageTranslations[language].write;
  const currentTheme = getThemeConfig(selectedTheme);
  const themes = getAllThemes();
  const themeKey = (themeId: ThemeType) => ({
    "starry-night": "starry",
    "vintage-kraft": "kraft",
    "cherry-blossom": "cherry",
    "autumn-leaves": "autumn",
    "festive-lights": "festive",
  } as const)[themeId];
  const localizedName = (themeId: ThemeType) => copy.themes[themeKey(themeId)];
  const localizedDescription = (themeId: ThemeType) => copy.themes.themeDescriptions[themeKey(themeId)];
  const localizedAnimation = (themeId: ThemeType) => copy.themes.animationDescriptions[themeKey(themeId)];

  const renderPreviewElements = () => {
    switch (selectedTheme) {
      case "starry-night":
        return Array.from({ length: 8 }, (_, index) => (
          <span key={`star-${index}`} className="star" style={{ left: `${10 + index * 11}%`, top: `${18 + (index % 3) * 25}%`, animationDelay: `${index * 0.35}s` }} />
        ));
      case "vintage-kraft":
        return <span className="texture-layer" />;
      case "cherry-blossom":
        return (
          <>
            <span className="glow-layer" />
            {Array.from({ length: 5 }, (_, index) => (
              <span key={`petal-${index}`} className="petal" style={{ left: `${12 + index * 18}%`, animationDelay: `${index * 0.7}s` }} />
            ))}
          </>
        );
      case "autumn-leaves":
        return (
          <>
            <span className="warm-layer" />
            {Array.from({ length: 5 }, (_, index) => (
              <span key={`leaf-${index}`} className="leaf" style={{ left: `${10 + index * 18}%`, animationDelay: `${index * 0.65}s` }} />
            ))}
          </>
        );
      case "festive-lights":
        return (
          <>
            <span className="glow" />
            {Array.from({ length: 5 }, (_, index) => (
              <span key={`light-${index}`} className="light" style={{ left: `${12 + index * 18}%`, top: `${22 + (index % 2) * 24}%`, animationDelay: `${index * 0.35}s` }} />
            ))}
            <span className="lantern" style={{ left: "22%", top: "18%" }} />
            <span className="lantern" style={{ left: "68%", top: "42%", animationDelay: "0.8s" }} />
          </>
        );
    }
  };

  const handleThemeSelect = (themeId: ThemeType) => {
    onThemeChange?.(themeId);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        className="w-full justify-between border-white/20 bg-white/5 text-white hover:bg-white/10"
      >
        <span>{localizedName(selectedTheme)}</span>
        <span aria-hidden="true" className="text-xs opacity-70">
          {isOpen ? "▲" : "▼"}
        </span>
      </Button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 overflow-hidden rounded-lg border border-white/15 bg-[#151a3d] shadow-xl z-50">
          {themes.map((theme) => (
            <button
              type="button"
              key={theme.id}
              onClick={() => handleThemeSelect(theme.id)}
              className={`w-full px-4 py-3 text-left transition-colors hover:bg-white/10 ${
                selectedTheme === theme.id ? "bg-white/10" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className="h-8 w-8 shrink-0 rounded-full border border-white/20"
                  style={{ background: theme.backgroundGradient ?? theme.backgroundColor }}
                />
                <span className="min-w-0 flex-1">
                  <span className="block font-medium text-white">{localizedName(theme.id)}</span>
                  <span className="block text-xs text-white/60">{localizedDescription(theme.id)}</span>
                  <span className="block text-[11px] text-white/45">{localizedAnimation(theme.id)}</span>
                </span>
                {selectedTheme === theme.id && (
                  <span className="text-[#FFD580]" aria-label="已选择">✓</span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      <div
        className={`mt-3 rounded-lg border border-white/15 p-3 theme-preview-art theme-${currentTheme.id}`}
        style={{
          background: currentTheme.backgroundGradient ?? currentTheme.backgroundColor,
          color: currentTheme.textColor,
        }}
      >
        {renderPreviewElements()}
        <div className="text-center text-sm font-medium">{localizedName(selectedTheme)} · {copy.themes.themePreview}</div>
      </div>
    </div>
  );
};

export default ThemeSelector;
