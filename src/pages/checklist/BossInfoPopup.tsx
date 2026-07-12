import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { BossInfo } from '@/mocks/bosses';

interface BossInfoPopupProps {
  boss: BossInfo | null;
  anchorEl: HTMLElement | null;
  onClose: () => void;
  onViewGuide: (bossName: string) => void;
}

export default function BossInfoPopup({
  boss,
  anchorEl,
  onClose,
  onViewGuide,
}: BossInfoPopupProps) {
  const { t } = useTranslation();
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const onEscape = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', onEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', onEscape);
    };
  }, [onClose]);

  useEffect(() => {
    if (!boss || !anchorEl) return;
    const timer = setTimeout(() => {
      const el = popupRef.current?.querySelector<HTMLElement>(
        'button, input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      el?.focus();
    }, 0);
    return () => clearTimeout(timer);
  }, [boss, anchorEl]);

  if (!boss || !anchorEl) return null;

  const rect = anchorEl.getBoundingClientRect();
  const top = rect.bottom + window.scrollY + 8;
  const left = Math.min(rect.left + window.scrollX, window.innerWidth - 340);

  return (
    <div
      ref={popupRef}
      className="fixed z-50 w-80 rounded-lg border border-background-300 bg-white p-4 shadow-lg"
      style={{ top, left }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="boss-info-popup-title"
    >
      <div className="mb-3 flex items-start justify-between">
        <div>
          <h3 id="boss-info-popup-title" className="text-base font-semibold text-foreground-950">
            {boss.name}
          </h3>
          <div className="mt-0.5 text-xs text-foreground-600">
            Lv.{boss.level} · {t('boss_popup_min_entry', { level: boss.minLevel })}
            {boss.recommendedBp > 0 && ` · BP ${boss.recommendedBp.toLocaleString()}`}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="flex h-6 w-6 items-center justify-center rounded text-foreground-600 hover:bg-background-100"
        >
          <i className="ri-close-line text-sm"></i>
        </button>
      </div>

      {/* Difficulty levels */}
      <div className="mb-3 flex flex-wrap gap-1.5">
        {boss.difficulty.map((d) => (
          <span key={d} className="rounded bg-background-100 px-2 py-0.5 text-xs text-foreground-600">
            {d}
          </span>
        ))}
      </div>

      {/* Key mechanics from phases */}
      {boss.phases && boss.phases.length > 0 && (
        <div className="mb-3">
          <div className="mb-1 text-xs font-semibold text-foreground-600">
            {t('boss_popup_key_mechanics')}
          </div>
          <ul className="space-y-1 text-xs text-foreground-950">
            {boss.phases.slice(0, 3).map((phase, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary-600"></span>
                <span className="line-clamp-2">
                  <span className="font-semibold">{phase.name}</span>
                  {phase.mechanics.length > 0 && `: ${phase.mechanics.slice(0, 2).join(', ')}`}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Tips */}
      {boss.tips && boss.tips.length > 0 && (
        <div className="mb-3">
          <div className="mb-1 text-xs font-semibold text-foreground-600">
            {t('boss_popup_notes')}
          </div>
          <ul className="space-y-1 text-xs text-red-600">
            {boss.tips.slice(0, 2).map((tip, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <i className="ri-error-warning-line mt-0.5 text-xs"></i>
                <span className="line-clamp-2">{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Data provenance */}
      <div className="mb-3 flex items-center gap-1.5 text-[10px] text-foreground-600">
        <i className="ri-database-2-line text-[9px]"></i>
        <span>{boss.dataSource}</span>
        <span className="text-foreground-400">·</span>
        <span>{boss.lastVerified}</span>
      </div>

      <button
        type="button"
        onClick={() => onViewGuide(boss.name)}
        className="w-full rounded border border-background-300 bg-background-50 px-3 py-2 text-center text-xs font-semibold text-primary-600 hover:bg-primary-50"
      >
        {t('boss_popup_view_guide')}
        <i className="ri-arrow-right-s-line ml-1"></i>
      </button>
    </div>
  );
}
