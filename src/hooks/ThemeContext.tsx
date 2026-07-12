/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type ColorMode = 'light' | 'dark' | 'system';
export type ThemePalette = 'cream' | 'mint' | 'sunset' | 'sand';

export const COLOR_MODE_STORAGE_KEY = 'maplehub-color-mode';
export const THEME_PALETTE_STORAGE_KEY = 'maplehub-theme';

const colorModes: readonly ColorMode[] = ['light', 'dark', 'system'];
const palettes: readonly ThemePalette[] = ['cream', 'mint', 'sunset', 'sand'];

const isColorMode = (value: string | null): value is ColorMode =>
  colorModes.includes(value as ColorMode);

const isThemePalette = (value: string | null): value is ThemePalette =>
  palettes.includes(value as ThemePalette);

const prefersDark = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches === true;

export const resolveColorMode = (mode: ColorMode): Exclude<ColorMode, 'system'> =>
  mode === 'system' ? (prefersDark() ? 'dark' : 'light') : mode;

const readStoredTheme = () => {
  if (typeof window === 'undefined') return { mode: 'system' as ColorMode, palette: 'cream' as ThemePalette };
  try {
    const storedMode = window.localStorage.getItem(COLOR_MODE_STORAGE_KEY);
    const storedPalette = window.localStorage.getItem(THEME_PALETTE_STORAGE_KEY);
    return {
      mode: isColorMode(storedMode) ? storedMode : 'system',
      palette: isThemePalette(storedPalette) ? storedPalette : 'cream',
    };
  } catch {
    return { mode: 'system' as ColorMode, palette: 'cream' as ThemePalette };
  }
};

export const applyThemeToDocument = (mode: ColorMode, palette: ThemePalette) => {
  if (typeof document === 'undefined') return;
  const resolvedMode = resolveColorMode(mode);
  const root = document.documentElement;
  root.classList.toggle('dark', resolvedMode === 'dark');
  root.dataset.colorMode = mode;
  root.dataset.palette = palette;
  root.style.colorScheme = resolvedMode;
};

export const initializeTheme = () => {
  const stored = readStoredTheme();
  applyThemeToDocument(stored.mode, stored.palette);
  return stored;
};

interface ThemeContextValue {
  mode: ColorMode;
  palette: ThemePalette;
  resolvedMode: Exclude<ColorMode, 'system'>;
  setMode: (mode: ColorMode) => void;
  setPalette: (palette: ThemePalette) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const initial = useMemo(readStoredTheme, []);
  const [mode, setModeState] = useState<ColorMode>(initial.mode);
  const [palette, setPaletteState] = useState<ThemePalette>(initial.palette);
  const [systemDark, setSystemDark] = useState(prefersDark);

  useEffect(() => {
    const media = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (!media) return undefined;
    const onChange = (event: MediaQueryListEvent) => setSystemDark(event.matches);
    media.addEventListener?.('change', onChange);
    return () => media.removeEventListener?.('change', onChange);
  }, []);

  const resolvedMode = mode === 'system' ? (systemDark ? 'dark' : 'light') : mode;

  useEffect(() => {
    applyThemeToDocument(mode, palette);
    try {
      window.localStorage.setItem(COLOR_MODE_STORAGE_KEY, mode);
      window.localStorage.setItem(THEME_PALETTE_STORAGE_KEY, palette);
    } catch {
      // A blocked or full storage area should not prevent theme changes in-session.
    }
  }, [mode, palette, systemDark]);

  const value = useMemo<ThemeContextValue>(() => ({
    mode,
    palette,
    resolvedMode,
    setMode: setModeState,
    setPalette: setPaletteState,
  }), [mode, palette, resolvedMode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used inside ThemeProvider');
  return context;
}

