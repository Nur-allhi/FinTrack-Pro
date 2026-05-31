import { useEffect } from 'react';
import { cacheService } from '../services/cacheService';

interface ThemeSettings {
  darkMode: boolean;
  darkModeStyle: string;
  fontSize: string;
  accentColor: string;
}

const defaultTypeColors: Record<string, string> = {
  cash: '#10B981', bank: '#0052FF', mobile: '#8B5CF6',
  investment: '#F59E0B', purpose: '#EC4899', home_exp: '#EF4444',
};

const darkBgMap: Record<string, string> = {
  dark: '#0a0b0d',
  'dark-dim': '#1a1c23',
  'dark-night': '#000000',
};

export function useThemeEffects(settings: ThemeSettings) {
  useEffect(() => {
    document.documentElement.classList.remove('dark', 'dark-dim', 'dark-night');
    if (settings.darkMode) {
      document.documentElement.classList.add(settings.darkModeStyle);
    }
    localStorage.setItem('fintrack_dark', settings.darkMode ? '1' : '0');
    localStorage.setItem('fintrack_dark_style', settings.darkMode ? settings.darkModeStyle : '');

    document.documentElement.style.backgroundColor = settings.darkMode
      ? darkBgMap[settings.darkModeStyle] || '#0a0b0d'
      : '#ffffff';
  }, [settings.darkMode, settings.darkModeStyle]);

  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]');
    meta?.setAttribute('content', settings.darkMode
      ? darkBgMap[settings.darkModeStyle] || '#0a0b0d'
      : settings.accentColor);
  }, [settings.darkMode, settings.darkModeStyle, settings.accentColor]);

  useEffect(() => {
    const hex = settings.accentColor;
    document.documentElement.style.setProperty('--color-primary', hex);

    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const darken = (c: number) => Math.max(0, c - 25);
    const lighten = (c: number) => Math.min(255, c + 40);
    const active = `#${darken(r).toString(16).padStart(2, '0')}${darken(g).toString(16).padStart(2, '0')}${darken(b).toString(16).padStart(2, '0')}`;
    const disabled = `#${lighten(r).toString(16).padStart(2, '0')}${lighten(g).toString(16).padStart(2, '0')}${lighten(b).toString(16).padStart(2, '0')}`;
    document.documentElement.style.setProperty('--color-primary-active', active);
    document.documentElement.style.setProperty('--color-primary-disabled', disabled);
  }, [settings.accentColor]);

  useEffect(() => {
    const sizes: Record<string, string> = { small: '14px', normal: '16px', large: '18px' };
    document.documentElement.style.fontSize = sizes[settings.fontSize] || '16px';
  }, [settings.fontSize]);
}
