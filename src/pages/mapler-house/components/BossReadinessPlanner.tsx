import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function BossReadinessPlanner() {
  const { t } = useTranslation();

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-accent-200 bg-accent-50 p-6" role="status">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-100 text-accent-700">
            <i className="ri-shield-check-line text-xl" />
          </span>
          <div>
            <h3 className="font-heading text-lg font-semibold text-foreground-950">
              Boss readiness estimates are temporarily unavailable
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-foreground-700">
              The previous calculator used unsourced battle-power and IED thresholds. Those recommendations have been withheld until each regional patch, world type, class, and boss difficulty can be verified. Your checklist remains available for manual planning.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          to="/checklist"
          className="inline-flex h-10 items-center rounded-full bg-primary-500 px-4 text-sm font-semibold text-background-50 hover:bg-primary-600"
        >
          {t('mh_boss_open_checklist')}
          <i className="ri-arrow-right-line ml-1.5" />
        </Link>
        <Link
          to="/wiki/boss"
          className="inline-flex h-10 items-center rounded-full border border-background-300 bg-background-50 px-4 text-sm font-semibold text-foreground-800 hover:bg-primary-50"
        >
          {t('mh_boss_view_detail')}
        </Link>
      </div>
    </div>
  );
}
