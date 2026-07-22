import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { prefetchRouteForPath } from '@/router/config';
import { stripRouteSuffixes } from '@/i18n/languageRouting';
import { useVersion, type GameVersion } from '@/hooks/VersionContext';
import type { NewsItem } from '@/services/liveContent';

const wikiTitleFromPath = (pathname: string) => {
  const routePath = stripRouteSuffixes(pathname);
  const match = routePath.match(/^\/wiki\/article\/(.+)$/);
  if (!match) return null;
  try {
    return decodeURIComponent(match[1]).replace(/_/g, ' ');
  } catch {
    return match[1].replace(/_/g, ' ');
  }
};

const pathResourcePrefetches = new Map<string, Promise<void>>();

const decodePathSegment = (value: string) => {
  try { return decodeURIComponent(value); } catch { return value; }
};

const prefetchPageData = async (pathname: string, language: string, version: GameVersion) => {
  const url = new URL(pathname, window.location.origin);
  const routePath = stripRouteSuffixes(url.pathname);

  if (routePath === '/news' || routePath === '/events') {
    const [{ prefetchRealtimeCollection }, liveContent, validators, cache] = await Promise.all([
      import('@/hooks/useRealtimeCollection'),
      import('@/services/liveContent'),
      import('@/services/contentCacheValidation'),
      import('@/services/realtimeCache'),
    ]);
    let newsRequest: Promise<NewsItem[]> | undefined;
    const requests: Promise<unknown>[] = [];
    if (routePath === '/news' || routePath === '/events') {
      newsRequest = prefetchRealtimeCollection({
        storageKey: `${liveContent.liveStorageKeys.news}:${version}`,
        intervalMs: cache.realtimeCacheDurations.short,
        remoteLoader: () => liveContent.fetchLiveNews(version),
        isValidItem: validators.isRenderableNewsItem,
      });
      requests.push(newsRequest);
    }
    if (routePath === '/events') {
      requests.push(prefetchRealtimeCollection({
        storageKey: `${liveContent.liveStorageKeys.events}:${version}`,
        remoteLoader: () => liveContent.fetchLiveEvents(version),
        isValidItem: validators.isRenderableEventItem,
      }));
    }
    await Promise.allSettled(requests);
    if (newsRequest) {
      const newsItems = await newsRequest.catch(() => []);
      await Promise.allSettled(newsItems.slice(0, 3).map((item) => (
        liveContent.fetchOfficialArticleDocument(item.sourceUrl, version)
      )));
    }
    return;
  }

  if (routePath === '/guides') {
    const { fetchGrandisGuideSectionPage } = await import('@/services/liveContent');
    await fetchGrandisGuideSectionPage('content');
    return;
  }

  const guideMatch = routePath.match(/^\/guides\/([^/]+)$/);
  if (guideMatch && guideMatch[1] !== 'level') {
    const [{ prefetchRealtimeCollection }, liveContent] = await Promise.all([
      import('@/hooks/useRealtimeCollection'),
      import('@/services/liveContent'),
    ]);
    const guides = await prefetchRealtimeCollection({
      storageKey: liveContent.liveStorageKeys.guides,
      remoteLoader: liveContent.fetchLiveGuides,
    });
    const guideId = decodePathSegment(guideMatch[1]);
    const guide = guides.find((item) => item.id === guideId);
    if (guide) await liveContent.fetchLiveGuideContent(guide);
    return;
  }

  if (routePath === '/upcoming') {
    const { fetchUpcomingUpdates } = await import('@/services/upcomingUpdates');
    await fetchUpcomingUpdates();
    return;
  }

  const upcomingMatch = routePath.match(/^\/upcoming\/([^/]+)$/);
  if (upcomingMatch) {
    const { fetchUpcomingUpdateArticle } = await import('@/services/upcomingUpdates');
    await fetchUpcomingUpdateArticle(decodePathSegment(upcomingMatch[1]));
    return;
  }

  if (routePath === '/mapler-house') {
    const [{ prefetchRealtimeCollection }, liveContent] = await Promise.all([
      import('@/hooks/useRealtimeCollection'),
      import('@/services/liveContent'),
    ]);
    await prefetchRealtimeCollection({
      storageKey: liveContent.liveStorageKeys.tools,
      remoteLoader: liveContent.fetchLiveToolResources,
    });
    return;
  }

  if (routePath === '/rankings') {
    const { fetchNexonRankings, isRankingVersionSupported } = await import('@/services/nexonRankings');
    if (isRankingVersionSupported(version)) {
      await fetchNexonRankings({ version, board: 'overall', world: 'all', page: 1, language });
    }
    return;
  }

  if (routePath === '/source') {
    const sourceUrl = url.searchParams.get('url');
    if (sourceUrl) {
      const { fetchOfficialArticleDocument } = await import('@/services/liveContent');
      await fetchOfficialArticleDocument(sourceUrl, version);
    }
  }
};

function prefetchPathResources(pathname: string, language: string, version: GameVersion) {
  const url = new URL(pathname, window.location.origin);
  const resourceKey = `${stripRouteSuffixes(url.pathname)}${url.search}:${language}:${version}`;
  const existing = pathResourcePrefetches.get(resourceKey);
  if (existing) return existing;

  const tasks: Promise<unknown>[] = [];
  const routeRequest = prefetchRouteForPath(pathname);
  if (routeRequest) tasks.push(routeRequest);
  tasks.push(prefetchPageData(pathname, language, version));

  const wikiTitle = wikiTitleFromPath(pathname);
  if (wikiTitle) {
    tasks.push(
      import('@/services/liveContent')
        .then(({ prefetchWikiEntryForLocale }) => prefetchWikiEntryForLocale(wikiTitle, language)),
    );
  }

  const request = Promise.allSettled(tasks).then(() => undefined);
  if (pathResourcePrefetches.size >= 60) {
    const oldestKey = pathResourcePrefetches.keys().next().value;
    if (oldestKey) pathResourcePrefetches.delete(oldestKey);
  }
  pathResourcePrefetches.set(resourceKey, request);
  return request;
}

export default function RoutePreloader() {
  const { i18n } = useTranslation();
  const { version } = useVersion();

  useEffect(() => {
    const prefetchEventTarget = (target: EventTarget | null) => {
      if (!(target instanceof Element)) return;
      const anchor = target.closest<HTMLAnchorElement>('a[href]');
      if (!anchor || anchor.hasAttribute('download')) return;

      let url: URL;
      try {
        url = new URL(anchor.href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      void prefetchPathResources(`${url.pathname}${url.search}`, i18n.language, version);
    };

    const onPointerOver = (event: PointerEvent) => prefetchEventTarget(event.target);
    const onFocusIn = (event: FocusEvent) => prefetchEventTarget(event.target);
    const onTouchStart = (event: TouchEvent) => prefetchEventTarget(event.target);
    document.addEventListener('pointerover', onPointerOver, { passive: true });
    document.addEventListener('focusin', onFocusIn);
    document.addEventListener('touchstart', onTouchStart, { passive: true });

    return () => {
      document.removeEventListener('pointerover', onPointerOver);
      document.removeEventListener('focusin', onFocusIn);
      document.removeEventListener('touchstart', onTouchStart);
    };
  }, [i18n.language, version]);

  return null;
}
