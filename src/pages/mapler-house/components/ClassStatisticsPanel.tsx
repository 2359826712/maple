import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { classStatistics } from '@/mocks/mapler-house';
import { useVersion } from '@/hooks/VersionContext';

export default function ClassStatisticsPanel() {
  const { t } = useTranslation();
  const { version } = useVersion();
  const [sortBy, setSortBy] = useState<'popularity' | 'bossClear' | 'mobbing' | 'support'>('popularity');
  const data = useMemo(() => {
    const filtered = classStatistics.filter((c) => c.version === version || c.version === 'all');
    return [...filtered].sort((a, b) => {
      if (sortBy === 'popularity') return b.popularity - a.popularity;
      if (sortBy === 'bossClear') return Number(b.bossClear) - Number(a.bossClear);
      if (sortBy === 'mobbing') return Number(b.mobbing) - Number(a.mobbing);
      if (sortBy === 'support') return Number(b.support) - Number(a.support);
      return 0;
    });
  }, [version, sortBy]);

  const totalClasses = data.length;
  const topByPopularity = useMemo(() => [...data].sort((a, b) => b.popularity - a.popularity).slice(0, 3), [data]);
  const trendingUp = useMemo(() => data.filter((c) => c.trend === 'up').length, [data]);
  const trendingDown = useMemo(() => data.filter((c) => c.trend === 'down').length, [data]);

  const trendIcon = (trend: string) => {
    if (trend === 'up') return <i className="ri-arrow-up-line text-accent-600 text-xs"></i>;
    if (trend === 'down') return <i className="ri-arrow-down-line text-red-500 text-xs"></i>;
    return <i className="ri-subtract-line text-foreground-500 text-xs"></i>;
  };

  const trendLabel = (trend: string) => {
    if (trend === 'up') return t('mh_trend_up');
    if (trend === 'down') return t('mh_trend_down');
    return t('mh_trend_flat');
  };

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-background-100 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-foreground-900">{totalClasses}</div>
          <div className="text-xs text-foreground-500 mt-1">{t('mh_classes_tracked')}</div>
        </div>
        <div className="bg-accent-50 rounded-xl p-4 text-center border border-accent-100">
          <div className="text-2xl font-bold text-accent-600">{trendingUp}</div>
          <div className="text-xs text-accent-700 mt-1 flex items-center justify-center gap-1">
            <i className="ri-arrow-up-line text-xs"></i> {t('mh_trending_up')}
          </div>
        </div>
        <div className="bg-red-50 rounded-xl p-4 text-center border border-red-100">
          <div className="text-2xl font-bold text-red-500">{trendingDown}</div>
          <div className="text-xs text-red-600 mt-1 flex items-center justify-center gap-1">
            <i className="ri-arrow-down-line text-xs"></i> {t('mh_trending_down')}
          </div>
        </div>
        <div className="bg-secondary-50 rounded-xl p-4 text-center border border-secondary-100">
          <div className="text-xs text-foreground-600 mb-1">{t('mh_top_class')}</div>
          <div className="text-sm font-bold text-secondary-700">{topByPopularity[0]?.class || '—'}</div>
          <div className="text-xs text-secondary-500">{t('mh_popularity_pct', { pct: topByPopularity[0]?.popularity || 0 })}</div>
        </div>
      </div>

      {/* Popularity distribution chart */}
      <div className="bg-background-100 border border-background-200 rounded-xl p-5">
        <h4 className="text-xs font-semibold text-foreground-700 uppercase tracking-wider mb-4">
          {t('mh_popularity_distribution')}
        </h4>
        <div className="space-y-2">
          {data.slice(0, 10).map((cls) => (
            <div key={cls.class} className="flex items-center gap-3">
              <div className="w-16 text-xs font-medium text-foreground-800 whitespace-nowrap truncate">
                {cls.class}
              </div>
              <div className="flex-1 h-5 bg-background-200 rounded-full overflow-hidden relative">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary-400 to-accent-500 transition-all duration-700 relative"
                  style={{ width: `${Math.min(cls.popularity * 6, 100)}%` }}
                >
                  {cls.popularity >= 10 && (
                    <span className="absolute inset-y-0 right-2 text-[10px] font-bold text-background-50 flex items-center">
                      {cls.popularity}%
                    </span>
                  )}
                </div>
                {cls.popularity < 10 && (
                  <span className="absolute inset-y-0 left-[calc(6*var(--pct)+4px)] text-[10px] font-semibold text-foreground-600 flex items-center"
                    style={{ '--pct': `${cls.popularity}` } as React.CSSProperties}>
                    {cls.popularity}%
                  </span>
                )}
              </div>
            </div>
          ))}
          {data.length > 10 && (
            <div className="text-center text-xs text-foreground-500 mt-2 pt-2 border-t border-background-200">
              {t('mh_more_classes', { count: data.length - 10 })}
            </div>
          )}
        </div>
      </div>

      {/* Sort controls */}
      <div className="flex items-center gap-2 text-xs">
        <span className="text-foreground-500">{t('mh_sort_by')}</span>
        {([
          { key: 'popularity' as const, label: t('mh_popularity') },
          { key: 'bossClear' as const, label: t('mh_boss_clear') },
          { key: 'mobbing' as const, label: t('mh_mobbing') },
          { key: 'support' as const, label: t('mh_support') },
        ]).map((opt) => (
          <button
            key={opt.key}
            onClick={() => setSortBy(opt.key)}
            className={`px-3 py-1 rounded-full font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              sortBy === opt.key ? 'bg-primary-500 text-background-50 dark:text-foreground-950' : 'bg-background-100 text-foreground-600 hover:bg-background-200'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-background-200">
              <th className="text-left py-3 px-2 text-xs font-semibold text-foreground-500 uppercase tracking-wider">#</th>
              <th className="text-left py-3 px-2 text-xs font-semibold text-foreground-500 uppercase tracking-wider">Class</th>
              <th className="text-right py-3 px-2 text-xs font-semibold text-foreground-500 uppercase tracking-wider">{t('mh_popularity')}</th>
              <th className="text-right py-3 px-2 text-xs font-semibold text-foreground-500 uppercase tracking-wider">{t('mh_boss_clear')}</th>
              <th className="text-right py-3 px-2 text-xs font-semibold text-foreground-500 uppercase tracking-wider">{t('mh_mobbing')}</th>
              <th className="text-right py-3 px-2 text-xs font-semibold text-foreground-500 uppercase tracking-wider">{t('mh_support')}</th>
              <th className="text-center py-3 px-2 text-xs font-semibold text-foreground-500 uppercase tracking-wider">{t('mh_col_trend')}</th>
            </tr>
          </thead>
          <tbody>
            {data.map((cls, i) => (
              <tr key={cls.class} className="border-b border-background-100 hover:bg-background-50 transition-colors">
                <td className="py-3 px-2 text-foreground-500 font-medium">{i + 1}</td>
                <td className="py-3 px-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-md bg-primary-100 flex items-center justify-center">
                      <i className={`${cls.icon} text-primary-600 text-sm`}></i>
                    </div>
                    <span className="font-semibold text-foreground-900 whitespace-nowrap">{cls.class}</span>
                  </div>
                </td>
                <td className="py-3 px-2 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <div className="w-16 h-1.5 bg-background-200 rounded-full overflow-hidden">
                      <div className="h-full bg-primary-500 rounded-full" style={{ width: `${cls.popularity * 7}%` }}></div>
                    </div>
                    <span className="font-semibold text-foreground-900">{cls.popularity}%</span>
                  </div>
                </td>
                <td className="py-3 px-2 text-right font-semibold text-foreground-900">{cls.bossClear}</td>
                <td className="py-3 px-2 text-right font-semibold text-foreground-900">{cls.mobbing}</td>
                <td className="py-3 px-2 text-right font-semibold text-foreground-900">{cls.support}</td>
                <td className="py-3 px-2 text-center">
                  <div className="inline-flex items-center gap-1 text-xs font-medium">
                    {trendIcon(cls.trend)}
                    <span className={cls.trend === 'up' ? 'text-accent-600' : cls.trend === 'down' ? 'text-red-500' : 'text-foreground-500'}>
                      {trendLabel(cls.trend)}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
