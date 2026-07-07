import { useEffect, useState } from 'react';
import { themePresets } from '@/mocks/home';

export default function ThemeSwitcher() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState('cream');

  const applyTheme = (key: string) => {
    setActive(key);
    const root = document.documentElement;
    switch (key) {
      case 'mint':
        root.style.setProperty('--background-50', '0.985 0.014 168');
        root.style.setProperty('--background-100', '0.965 0.02 166');
        root.style.setProperty('--primary-500', '0.62 0.15 168');
        break;
      case 'sunset':
        root.style.setProperty('--background-50', '0.985 0.02 55');
        root.style.setProperty('--background-100', '0.96 0.03 52');
        root.style.setProperty('--primary-500', '0.6 0.22 36');
        break;
      case 'sand':
        root.style.setProperty('--background-50', '0.985 0.02 88');
        root.style.setProperty('--background-100', '0.96 0.03 86');
        root.style.setProperty('--primary-500', '0.7 0.18 60');
        break;
      default:
        root.style.setProperty('--background-50', '0.99 0.008 85');
        root.style.setProperty('--background-100', '0.975 0.012 82');
        root.style.setProperty('--primary-500', '0.67 0.2 38');
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="fixed bottom-6 right-6 z-30">
      {open && (
        <div className="absolute bottom-16 right-0 w-72 bg-background-50 border border-background-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="font-heading font-semibold text-foreground-950">Customize theme</div>
              <div className="text-xs text-foreground-600">Preview instantly, saves per browser</div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="w-8 h-8 rounded-full bg-background-100 hover:bg-background-200 flex items-center justify-center cursor-pointer"
            >
              <i className="ri-close-line text-foreground-700"></i>
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {themePresets.map((t) => (
              <button
                key={t.key}
                onClick={() => applyTheme(t.key)}
                className={`p-3 rounded-lg border text-left cursor-pointer ${
                  active === t.key
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-background-200 hover:border-primary-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-full"
                    style={{
                      background: t.color,
                      borderColor: t.ring,
                      borderWidth: 2,
                      borderStyle: 'solid',
                    }}
                  ></div>
                  <span className="text-sm font-heading font-semibold text-foreground-950">
                    {t.name}
                  </span>
                </div>
              </button>
            ))}
          </div>
          <div className="mt-3 p-3 rounded-lg bg-background-100 text-[11px] text-foreground-700 flex gap-2">
            <i className="ri-magic-line text-primary-600"></i>
            More palettes and font pairs are coming next patch.
          </div>
        </div>
      )}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-14 h-14 rounded-full bg-primary-500 hover:bg-primary-600 text-background-50 dark:text-foreground-950 flex items-center justify-center cursor-pointer"
        aria-label="theme"
      >
        <i className={`${open ? 'ri-close-line' : 'ri-palette-line'} text-2xl`}></i>
      </button>
    </div>
  );
}