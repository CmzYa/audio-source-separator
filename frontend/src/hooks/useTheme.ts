import { useState, useEffect, useCallback } from 'react';

/** 主题模式 */
type ThemeMode = 'dark' | 'light' | 'system';

/** 实际主题 */
type ActualTheme = 'dark' | 'light';

/**
 * 主题管理 Hook
 * 支持深色、浅色、跟随系统三种模式
 */
export function useTheme() {
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('theme_mode');
    return (saved as ThemeMode) || 'dark';
  });

  const [actualTheme, setActualTheme] = useState<ActualTheme>('dark');

  // 计算实际主题
  useEffect(() => {
    if (themeMode === 'system') {
      // 检测系统主题偏好
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const updateTheme = () => {
        setActualTheme(mediaQuery.matches ? 'dark' : 'light');
      };
      
      updateTheme();
      mediaQuery.addEventListener('change', updateTheme);
      
      return () => {
        mediaQuery.removeEventListener('change', updateTheme);
      };
    } else {
      setActualTheme(themeMode);
    }
  }, [themeMode]);

  // 保存设置
  useEffect(() => {
    localStorage.setItem('theme_mode', themeMode);
  }, [themeMode]);

  // 应用主题到 document
  useEffect(() => {
    document.documentElement.classList.remove('dark', 'light');
    document.documentElement.classList.add(actualTheme);
  }, [actualTheme]);

  /** 切换主题 */
  const toggleTheme = useCallback(() => {
    setThemeMode(prev => {
      if (prev === 'dark') return 'light';
      if (prev === 'light') return 'system';
      return 'dark';
    });
  }, []);

  /** 设置特定主题 */
  const setTheme = useCallback((mode: ThemeMode) => {
    setThemeMode(mode);
  }, []);

  return {
    themeMode,
    actualTheme,
    toggleTheme,
    setTheme,
    isDark: actualTheme === 'dark',
    isLight: actualTheme === 'light',
  };
}