/**
 * 主题选择器组件
 * 允许用户在Write页面选择不同的信件主题
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';

export interface Theme {
  id: string;
  name: string;
  description: string;
  icon: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

export const THEMES: Theme[] = [
  {
    id: 'starry-night',
    name: '星空慢慢',
    description: '星空背景，闪烁流星',
    icon: '⭐',
    colors: {
      primary: '#1a1a2e',
      secondary: '#16213e',
      accent: '#0f3460',
    },
  },
  {
    id: 'ancient-paper',
    name: '赋古牵皮纸',
    description: '古纸纹理，呼吸感',
    icon: '📜',
    colors: {
      primary: '#f5e6d3',
      secondary: '#e8d7c3',
      accent: '#d4a574',
    },
  },
  {
    id: 'cherry-blossom',
    name: '樱花来信',
    description: '樱花飘落，微光闪动',
    icon: '🌸',
    colors: {
      primary: '#ffe4e1',
      secondary: '#ffd7e0',
      accent: '#ff69b4',
    },
  },
  {
    id: 'autumn-leaves',
    name: '秋叶来信',
    description: '落叶飘落，暖色光晕',
    icon: '🍂',
    colors: {
      primary: '#8b4513',
      secondary: '#a0522d',
      accent: '#daa520',
    },
  },
  {
    id: 'festival-lights',
    name: '节日灯火',
    description: '灯光闪烁，暖光扩散',
    icon: '🎆',
    colors: {
      primary: '#2c1810',
      secondary: '#3d2817',
      accent: '#ff6b6b',
    },
  },
];

interface ThemeSelectorProps {
  selectedTheme?: string;
  onThemeChange?: (themeId: string) => void;
  className?: string;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  selectedTheme = 'starry-night',
  onThemeChange,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const currentTheme = THEMES.find(t => t.id === selectedTheme) || THEMES[0];

  const handleThemeSelect = (themeId: string) => {
    onThemeChange?.(themeId);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      {/* 主题选择按钮 */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full justify-between"
      >
        <span>{currentTheme.icon} {currentTheme.name}</span>
        <span className="text-xs opacity-50">▼</span>
      </Button>

      {/* 主题列表 */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          {THEMES.map(theme => (
            <button
              key={theme.id}
              onClick={() => handleThemeSelect(theme.id)}
              className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                selectedTheme === theme.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{theme.icon}</span>
                <div className="flex-1">
                  <div className="font-medium">{theme.name}</div>
                  <div className="text-sm text-gray-500">{theme.description}</div>
                </div>
                {selectedTheme === theme.id && (
                  <span className="text-blue-500">✓</span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* 主题预览 */}
      <div className="mt-3 p-3 rounded-lg border border-gray-200 bg-gradient-to-br" 
           style={{
             backgroundImage: `linear-gradient(135deg, ${currentTheme.colors.primary}, ${currentTheme.colors.secondary})`,
           }}>
        <div className="text-white text-sm text-center">
          {currentTheme.name} 预览
        </div>
      </div>
    </div>
  );
};
