// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import {
  COLOR_MODE_STORAGE_KEY,
  THEME_PALETTE_STORAGE_KEY,
  ThemeProvider,
  initializeTheme,
  useTheme,
} from '@/hooks/ThemeContext';

let systemDark = false;
const mediaListeners = new Set<(event: MediaQueryListEvent) => void>();

function ThemeHarness() {
  const { mode, palette, resolvedMode, setMode, setPalette } = useTheme();
  return (
    <div>
      <output aria-label="Theme state">{`${mode}:${resolvedMode}:${palette}`}</output>
      <button type="button" onClick={() => setMode('dark')}>Use dark</button>
      <button type="button" onClick={() => setMode('system')}>Use system</button>
      <button type="button" onClick={() => setPalette('mint')}>Use mint</button>
    </div>
  );
}

describe('ThemeProvider', () => {
  beforeEach(() => {
    cleanup();
    localStorage.clear();
    systemDark = false;
    mediaListeners.clear();
    document.documentElement.className = '';
    document.documentElement.removeAttribute('data-color-mode');
    document.documentElement.removeAttribute('data-palette');
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: () => ({
        matches: systemDark,
        media: '(prefers-color-scheme: dark)',
        onchange: null,
        addEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => mediaListeners.add(listener),
        removeEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => mediaListeners.delete(listener),
        addListener: () => undefined,
        removeListener: () => undefined,
        dispatchEvent: () => true,
      }),
    });
  });

  afterEach(() => cleanup());

  it('applies stored preferences before the application renders', () => {
    localStorage.setItem(COLOR_MODE_STORAGE_KEY, 'dark');
    localStorage.setItem(THEME_PALETTE_STORAGE_KEY, 'mint');

    initializeTheme();

    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.dataset.colorMode).toBe('dark');
    expect(document.documentElement.dataset.palette).toBe('mint');
    expect(document.documentElement.style.colorScheme).toBe('dark');
  });

  it('persists explicit mode and palette choices', async () => {
    render(<ThemeProvider><ThemeHarness /></ThemeProvider>);
    fireEvent.click(screen.getByRole('button', { name: 'Use dark' }));
    fireEvent.click(screen.getByRole('button', { name: 'Use mint' }));

    await waitFor(() => expect(screen.getByLabelText('Theme state').textContent).toBe('dark:dark:mint'));
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem(COLOR_MODE_STORAGE_KEY)).toBe('dark');
    expect(localStorage.getItem(THEME_PALETTE_STORAGE_KEY)).toBe('mint');
  });

  it('tracks operating-system changes only while system mode is selected', async () => {
    render(<ThemeProvider><ThemeHarness /></ThemeProvider>);
    fireEvent.click(screen.getByRole('button', { name: 'Use system' }));
    systemDark = true;
    mediaListeners.forEach((listener) => listener({ matches: true } as MediaQueryListEvent));

    await waitFor(() => expect(screen.getByLabelText('Theme state').textContent).toBe('system:dark:cream'));
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    fireEvent.click(screen.getByRole('button', { name: 'Use dark' }));
    systemDark = false;
    mediaListeners.forEach((listener) => listener({ matches: false } as MediaQueryListEvent));
    expect(screen.getByLabelText('Theme state').textContent).toBe('dark:dark:cream');
  });
});
