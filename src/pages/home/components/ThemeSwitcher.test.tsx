// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';
import { ThemeProvider } from '@/hooks/ThemeContext';
import ThemeSwitcher from '@/pages/home/components/ThemeSwitcher';

const renderSwitcher = () => render(
  <I18nextProvider i18n={i18n}>
    <ThemeProvider>
      <ThemeSwitcher />
    </ThemeProvider>
  </I18nextProvider>,
);

describe('ThemeSwitcher', () => {
  beforeEach(async () => {
    localStorage.clear();
    document.documentElement.className = '';
    await i18n.changeLanguage('en');
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn(() => ({
        matches: false,
        media: '(prefers-color-scheme: dark)',
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
    Object.defineProperty(window, 'requestAnimationFrame', {
      configurable: true,
      value: (callback: (time: number) => void) => {
        callback(0);
        return 1;
      },
    });
  });

  afterEach(() => cleanup());

  it('offers explicit light, dark, and system preferences', async () => {
    renderSwitcher();
    fireEvent.click(screen.getByRole('button', { name: 'Customize theme' }));

    expect(screen.getByRole('dialog', { name: 'Customize theme' })).toBeTruthy();
    const darkButton = screen.getByRole('button', { name: 'Dark' });
    fireEvent.click(darkButton);

    await waitFor(() => expect(darkButton.getAttribute('aria-pressed')).toBe('true'));
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem('maplehub-color-mode')).toBe('dark');
    expect(screen.getByRole('button', { name: 'Light' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'System' })).toBeTruthy();
  });

  it('closes with Escape and restores focus to the trigger', async () => {
    renderSwitcher();
    const trigger = screen.getByRole('button', { name: 'Customize theme' });
    fireEvent.click(trigger);
    fireEvent.keyDown(window, { key: 'Escape' });

    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Customize theme' })).toBeNull());
    expect(document.activeElement).toBe(trigger);
  });
});
