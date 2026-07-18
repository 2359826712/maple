import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { themePresets } from '@/mocks/home';
import { useTheme, type ColorMode, type ThemePalette } from '@/hooks/ThemeContext';

const modeOptions: Array<{ key: ColorMode; icon: string; labelKey: string }> = [
  { key: 'light', icon: 'ri-sun-line', labelKey: 'theme_mode_light' },
  { key: 'dark', icon: 'ri-moon-line', labelKey: 'theme_mode_dark' },
  { key: 'system', icon: 'ri-computer-line', labelKey: 'theme_mode_system' },
];

export default function ThemeSwitcher() {
  const { t } = useTranslation();
  const { mode, palette, resolvedMode, setMode, setPalette } = useTheme();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const closePanel = () => {
    setOpen(false);
    window.requestAnimationFrame(() => triggerRef.current?.focus());
  };

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closePanel();
    };
    const onClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node) && event.target !== triggerRef.current) {
        closePanel();
      }
    };
    window.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClickOutside);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClickOutside);
    };
  }, [open]);

  return (
    <div className="fixed bottom-24 right-4 z-30 md:bottom-6 md:right-6">
      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-labelledby="theme-settings-title"
          className="absolute bottom-16 right-0 w-[min(20rem,calc(100vw-2rem))] rounded-xl border border-background-300 bg-background-50 p-4 text-foreground-900 shadow-xl"
        >
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <div id="theme-settings-title" className="font-heading font-semibold text-foreground-950">{t('theme_title')}</div>
              <div className="text-xs text-foreground-600">{t('theme_desc')}</div>
            </div>
            <button
              type="button"
              onClick={closePanel}
              aria-label={t('theme_close')}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-background-100 text-foreground-700 hover:bg-background-200"
            >
              <i className="ri-close-line" aria-hidden="true"></i>
            </button>
          </div>

          <div className="mb-4">
            <div className="mb-2 text-xs font-bold uppercase tracking-wide text-foreground-600">{t('theme_mode_label')}</div>
            <div className="grid grid-cols-3 gap-2" role="group" aria-label={t('theme_mode_label')}>
              {modeOptions.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  aria-pressed={mode === option.key}
                  onClick={() => setMode(option.key)}
                  className={`flex min-h-11 flex-col items-center justify-center gap-1 rounded-lg border px-2 py-2 text-xs font-semibold transition-colors ${
                    mode === option.key
                      ? 'border-primary-500 bg-primary-100 text-primary-900'
                      : 'border-background-300 bg-background-100 text-foreground-700 hover:border-primary-400'
                  }`}
                >
                  <i className={`${option.icon} text-base`} aria-hidden="true"></i>
                  {t(option.labelKey)}
                </button>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-foreground-600" aria-live="polite">
              {t('theme_mode_active', { mode: t(`theme_mode_${resolvedMode}`) })}
            </p>
          </div>

          <div className="mb-2 text-xs font-bold uppercase tracking-wide text-foreground-600">{t('theme_palette_label')}</div>
          <div className="grid grid-cols-2 gap-2">
            {themePresets.map((preset) => (
              <button
                key={preset.key}
                type="button"
                aria-pressed={palette === preset.key}
                onClick={() => setPalette(preset.key as ThemePalette)}
                className={`rounded-lg border p-3 text-left ${
                  palette === preset.key
                    ? 'border-primary-500 bg-primary-100'
                    : 'border-background-300 bg-background-100 hover:border-primary-400'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span
                    className="h-6 w-6 rounded-full"
                    style={{ background: preset.color, border: `2px solid ${preset.ring}` }}
                    aria-hidden="true"
                  ></span>
                  <span className="text-sm font-heading font-semibold text-foreground-950">{t(preset.nameKey)}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-600 text-white shadow-lg transition-colors hover:bg-primary-700 sm:h-14 sm:w-14"
        aria-label={open ? t('theme_close') : t('theme_open')}
        aria-expanded={open}
      >
        <i className={`${open ? 'ri-close-line' : resolvedMode === 'dark' ? 'ri-moon-line' : 'ri-sun-line'} text-xl sm:text-2xl`} aria-hidden="true"></i>
      </button>
    </div>
  );
}
