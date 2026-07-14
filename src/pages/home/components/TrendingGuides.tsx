import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useVersion } from '@/hooks/VersionContext';
import { isAvailableInVersion } from '@/domain/regionModel';
import { useAuthSession } from '@/hooks/useAuthSession';
import { useRealtimeCollection } from '@/hooks/useRealtimeCollection';
import { getGuideCardCopy, useLocalizedGuideItems } from '@/pages/guides/localizedGuides';
import AuthRequiredNotice from '@/components/feature/AuthRequiredNotice';
import ShareButton from '@/components/feature/ShareButton';
import { fetchLiveGuides, liveStorageKeys, type GuideItem } from '@/services/liveContent';

const difficultyColor: Record<string, string> = {
  Beginner: 'bg-accent-100 text-accent-800',
  Intermediate: 'bg-secondary-100 text-secondary-900',
  Advanced: 'bg-primary-100 text-primary-800',
};

export default function TrendingGuides() {
  const { t, i18n } = useTranslation();
  const { versionInfo } = useVersion();
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [authPrompt, setAuthPrompt] = useState(false);
  const { isSignedIn } = useAuthSession();
  const { items: realtimeGuides, status: realtimeStatus } = useRealtimeCollection<GuideItem>({
    storageKey: liveStorageKeys.guides,
    baseItems: [],
    remoteLoader: fetchLiveGuides,
  });
  const localizedGuides = useLocalizedGuideItems(realtimeGuides, i18n.language);
  const requireAuth = () => {
    if (isSignedIn) return true;
    setAuthPrompt(true);
    return false;
  };

  const toggleLike = (id: string) => {
    if (!requireAuth()) return;
    setLiked((s) => ({ ...s, [id]: !s[id] }));
  };

  const filteredGuides = useMemo(
    () => localizedGuides.filter((guide) => isAvailableInVersion(guide.versions, versionInfo.id)),
    [localizedGuides, versionInfo.id],
  );
  const isInitialGuidesSync = realtimeStatus === 'syncing' && realtimeGuides.length === 0;

  return (
    <section id="guides" className="py-14 md:py-20 bg-background-50">
      <div className="w-full px-4 md:px-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div>
            <div className="text-xs font-semibold text-primary-600 uppercase tracking-wider flex items-center gap-1.5">
              <i className="ri-leaf-fill text-primary-500 text-[10px]"></i>
              {t('guides_title_eyebrow')}
            </div>
            <h2 className="mt-2 font-heading text-2xl md:text-4xl font-semibold text-foreground-950">
              {t('guides_title')}
            </h2>
            <p className="mt-2 text-sm md:text-base text-foreground-700 max-w-2xl">
              {t('guides_desc')}
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <button className="h-10 px-4 rounded-full border border-background-300 text-foreground-800 hover:border-primary-400 hover:text-primary-700 cursor-pointer whitespace-nowrap">
              <i className="ri-filter-3-line mr-1"></i>
              {t('guides_filter')}
            </button>
            <button className="h-10 px-4 rounded-full bg-primary-500 hover:bg-primary-600 text-background-50 dark:text-foreground-950 font-semibold cursor-pointer whitespace-nowrap">
              {t('guides_browse_all')}
            </button>
          </div>
        </div>

        {authPrompt && (
          <div className="mb-6">
            <AuthRequiredNotice onDismiss={() => setAuthPrompt(false)} />
          </div>
        )}

        {filteredGuides.length === 0 ? (
          <div className="text-center py-16 text-foreground-600">
            <i className={`${isInitialGuidesSync ? 'ri-loader-4-line animate-spin' : 'ri-book-open-line'} text-4xl mb-3 block`}></i>
            <p className="text-lg font-semibold">
              {isInitialGuidesSync ? t('guides_loading') : t('guides_no_items', { version: versionInfo.shortLabel })}
            </p>
            <p className="text-sm mt-1">{isInitialGuidesSync ? t('guides_loading_tip') : t('guides_no_items_tip')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredGuides.map((g) => {
              const copy = getGuideCardCopy(g, i18n.language);
              return (
                <article
                  key={g.id}
                  className="group rounded-xl border border-background-200 bg-background-50 overflow-hidden hover:border-primary-300 transition-colors"
                >
                  <Link to={`/guides/${g.id}`} className="block">
                    <div className="relative h-40 overflow-hidden">
                      <img
                        src={g.image}
                        alt={copy.title}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                      />
                      <span className="absolute top-3 left-3 px-2 py-1 rounded-md bg-background-50/95 text-[11px] font-semibold text-foreground-900">
                        {copy.classLabel}
                      </span>
                      <span className={`absolute top-3 right-3 px-2 py-1 rounded-md text-[11px] font-semibold ${difficultyColor[g.difficulty]}`}>
                        {copy.difficulty}
                      </span>
                      {g.versions.length === 1 && (
                        <span className="absolute bottom-3 left-3 px-2 py-1 rounded-md text-[10px] font-semibold bg-foreground-900/70 text-background-50">
                          {g.versions[0].toUpperCase()}
                        </span>
                      )}
                    </div>
                  </Link>
                  <div className="p-5">
                    <Link to={`/guides/${g.id}`} className="block">
                      <h3 className="font-heading font-semibold text-foreground-950 text-base md:text-lg leading-snug hover:text-primary-700 transition-colors">
                        {copy.title}
                      </h3>
                    </Link>
                    <div className="mt-3 flex items-center gap-3 text-xs text-foreground-600">
                      <span className="flex items-center gap-1">
                        <i className="ri-time-line"></i> {copy.length}
                      </span>
                      <span className="flex items-center gap-1">
                        <i className="ri-quill-pen-line"></i> {g.author}
                      </span>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <button
                        onClick={() => toggleLike(g.id)}
                        className={`flex items-center gap-1.5 h-9 px-3 rounded-full text-xs font-semibold cursor-pointer whitespace-nowrap ${
                          liked[g.id]
                            ? 'bg-primary-500 text-background-50'
                            : 'bg-background-100 hover:bg-primary-100 text-foreground-800'
                        }`}
                      >
                        <i className={liked[g.id] ? 'ri-thumb-up-fill' : 'ri-thumb-up-line'}></i>
                        {liked[g.id] ? g.upvotes + 1 : g.upvotes}
                      </button>
                      <div className="flex items-center gap-2 text-foreground-600">
                        <button
                          onClick={requireAuth}
                          className="w-9 h-9 rounded-full bg-background-100 hover:bg-accent-100 hover:text-accent-700 flex items-center justify-center cursor-pointer"
                          aria-label="bookmark"
                        >
                          <i className="ri-bookmark-line"></i>
                        </button>
                        <ShareButton
                          compact
                          title={copy.title}
                          text={g.excerpt}
                          url={`/guides/${encodeURIComponent(g.id)}`}
                        />
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
