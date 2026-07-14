import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function GuideScrollTopButton() {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let frame = 0;
    const updateVisibility = () => {
      frame = 0;
      const nextVisible = window.scrollY > 420;
      setVisible((current) => current === nextVisible ? current : nextVisible);
    };
    const scheduleVisibilityUpdate = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(updateVisibility);
    };

    updateVisibility();
    window.addEventListener('scroll', scheduleVisibilityUpdate, { passive: true });
    return () => {
      window.removeEventListener('scroll', scheduleVisibilityUpdate);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      aria-label={t('guide_back_to_top')}
      title={t('guide_back_to_top')}
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed right-4 bottom-24 z-40 inline-flex h-11 w-11 items-center justify-center rounded-full border border-primary-200 bg-background-50 text-primary-700 shadow-[0_0.2rem_0.4rem_rgba(124,45,18,0.18)] transition hover:-translate-y-0.5 hover:bg-primary-50 hover:text-primary-800 md:right-8"
    >
      <i className="ri-arrow-up-line text-xl"></i>
    </button>
  );
}
