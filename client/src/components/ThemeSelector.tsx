import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { getAllThemes, getThemeConfig, ThemeType } from "@/config/themes";

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
  const currentTheme = getThemeConfig(selectedTheme);
  const themes = getAllThemes();

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
        <span>{currentTheme.name}</span>
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
                  <span className="block font-medium text-white">{theme.name}</span>
                  <span className="block text-xs text-white/60">{theme.description}</span>
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
        className="mt-3 rounded-lg border border-white/15 p-3"
        style={{
          background: currentTheme.backgroundGradient ?? currentTheme.backgroundColor,
          color: currentTheme.textColor,
        }}
      >
        <div className="text-center text-sm font-medium">{currentTheme.name} 预览</div>
      </div>
    </div>
  );
};

export default ThemeSelector;
