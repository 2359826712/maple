import { useCallback, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useVersion } from '@/hooks/VersionContext';
import { isAvailableInVersion } from '@/domain/regionModel';
import { useTranslation } from 'react-i18next';
import { useRealtimeCollection } from '@/hooks/useRealtimeCollection';
import { fetchLiveNews, liveStorageKeys, type NewsItem } from '@/services/liveContent';
import { getPopularSearchTerms } from '@/services/siteSearch';
import FloatingLeaves from '@/components/feature/FloatingLeaves';
import { useLocalizedNewsItems } from '@/pages/news/useLocalizedNewsItems';

export default function Hero() {
  const { versionInfo } = useVersion();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const loadNews = useCallback(() => fetchLiveNews(versionInfo.id), [versionInfo.id]);
  const { items: realtimeNews } = useRealtimeCollection<NewsItem>({
    storageKey: `${liveStorageKeys.news}:${versionInfo.id}`,
    baseItems: [],
    remoteLoader: loadNews,
  });
  const { items: localizedNews } = useLocalizedNewsItems(realtimeNews, i18n.language);

  const searchChips = useMemo(
    () => getPopularSearchTerms(i18n.language, versionInfo.id, 4),
    [i18n.language, versionInfo.id],
  );

  const filteredTicker = useMemo(
    () =>
      localizedNews
        .filter((item) => isAvailableInVersion(item.versions, versionInfo.id))
        .slice(0, 8)
        .map((item) => ({ text: `${item.title} · ${item.date}` })),
    [localizedNews, versionInfo.id],
  );
  const searchGuides = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    navigate(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  return (
    <section id="top" className="relative overflow-hidden pb-8 pt-16 sm:pb-10 sm:pt-20 md:pb-14 md:pt-24">
      {/* === MAPLE WORLD BACKGROUND === */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "url('/hero-bg.svg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
        }}
      ></div>
      {/* Dark overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-foreground-950/35 via-foreground-950/15 to-background-50 dark:from-[#120e0b]/35 dark:via-[#120e0b]/15"></div>

      {/* === FLOATING MAPLE LEAVES === */}
      <FloatingLeaves count={18} />

      <div className="relative w-full px-4 md:px-8 flex flex-col items-center text-center">
        {/* Version badge with maple leaf */}
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary-300/50 bg-background-50/85 px-3.5 py-1.5 shadow-sm backdrop-blur">
          <i className="ri-leaf-fill text-primary-500 text-sm leaf-sway"></i>
          <span className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse"></span>
          <span className="text-xs font-semibold text-foreground-800 uppercase tracking-wider">
            {versionInfo.shortLabel} · {versionInfo.fullName} · {t('hero_badge')}
          </span>
          <i className="ri-leaf-fill text-primary-500 text-sm leaf-sway" style={{ animationDelay: '1.5s' }}></i>
        </div>

        <h1 className="max-w-4xl font-heading text-3xl font-semibold text-background-50 drop-shadow-lg sm:text-4xl md:text-5xl lg:text-6xl">
          {t('hero_title_line1')}{' '}
          <span className="bg-gradient-to-r from-secondary-300 via-primary-300 to-accent-300 bg-clip-text text-transparent drop-shadow-md">
            {t('hero_title_maple_world')}
          </span>
          <br />
          <span className="text-background-50/95">{t('hero_title_line2')}</span>
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-background-50/85 drop-shadow sm:text-base md:mt-4 md:text-lg">
          {t('hero_subtitle')}
        </p>

        {/* Search bar */}
        <div className="mt-6 w-full max-w-2xl">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              searchGuides(searchQuery);
            }}
            className="flex flex-col sm:flex-row gap-2 bg-background-50/95 border border-primary-200/40 backdrop-blur p-2 rounded-full shadow-md"
          >
            <div className="flex items-center gap-2 flex-1 pl-3">
              <i className="ri-search-2-line text-foreground-500"></i>
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder={t('hero_search_placeholder')}
                className="h-11 w-full bg-transparent text-sm text-foreground-900 placeholder:text-foreground-600 outline-none"
              />
            </div>
            <button
              type="submit"
              className="h-11 px-5 rounded-full bg-gradient-to-r from-primary-500 to-accent-600 hover:from-primary-600 hover:to-accent-700 text-background-50 dark:text-foreground-950 text-sm font-semibold cursor-pointer whitespace-nowrap shadow-sm"
            >
              {t('hero_search_button')}
            </button>
          </form>
          {searchChips.length > 0 && (
            <div className="mt-3 flex flex-wrap justify-center gap-2 text-xs text-background-50/75">
              <span>{t('hero_search_try')}</span>
              {searchChips.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => searchGuides(chip)}
                  className="inline-flex min-h-11 items-center rounded-full border border-background-50/40 bg-background-50/20 px-3 py-1 backdrop-blur hover:bg-background-50/35 hover:text-background-50 cursor-pointer whitespace-nowrap"
                >
                  {chip}
                </button>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* === LIVE TICKER === */}
      {filteredTicker.length > 0 && (
      <div className="relative mt-6 border-y border-primary-200/20 bg-gradient-to-r from-background-100/95 via-background-50/95 to-background-100/95 backdrop-blur sm:mt-8 md:mt-10">
        <div data-testid="mobile-news-ticker" className="flex min-h-12 items-center gap-2 px-3 py-2.5 sm:hidden">
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-gradient-to-r from-primary-500 to-accent-600 px-2 py-1 text-[10px] font-semibold text-background-50 shadow-sm">
            <i className="ri-flashlight-line" aria-hidden="true"></i>
            {t('hero_live_ticker')}
          </span>
          <Link to="/news" className="flex min-h-11 min-w-0 flex-1 items-center gap-2 text-sm font-medium text-foreground-900">
            <span className="truncate">{filteredTicker[0].text}</span>
            <span className="shrink-0 font-semibold text-primary-700">{t('hero_ticker_view_all')}</span>
          </Link>
        </div>
        <div data-testid="desktop-news-ticker" className="hidden items-center gap-3 overflow-hidden px-4 py-3 sm:flex md:px-8">
          <span className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 rounded-full bg-gradient-to-r from-primary-500 to-accent-600 text-background-50 dark:text-foreground-950 text-[10px] sm:text-[11px] font-semibold whitespace-nowrap shadow-sm">
            <i className="ri-flashlight-line"></i>
            <span>{t('hero_live_ticker')}</span>
          </span>
          <div className="flex-1 overflow-hidden">
            <div className="animate-marquee flex gap-10 whitespace-nowrap text-sm text-foreground-800">
              {filteredTicker.map((item, i) => (
                <span key={`primary-${i}`} className="flex items-center gap-2">
                  <i className="ri-leaf-fill text-primary-500 text-[8px]"></i>
                  {item.text}
                </span>
              ))}
              {filteredTicker.map((item, i) => (
                <span key={`duplicate-${i}`} aria-hidden="true" className="ticker-duplicate flex items-center gap-2">
                  <i className="ri-leaf-fill text-primary-500 text-[8px]"></i>
                  {item.text}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
      )}
    </section>
  );
}
