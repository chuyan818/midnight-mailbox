/**
 * Write Themes Configuration
 * 5个写信主题的完整配置系统
 */

export type ThemeType = 'starry-night' | 'vintage-kraft' | 'cherry-blossom' | 'autumn-leaves' | 'festive-lights';

export interface ThemeConfig {
  id: ThemeType;
  name: string;
  description: string;
  backgroundColor: string;
  backgroundGradient?: string;
  textColor: string;
  accentColor: string;
  animations: {
    primary: string;
    secondary?: string;
    tertiary?: string;
  };
  cssVariables: Record<string, string>;
}

/**
 * 主题配置映射
 */
export const THEMES: Record<ThemeType, ThemeConfig> = {
  'starry-night': {
    id: 'starry-night',
    name: '星空慢慢',
    description: '深蓝色夜空，星星闪烁，流星划过',
    backgroundColor: '#0a1628',
    backgroundGradient: 'linear-gradient(135deg, #0a1628 0%, #0d0f1a 100%)',
    textColor: '#e8e8f0',
    accentColor: '#ffd700',
    animations: {
      primary: 'star-twinkle',
      secondary: 'meteor-fall',
      tertiary: 'sky-drift',
    },
    cssVariables: {
      '--starry-bg': '#0a1628',
      '--starry-star-color': '#ffffff',
      '--starry-star-opacity-min': '0.6',
      '--starry-star-opacity-max': '1',
      '--starry-twinkle-duration': '3s',
      '--starry-meteor-duration': '1.2s',
      '--starry-meteor-interval': '10s',
      '--starry-drift-duration': '15s',
    },
  },
  'vintage-kraft': {
    id: 'vintage-kraft',
    name: '复古牛皮纸',
    description: '浅棕色纸张纹理，温暖怀旧感',
    backgroundColor: '#d4a574',
    backgroundGradient: 'linear-gradient(135deg, #d4a574 0%, #c9945a 100%)',
    textColor: '#3d2817',
    accentColor: '#8b6f47',
    animations: {
      primary: 'paper-breathe',
      secondary: 'texture-float',
    },
    cssVariables: {
      '--kraft-bg': '#d4a574',
      '--kraft-texture-opacity': '0.15',
      '--kraft-breathe-duration': '6s',
      '--kraft-breathe-intensity': '0.02',
      '--kraft-float-duration': '10s',
      '--kraft-float-distance': '2px',
    },
  },
  'cherry-blossom': {
    id: 'cherry-blossom',
    name: '樱花来信',
    description: '浅粉色背景，樱花飘落，柔和浪漫',
    backgroundColor: '#fce4ec',
    backgroundGradient: 'linear-gradient(135deg, #fce4ec 0%, #f8bbd0 100%)',
    textColor: '#880e4f',
    accentColor: '#e91e63',
    animations: {
      primary: 'petal-fall',
      secondary: 'soft-glow',
    },
    cssVariables: {
      '--cherry-bg': '#fce4ec',
      '--cherry-petal-color': '#ff69b4',
      '--cherry-petal-duration': '5s',
      '--cherry-petal-count': '4',
      '--cherry-petal-opacity-min': '0.7',
      '--cherry-petal-opacity-max': '1',
      '--cherry-glow-duration': '8s',
    },
  },
  'autumn-leaves': {
    id: 'autumn-leaves',
    name: '秋叶来信',
    description: '橙黄色背景，落叶飘落，温暖情绪',
    backgroundColor: '#fff3e0',
    backgroundGradient: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)',
    textColor: '#e65100',
    accentColor: '#ff6f00',
    animations: {
      primary: 'leaf-fall',
      secondary: 'warm-glow',
    },
    cssVariables: {
      '--autumn-bg': '#fff3e0',
      '--autumn-leaf-color': '#ff9800',
      '--autumn-leaf-duration': '6s',
      '--autumn-leaf-count': '3',
      '--autumn-leaf-rotation': '360deg',
      '--autumn-glow-duration': '12s',
    },
  },
  'festive-lights': {
    id: 'festive-lights',
    name: '节日灯火',
    description: '温暖红/黄背景，灯光闪烁，节日氛围',
    backgroundColor: '#fff8e1',
    backgroundGradient: 'linear-gradient(135deg, #fff8e1 0%, #ffe082 100%)',
    textColor: '#f57f17',
    accentColor: '#fbc02d',
    animations: {
      primary: 'light-flicker',
      secondary: 'lantern-sway',
      tertiary: 'warm-glow',
    },
    cssVariables: {
      '--festive-bg': '#fff8e1',
      '--festive-light-color': '#ffeb3b',
      '--festive-light-duration': '2.5s',
      '--festive-light-intensity-min': '0.8',
      '--festive-light-intensity-max': '1',
      '--festive-lantern-duration': '4s',
      '--festive-lantern-angle': '5deg',
      '--festive-glow-duration': '10s',
    },
  },
};

/**
 * 获取主题配置
 */
export function getThemeConfig(themeId: ThemeType): ThemeConfig {
  return THEMES[themeId];
}

/**
 * 获取所有主题列表
 */
export function getAllThemes(): ThemeConfig[] {
  return Object.values(THEMES);
}

/**
 * 应用主题到DOM
 */
export function applyTheme(themeId: ThemeType, element: HTMLElement) {
  const theme = getThemeConfig(themeId);
  
  // 应用背景
  element.style.background = theme.backgroundGradient || theme.backgroundColor;
  element.style.color = theme.textColor;
  
  // 应用CSS变量
  Object.entries(theme.cssVariables).forEach(([key, value]) => {
    element.style.setProperty(key, value);
  });
  
  // 添加主题类名
  element.className = element.className.replace(/theme-[a-z0-9-]+/g, '');
  element.classList.add(`theme-${themeId}`);
}

/**
 * 移除主题
 */
export function removeTheme(element: HTMLElement) {
  element.className = element.className.replace(/theme-[a-z0-9-]+/g, '');
  element.style.background = '';
  element.style.color = '';
}
