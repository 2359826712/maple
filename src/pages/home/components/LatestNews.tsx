import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useVersion } from '@/hooks/VersionContext';
import { useRealtimeCollection } from '@/hooks/useRealtimeCollection';
import { latestNews } from '@/mocks/home';
import { getNewsCategoryLabel, getNewsCopy } from '@/pages/news/localizedNews';

type NewsItem = (typeof latestNews)[number];

const filters = ['All', 'Patch Notes', 'Event', 'General', 'Cash Shop'];

const tagStyle: Record<string, string> = {
  primary: 'bg-primary-100 text-primary-800',
  accent: 'bg-accent-100 text-accent-800',
  secondary: 'bg-secondary-100 text-secondary-900',
};

export default function LatestNews() {
  const { t, i18n } = useTranslation();
  const { versionInfo } = useVersion();
  const [active, setActive] = useState('All');
  const [shared, setShared] = useState<string | null>(null);
  const { items: realtimeNews } = useRealtimeCollection<NewsItem>({
    storageKey: 'maplehub-live-news',
    baseItems: latestNews,
    remoteUrl: '/realtime/news.json',
  });

  const versionList = useMemo(
    () =>
      realtimeNews
        .filter((n) => n.versions.includes(versionInfo.id))
        .map((n) => ({
          ...n,
          ...getNewsCopy(n, i18n.language),
          categoryLabel: getNewsCategoryLabel(n.category, i18n.language),
        })),
    [i18n.language, realtimeNews, versionInfo.id],
  );
  const list = useMemo(
    () => (active === 'All' ? versionList : versionList.filter((n) => n.category === active)),
    [active, versionList],
  );

  const share = (id: string) => {
    setShared(id);
    setTimeout(() => setShared(null), 1500);
  };

  return (
    <section id="news" className="py-14 md:py-20 bg-background-100">
      <div className="w-full px-4 md:px-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
          <div>
            <div className="text-xs font-semibold text-primary-600 uppercase tracking-wider flex items-center gap-1.5">
              <i className="ri-leaf-fill text-primary-500 text-[10px]"></i>
              {t('news_title_eyebrow')}
            </div>
            <h2 className="mt-2 font-heading text-2xl md:text-4xl font-semibold text-foreground-950">
              {t('news_title')}
            </h2>
          </div>
          <div className="flex gap-1 bg-background-50 border border-background-200 rounded-full p-1 overflow-x-auto">
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setActive(f)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer whitespace-nowrap ${
                  active === f
                    ? 'bg-primary-500 text-background-50'
                    : 'text-foreground-700 hover:text-primary-700'
                }`}
              >
                {f === 'All' ? t('news_filter_all') : f === 'Patch Notes' ? t('news_filter_patch') : f === 'Event' ? t('news_filter_event') : f === 'General' ? t('news_filter_general') : t('news_filter_cash')}
              </button>
            ))}
          </div>
        </div>

        {list.length === 0 ? (
          <div className="text-center py-16 text-foreground-600">
            <i className="ri-newspaper-line text-4xl mb-3 block"></i>
            <p className="text-lg font-semibold">{t('news_no_items', { version: versionInfo.shortLabel })}</p>
            <p className="text-sm mt-1">{t('news_no_items_tip')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {list.map((n, i) => (
              <article
                key={n.id}
                className={`group rounded-xl overflow-hidden border border-background-200 bg-background-50 flex flex-col ${
                  i === 0 ? 'lg:col-span-2 lg:row-span-1' : ''
                }`}
              >
                <div className={`relative overflow-hidden ${i === 0 ? 'h-64 md:h-80' : 'h-44'}`}>
                  <img
                    src={n.image}
                    alt={n.title}
                    className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                  />
                  <span className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-[11px] font-semibold ${tagStyle[n.tag]}`}>
                    {n.categoryLabel}
                  </span>
                  {n.versions.length === 1 && (
                    <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-foreground-900/70 text-background-50">
                      {n.versions[0].toUpperCase()}
                    </span>
                  )}
                  <div className="absolute bottom-3 right-3 flex gap-1.5">
                    {['ri-twitter-x-line', 'ri-facebook-fill', 'ri-discord-line', 'ri-link'].map((ic) => (
                      <button
                        key={ic}
                        onClick={() => share(n.id + ic)}
                        className="w-8 h-8 rounded-full bg-background-50/95 hover:bg-primary-500 hover:text-background-50 text-foreground-800 flex items-center justify-center cursor-pointer transition-colors"
                        aria-label="share"
                      >
                        <i className={ic}></i>
                      </button>
                    ))}
                  </div>
                  {shared && shared.startsWith(n.id) && (
                    <div className="absolute bottom-14 right-3 px-3 py-1.5 rounded-md bg-foreground-900 text-background-50 text-xs">
                      {t('news_shared_toast')}
                    </div>
                  )}
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <h3 className={`font-heading font-semibold text-foreground-950 ${i === 0 ? 'text-xl md:text-2xl' : 'text-base md:text-lg'}`}>
                    {n.title}
                  </h3>
                  <p className="mt-2 text-sm text-foreground-700 flex-1">{n.excerpt}</p>
                  <div className="mt-4 flex items-center justify-between text-xs text-foreground-600">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary-200 text-primary-800 flex items-center justify-center font-semibold text-[10px]">
                        {n.author[0]}
                      </div>
                      <span>{n.author}</span>
                      <span>·</span>
                      <span>{n.date}</span>
                    </div>
                    <span className="flex items-center gap-1">
                      <i className="ri-eye-line"></i>
                      {n.reads}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
