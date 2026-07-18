import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { dailyHubs } from '@/mocks/home';
import { useVersion } from '@/hooks/VersionContext';
import { millisecondsUntilReset } from '@/domain/regionModel';
import { scheduleAfterStaticHydration } from '@/ssg/hydration';

function formatCountdown(ms: number): string {
  if (ms <= 0) return '00:00:00';
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1_000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

const tintStyles: Record<string, { iconBg: string; iconText: string; border: string; hoverBg: string; action: string }> = {
  primary: {
    iconBg: 'bg-primary-100',
    iconText: 'text-primary-700',
    border: 'hover:border-primary-400',
    hoverBg: 'hover:bg-primary-50/50',
    action: 'bg-primary-500 hover:bg-primary-600',
  },
  accent: {
    iconBg: 'bg-accent-100',
    iconText: 'text-accent-700',
    border: 'hover:border-accent-400',
    hoverBg: 'hover:bg-accent-50/50',
    action: 'bg-accent-600 hover:bg-accent-700',
  },
  secondary: {
    iconBg: 'bg-secondary-100',
    iconText: 'text-secondary-800',
    border: 'hover:border-secondary-400',
    hoverBg: 'hover:bg-secondary-50/50',
    action: 'bg-secondary-700 hover:bg-secondary-800',
  },
};

export default function DailyHubSection() {
  const { t } = useTranslation();
  const { version, versionInfo } = useVersion();
  // Keep the first browser render identical to the generated HTML. The live
  // clock starts after hydration so React can reuse the server-rendered nodes.
  const [now, setNow] = useState(0);

  useEffect(() => {
    let timer = 0;
    const cancelStart = scheduleAfterStaticHydration(() => {
      setNow(Date.now());
      timer = window.setInterval(() => setNow(Date.now()), 1000);
    });
    return () => {
      cancelStart();
      window.clearInterval(timer);
    };
  }, []);

  const resetCountdown = formatCountdown(millisecondsUntilReset('daily', version, now));

  return (
    <section className="py-10 md:py-16 bg-background-50">
      <div className="w-full px-4 md:px-8">
        <div className="mx-auto mb-8 max-w-5xl rounded-2xl border border-primary-200 bg-gradient-to-r from-primary-50 via-background-50 to-accent-50 p-5 shadow-sm md:flex md:items-center md:justify-between md:gap-6 md:p-6">
          <div className="text-left">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary-100 px-3 py-1 text-xs font-semibold text-primary-700">
              <i className="ri-timer-line" />
              {t('hub_reset_countdown', { version: versionInfo.shortLabel, time: resetCountdown })}
            </div>
            <h2 className="font-heading text-xl font-semibold text-foreground-950 md:text-2xl">
              {t('hub_setup_title')}
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-foreground-600">
              {t('hub_setup_desc')}
            </p>
          </div>
          <Link
            to="/checklist"
            className="mt-4 inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-primary-500 px-5 text-sm font-semibold text-background-50 shadow-sm transition hover:bg-primary-600 md:mt-0"
          >
            <i className="ri-dashboard-3-line" />
            {t('hub_setup_action')}
          </Link>
        </div>

        <div className="text-center mb-8">
          <h2 className="font-heading text-2xl md:text-3xl font-semibold text-foreground-950">
            {t('hub_title', 'What do you want to do today?')}
          </h2>
          <p className="mt-2 text-sm text-foreground-600 max-w-xl mx-auto">
            {t('hub_subtitle', 'Your three most-used features — one click away.')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
          {dailyHubs.map((hub) => {
            const style = tintStyles[hub.tint] || tintStyles.primary;
            return (
              <Link
                key={hub.href}
                to={hub.href}
                className={`group relative rounded-xl border border-background-200 bg-background-50 p-6 text-center transition-all hover:-translate-y-1 hover:shadow-lg ${style.border} ${style.hoverBg}`}
              >
                <div className={`mx-auto w-14 h-14 rounded-xl ${style.iconBg} ${style.iconText} flex items-center justify-center mb-4 transition-transform group-hover:scale-110`}>
                  <i className={`${hub.icon} text-2xl`}></i>
                </div>
                <h3 className="font-heading text-lg font-semibold text-foreground-950 mb-2">
                  {t(hub.titleKey)}
                </h3>
                <p className="text-sm text-foreground-600 leading-relaxed mb-5">
                  {t(hub.descKey)}
                </p>
                <span className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold text-background-50 ${style.action} transition`}>
                  {t(hub.actionKey)}
                  <i className="ri-arrow-right-line text-sm group-hover:translate-x-0.5 transition-transform"></i>
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
