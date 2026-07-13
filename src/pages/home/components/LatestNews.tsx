import { useMemo, useState, type SyntheticEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useVersion } from '@/hooks/VersionContext';
import { isAvailableInVersion } from '@/domain/regionModel';
import { useRealtimeCollection } from '@/hooks/useRealtimeCollection';
import { getNewsCategoryLabel, getNewsCopy } from '@/pages/news/localizedNews';
import { fetchLiveNews, liveStorageKeys, officialArticleHref, type NewsItem } from '@/services/liveContent';
import ShareButton from '@/components/feature/ShareButton';

const filters = ['All', 'Patch Notes', 'Event', 'General', 'Cash Shop'];

const tagStyle: Record<string, string> = {
  primary: 'bg-primary-100 text-primary-800',
  accent: 'bg-accent-100 text-accent-800',
  secondary: 'bg-secondary-100 text-secondary-900',
};

const fallbackNewsImage = 'https://nxcache.nexon.net/cms/2021/q1/2167/maintenance-1100x225-maplestory.png';

const applyNewsImageFallback = (event: SyntheticEvent<HTMLImageElement>) => {
  const image = event.currentTarget;
  if (image.dataset.fallbackApplied === 'true') {
    image.style.display = 'none';
    return;
  }

  image.dataset.fallbackApplied = 'true';
  image.src = fallbackNewsImage;
};

export default function LatestNews() {
  const { t, i18n } = useTranslation();
  const { versionInfo } = useVersion();
  const [active, setActive] = useState('All');
  const { items: realtimeNews } = useRealtimeCollection<NewsItem>({
    storageKey: `${liveStorageKeys.news}:${versionInfo.id}`,
    baseItems: [],
    remoteLoader: fetchLiveNews,
  });

  const versionList = useMemo(
    () =>
      realtimeNews
        .filter((item) => isAvailableInVersion(item.versions, versionInfo.id))
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
                    src={n.image || fallbackNewsImage}
                    alt={n.title}
                    className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                    onError={applyNewsImageFallback}
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
                    <ShareButton
                      compact
                      title={n.title}
                      text={n.excerpt}
                      url={`/news?q=${encodeURIComponent(n.title)}`}
                      className="h-8 w-8 bg-background-50/95 hover:bg-primary-500 hover:text-background-50"
                    />
                  </div>
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
                  <Link
                    to={officialArticleHref(n.sourceUrl, n.title, versionInfo.id)}
                    className="mt-4 inline-flex h-9 items-center justify-center gap-1.5 rounded-full bg-primary-500 px-4 text-xs font-semibold text-background-50 hover:bg-primary-600"
                  >
                    <i className="ri-book-open-line" aria-hidden="true" />
                    {t('news_read_article')}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
