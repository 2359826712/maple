import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { officialAnnouncements } from '@/mocks/mapler-house';
import { useVersion } from '@/hooks/VersionContext';

const categoryConfig: Record<string, { color: string; icon: string; i18nKey: string }> = {
  'Patch Notes': { color: 'bg-primary-100 text-primary-700', icon: 'ri-file-text-line', i18nKey: 'mh_filter_patch' },
  'Event': { color: 'bg-accent-100 text-accent-700', icon: 'ri-calendar-event-line', i18nKey: 'mh_filter_event' },
  'Maintenance': { color: 'bg-secondary-100 text-secondary-700', icon: 'ri-tools-line', i18nKey: 'mh_filter_maintenance' },
  'Community': { color: 'bg-accent-100 text-accent-700', icon: 'ri-group-line', i18nKey: 'mh_filter_community' },
  'Content': { color: 'bg-secondary-100 text-secondary-700', icon: 'ri-stack-line', i18nKey: 'mh_filter_content' },
};

const FILTER_CATEGORIES = ['All', 'Patch Notes', 'Event', 'Content', 'Maintenance', 'Community'];

export default function OfficialAnnouncements() {
  const { t } = useTranslation();
  const { version } = useVersion();
  const [categoryFilter, setCategoryFilter] = useState('All');

  const data = officialAnnouncements
    .filter((a) => a.versions.includes(version))
    .filter((a) => categoryFilter === 'All' || a.category === categoryFilter);

  return (
    <div className="space-y-4">
      {/* Category filter tabs */}
      <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide pb-1">
        {FILTER_CATEGORIES.map((cat) => {
          const cfg = categoryConfig[cat];
          const isActive = categoryFilter === cat;
          return (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-primary-500 text-background-50 dark:text-foreground-950 shadow-sm'
                  : 'bg-background-100 text-foreground-600 border border-background-200 hover:text-primary-600 hover:border-primary-200'
              }`}
            >
              {cfg && <i className={`${cfg.icon} text-[11px]`}></i>}
              {cat === 'All' ? t('mh_filter_all') : cfg ? t(cfg.i18nKey) : cat}
              {cat !== 'All' && (
                <span className={`text-[10px] px-1 py-0 rounded-sm ${
                  isActive ? 'bg-background-50/20' : 'bg-background-200/70'
                }`}>
                  {officialAnnouncements.filter((a) => a.versions.includes(version) && a.category === cat).length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Announcement list */}
      {data.length === 0 ? (
        <div className="bg-background-100 border border-background-200 rounded-xl p-10 text-center">
          <i className="ri-inbox-line text-4xl text-foreground-400 block mb-3"></i>
          <p className="text-sm text-foreground-600">{t('mh_no_announcements')}</p>
        </div>
      ) : (
        data.map((item) => {
          const cfg = categoryConfig[item.category] || categoryConfig['Patch Notes'];
          return (
            <div key={item.id} className="bg-background-50 border border-background-200 rounded-xl p-5 hover:border-primary-300 transition-colors">
              <div className="flex items-start gap-4">
                <div className={`w-9 h-9 rounded-lg ${cfg.color} flex items-center justify-center flex-shrink-0`}>
                  <i className={`${cfg.icon} text-lg`}></i>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${cfg.color} whitespace-nowrap`}>
                      {item.category}
                    </span>
                    <span className="text-xs text-foreground-500">{item.date}</span>
                    {item.versions.length > 1 && (
                      <span className="text-[10px] text-foreground-500 bg-background-100 rounded px-1.5 py-0.5">
                        {item.versions.join(' · ')}
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-semibold text-foreground-950 mb-1.5">{item.title}</h4>
                  <p className="text-sm text-foreground-600 leading-relaxed">{item.summary}</p>
                  <div className="flex items-center gap-3 mt-3 pt-3 border-t border-background-200/70">
                    <span className="text-xs text-foreground-500 flex items-center gap-1">
                      <i className="ri-information-line"></i>
                      {item.source}
                    </span>
                    <button className="text-xs font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1 cursor-pointer whitespace-nowrap">
                      <i className="ri-external-link-line"></i>
                      {t('mh_view_source')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}