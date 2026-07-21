import type { GetServerSidePropsContext, GetStaticPropsContext } from 'next';
import { loadLanguageResources } from '@/i18n';
import {
  getPathLanguage,
  getPathServer,
  languagePathSegments,
  serverPathSegments,
  stripRouteSuffixes,
  supportedLanguages,
  supportedServers,
  withRouteSuffixes,
  type SupportedLanguage,
} from '@/i18n/languageRouting';
import { prefetchRouteForPath } from '@/router/config';
import metadataCatalog from '@/seo/routeMetadata.json';
import {
  fetchGrandisGuideSectionPage,
  fetchLiveEvents,
  fetchLiveGuideContent,
  fetchLiveGuides,
  fetchLiveNews,
  fetchLiveToolResources,
  fetchLocalizedWikiEntry,
  fetchOfficialArticleDocument,
  fetchWikiEntryByTitleLocalFirst,
  fetchWikiEntryContent,
  type EventItem,
  type GrandisGuideSection,
  type GrandisGuideSectionPage,
  type GuideItem,
  type NewsItem,
  type OfficialArticleDocument,
  type ToolResourceItem,
  type WikiEntry,
} from '@/services/liveContent';
import { isRenderableEventItem, isRenderableNewsItem } from '@/services/contentCacheValidation';
import {
  fetchUpcomingUpdateArticle,
  fetchUpcomingUpdates,
  type UpcomingUpdateArticle,
  type UpcomingUpdateFeed,
} from '@/services/upcomingUpdates';
import { ensureServerDom } from '@/services/serverDom';
import { normalizeStaticContentLanguage, translateStaticText, translateStaticTexts } from '@/services/staticTranslation';
import { getNewsCopy, getNewsSourceLanguage, getNewsSourceLanguageForVersion } from '@/pages/news/localizedNews';
import { localizeEvents } from '@/pages/events/useLocalizedEvents';
import { localizeGuideItem, localizeGuideItems } from '@/pages/guides/localizedGuides';
import { localizeToolResources } from '@/pages/mapler-house/useLocalizedToolResources';
import { localizeUpcomingArticle, localizeUpcomingFeed } from '@/pages/upcoming/localizedUpcoming';
import { getVerifiedSeriesResource } from '@/pages/series/verifiedContent';
import { isSeriesModule, isSeriesModuleAvailable } from '@/pages/series/scope';

export type NextRoutePageProps = {
  initialEvents?: EventItem[];
  initialGuide?: GuideItem;
  initialGuides?: GuideItem[];
  initialGuideSection?: GrandisGuideSectionPage;
  initialNews?: NewsItem[];
  initialOfficialArticle?: OfficialArticleDocument;
  initialTools?: ToolResourceItem[];
  initialUpcomingArticle?: UpcomingUpdateArticle;
  initialUpcomingFeed?: UpcomingUpdateFeed;
  initialWikiEntry?: WikiEntry;
  language: SupportedLanguage;
  pathname: string;
  requestPath?: string;
  requestTitle?: string;
  server: (typeof supportedServers)[number];
  translation: Record<string, string>;
};

type RouteEntry = {
  changefreq?: string;
  index: boolean;
  priority?: string;
};

const catalogRoutes = metadataCatalog.routes as Record<string, RouteEntry>;

export const runtimeRouteRoots = ['/news', '/upcoming', '/source', '/guides', '/events', '/wiki'] as const;

const dynamicRoutePatterns = [
  /^\/series\/[^/]+(?:\/[^/]+)?$/,
  /^\/content\/[^/]+\/[^/]+$/,
  /^\/guides\/(?!level(?:\/|$))[^/]+$/,
  /^\/upcoming\/[^/]+$/,
  /^\/wiki\/article\/.+$/,
  /^\/wiki\/boss(?:\/[^/]+)?$/,
];

export const normalizeRequestPath = (value: string) => {
  const pathname = value.split(/[?#]/, 1)[0] || '/';
  const normalized = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return normalized.length > 1 ? normalized.replace(/\/+$/, '') : normalized;
};

export const isKnownApplicationPath = (pathname: string) => {
  const routePath = stripRouteSuffixes(normalizeRequestPath(pathname));
  return Boolean(catalogRoutes[routePath]) || dynamicRoutePatterns.some((pattern) => pattern.test(routePath));
};

export const getLocalizedRedirect = (pathname: string) => {
  const requestUrl = new URL(pathname, 'https://mpstorys.com');
  const normalized = normalizeRequestPath(requestUrl.pathname);
  const language = getPathLanguage(normalized);
  const server = getPathServer(normalized);
  const routePath = stripRouteSuffixes(normalized);
  const seriesId = requestUrl.searchParams.get('series') || undefined;
  if (routePath === '/rankings' && !isSeriesModuleAvailable(seriesId, 'rankings')) {
    const destination = withRouteSuffixes('/news', language || 'en', server || 'gms');
    return `${destination}${requestUrl.search}${requestUrl.hash}`;
  }
  const destination = withRouteSuffixes(stripRouteSuffixes(normalized), language || 'en', server || 'gms');
  const localizedUrl = `${destination}${requestUrl.search}${requestUrl.hash}`;
  const requestPath = `${normalized}${requestUrl.search}${requestUrl.hash}`;
  return localizedUrl === requestPath ? null : localizedUrl;
};

const jsonValue = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const safeDecode = (value: string) => {
  try { return decodeURIComponent(value); } catch { return value; }
};

const withDeadline = <T,>(promise: Promise<T>, fallback: T, milliseconds = 20_000) => new Promise<T>((resolve) => {
  const timer = globalThis.setTimeout(() => resolve(fallback), milliseconds);
  void promise.then(
    (value) => {
      globalThis.clearTimeout(timer);
      resolve(value);
    },
    () => {
      globalThis.clearTimeout(timer);
      resolve(fallback);
    },
  );
});

const htmlText = (html: string) => {
  const document = new DOMParser().parseFromString(html, 'text/html');
  return (document.body.textContent || '').replace(/\s+/g, ' ').trim();
};

const localizeNewsItems = async (items: NewsItem[], language: SupportedLanguage) => {
  const targetLanguage = normalizeStaticContentLanguage(language);
  if (items.length === 0) return items;
  const groups = new Map<string, Array<{ index: number; item: NewsItem }>>();
  items.forEach((item, index) => {
    const sourceLanguage = getNewsSourceLanguage(item);
    if (sourceLanguage === targetLanguage) return;
    if (!getNewsCopy(item, targetLanguage).usesOriginalCopy) return;
    const group = groups.get(sourceLanguage) || [];
    group.push({ index, item });
    groups.set(sourceLanguage, group);
  });
  const localized = [...items];
  await Promise.all([...groups.entries()].map(async ([sourceLanguage, group]) => {
    const texts = group.flatMap(({ item }) => [item.title, item.excerpt]);
    const translations = await translateStaticTexts(texts, targetLanguage, { sourceLanguage })
      .catch(() => texts);
    group.forEach(({ index, item }, groupIndex) => {
      localized[index] = {
        ...item,
        translations: {
          ...item.translations,
          [targetLanguage]: {
            title: translations[groupIndex * 2] || item.title,
            excerpt: translations[groupIndex * 2 + 1] || item.excerpt,
          },
        },
      };
    });
  }));
  return localized;
};

const localizeGuideSection = async (page: GrandisGuideSectionPage, language: SupportedLanguage) => {
  const targetLanguage = normalizeStaticContentLanguage(language);
  if (targetLanguage === 'en' || page.localizedLanguage === targetLanguage) return page;
  const html = await translateStaticText(page.html, targetLanguage, {
    sourceLanguage: 'en',
    format: 'html',
  }).catch(() => page.html);
  return { ...page, html, text: htmlText(html), localizedLanguage: targetLanguage };
};

const localizeWikiEntry = async (entry: WikiEntry, language: SupportedLanguage) => {
  const targetLanguage = normalizeStaticContentLanguage(language);
  if (targetLanguage === 'en' || entry.contentLanguage === targetLanguage) return entry;
  const sourceHtml = entry.htmlContent?.trim();
  const [title, description, body] = await Promise.all([
    translateStaticText(entry.title, targetLanguage, { sourceLanguage: 'en' }).catch(() => entry.title),
    translateStaticText(entry.description, targetLanguage, { sourceLanguage: 'en' }).catch(() => entry.description),
    translateStaticText(sourceHtml || entry.content, targetLanguage, {
      sourceLanguage: 'en',
      format: sourceHtml ? 'html' : 'text',
    }).catch(() => sourceHtml || entry.content),
  ]);
  const text = sourceHtml ? htmlText(body) : body;
  const chinese = targetLanguage === 'zh' || targetLanguage === 'zh-Hant';
  return {
    ...entry,
    title,
    description,
    content: text,
    htmlContent: sourceHtml ? body : entry.htmlContent,
    contentLanguage: targetLanguage,
    titleZh: chinese ? title : entry.titleZh,
    descriptionZh: chinese ? description : entry.descriptionZh,
    contentZh: chinese ? text : entry.contentZh,
    htmlContentZh: chinese && sourceHtml ? body : entry.htmlContentZh,
  };
};

const localizeOfficialArticle = async (
  article: OfficialArticleDocument,
  language: SupportedLanguage,
  sourceLanguage: string,
) => {
  const targetLanguage = normalizeStaticContentLanguage(language);
  if (targetLanguage === sourceLanguage || article.contentLanguage === targetLanguage) return article;
  const sourceHtml = article.html.trim();
  const body = await translateStaticText(sourceHtml || article.text, targetLanguage, {
    sourceLanguage,
    format: sourceHtml ? 'html' : 'text',
  }).catch(() => sourceHtml || article.text);
  return {
    ...article,
    html: sourceHtml ? body : '',
    text: sourceHtml ? htmlText(body) : body,
    contentLanguage: targetLanguage,
  };
};

const fallbackGuideForId = (guideId: string): GuideItem | undefined => {
  const match = guideId.match(/^grandis-(content|events|classes)-(.+)$/);
  if (!match) return undefined;
  const [, section, slug] = match;
  const title = slug.split('-').filter(Boolean).map((part) => `${part[0]?.toUpperCase() || ''}${part.slice(1)}`).join(' ');
  const guideSection = section === 'classes' ? 'Classes' : section === 'events' ? 'Events' : 'Content';
  return {
    id: guideId,
    title,
    class: guideSection,
    guideSection,
    difficulty: 'Intermediate',
    length: 'Live',
    upvotes: 0,
    author: 'Grandis Library',
    versions: ['gms'],
      image: '/static/images/vendor/grandislibrary.com/verdel-801df7a4ba.webp',
    excerpt: `${title} from Grandis Library.`,
    sourceLabel: 'Grandis Library',
    sourceUrl: `https://grandislibrary.com/${section}/${slug}`,
  };
};

export async function createRoutePageProps(requestUrl: string): Promise<NextRoutePageProps | null> {
  ensureServerDom();
  const normalized = normalizeRequestPath(requestUrl);
  const isDefaultHomepage = normalized === '/';
  const language = getPathLanguage(normalized) || (isDefaultHomepage ? 'en' : null);
  const server = getPathServer(normalized) || (isDefaultHomepage ? 'gms' : null);
  if (!language || !server || !isKnownApplicationPath(normalized)) return null;

  const routePath = stripRouteSuffixes(normalized);
  const request = new URL(requestUrl, 'https://mpstorys.com');
  const sectionParam = request.searchParams.get('section');
  const guideSection: GrandisGuideSection = sectionParam === 'classes' || sectionParam === 'events'
    ? sectionParam
    : 'content';
  const initialNewsPromise = routePath === '/news' || routePath === '/'
    ? fetchLiveNews(server)
        .then((payload) => payload.items.filter(isRenderableNewsItem).slice(0, routePath === '/' ? 8 : 30))
        .catch(() => [] as NewsItem[])
    : Promise.resolve(undefined);
  const initialEventsPromise = routePath === '/events' || routePath === '/'
    ? fetchLiveEvents(server)
        .then((payload) => payload.items.filter(isRenderableEventItem).slice(0, routePath === '/' ? 6 : 30))
        .catch(() => [] as EventItem[])
    : Promise.resolve(undefined);
  const eventNewsPromise = routePath === '/events'
    ? fetchLiveNews(server)
        .then((payload) => payload.items.filter(isRenderableNewsItem).slice(0, 30))
        .catch(() => [] as NewsItem[])
    : Promise.resolve(undefined);
  const initialUpcomingFeedPromise = routePath === '/upcoming'
    ? fetchUpcomingUpdates().catch(() => undefined)
    : Promise.resolve(undefined);
  const upcomingId = routePath.startsWith('/upcoming/')
    ? safeDecode(routePath.slice('/upcoming/'.length))
    : '';
  const initialUpcomingArticlePromise = upcomingId
    ? fetchUpcomingUpdateArticle(upcomingId).catch(() => undefined)
    : Promise.resolve(undefined);
  const initialGuideSectionPromise = routePath === '/guides'
    ? fetchGrandisGuideSectionPage(guideSection).catch(() => undefined)
    : Promise.resolve(undefined);
  const guideId = routePath.startsWith('/guides/') && routePath !== '/guides/level'
    ? safeDecode(routePath.slice('/guides/'.length))
    : '';
  const initialGuideDataPromise = guideId
    ? fetchLiveGuides()
        .then(async (payload) => {
          const guide = payload.items.find((item) => item.id === guideId) || fallbackGuideForId(guideId);
          if (!guide) return { guides: payload.items };
          const hydrated = await fetchLiveGuideContent(guide).catch(() => guide);
          return { guide: hydrated, guides: [hydrated, ...payload.items.filter((item) => item.id !== guideId)] };
        })
        .catch(() => undefined)
    : Promise.resolve(undefined);
  const homeGuidesPromise = routePath === '/'
    ? fetchLiveGuides().then((payload) => payload.items.slice(0, 12)).catch(() => [] as GuideItem[])
    : Promise.resolve(undefined);
  const wikiTitle = routePath.startsWith('/wiki/article/')
    ? safeDecode(routePath.slice('/wiki/article/'.length)).replace(/_/g, ' ')
    : '';
  const initialWikiEntryPromise = wikiTitle
    ? fetchWikiEntryByTitleLocalFirst(wikiTitle)
        .then(async (entry) => {
          if (!entry) return undefined;
          const hydrated = entry.htmlContent ? entry : await fetchWikiEntryContent(entry).catch(() => entry);
          return fetchLocalizedWikiEntry(hydrated, language).catch(() => hydrated);
        })
        .catch(() => undefined)
    : Promise.resolve(undefined);
  const sourceUrl = request.searchParams.get('url') || '';
  const contentMatch = routePath.match(/^\/content\/([^/]+)\/([^/]+)$/);
  const contentModule = isSeriesModule(contentMatch?.[1]) ? contentMatch[1] : undefined;
  const seriesResource = contentModule && contentMatch?.[2]
    ? getVerifiedSeriesResource(
        request.searchParams.get('series') || '',
        contentModule,
        safeDecode(contentMatch[2]),
      )
    : undefined;
  const requestTitle = request.searchParams.get('title')?.trim() || seriesResource?.title;
  const initialOfficialArticlePromise = routePath === '/source' && sourceUrl
    ? fetchOfficialArticleDocument(sourceUrl, server).catch(() => undefined)
    : Promise.resolve(undefined);
  const initialToolsPromise = routePath === '/mapler-house'
    ? fetchLiveToolResources().then((payload) => payload.items).catch(() => [] as ToolResourceItem[])
    : Promise.resolve(undefined);
  const [
    translation,
    ,
    initialNews,
    initialEvents,
    eventNews,
    initialUpcomingFeed,
    initialUpcomingArticle,
    initialGuideSection,
    initialGuideData,
    homeGuides,
    initialWikiEntry,
    initialOfficialArticle,
    initialTools,
  ] = await Promise.all([
    loadLanguageResources(language),
    prefetchRouteForPath(routePath),
    initialNewsPromise,
    withDeadline(initialEventsPromise, undefined),
    withDeadline(eventNewsPromise, undefined),
    initialUpcomingFeedPromise,
    initialUpcomingArticlePromise,
    initialGuideSectionPromise,
    initialGuideDataPromise,
    homeGuidesPromise,
    initialWikiEntryPromise,
    initialOfficialArticlePromise,
    initialToolsPromise,
  ]);

  const targetLanguage = normalizeStaticContentLanguage(language);
  const sourceLanguage = getNewsSourceLanguageForVersion(server);
  const [
    localizedNews,
    localizedEvents,
    localizedUpcomingFeed,
    localizedUpcomingArticle,
    localizedGuideSection,
    localizedGuideCards,
    localizedGuide,
    localizedWikiEntry,
    localizedOfficialArticle,
    localizedTools,
    localizedRequestTitle,
  ] = await Promise.all([
    initialNews || eventNews ? localizeNewsItems(initialNews || eventNews || [], language) : undefined,
    initialEvents ? localizeEvents(initialEvents, language, sourceLanguage) : undefined,
    initialUpcomingFeed ? localizeUpcomingFeed(initialUpcomingFeed, language) : undefined,
    initialUpcomingArticle ? localizeUpcomingArticle(initialUpcomingArticle, language) : undefined,
    initialGuideSection ? localizeGuideSection(initialGuideSection, language) : undefined,
    initialGuideData?.guides || homeGuides
      ? localizeGuideItems(initialGuideData?.guides || homeGuides || [], language)
      : undefined,
    initialGuideData?.guide ? localizeGuideItem(initialGuideData.guide, language) : undefined,
    initialWikiEntry ? localizeWikiEntry(initialWikiEntry, language) : undefined,
    initialOfficialArticle ? localizeOfficialArticle(initialOfficialArticle, language, sourceLanguage) : undefined,
    initialTools ? localizeToolResources(initialTools, language) : undefined,
    requestTitle && targetLanguage !== sourceLanguage
      ? translateStaticText(requestTitle, targetLanguage, { sourceLanguage }).catch(() => requestTitle)
      : requestTitle,
  ]);

  return {
    language,
    pathname: normalized,
    requestPath: `${request.pathname}${request.search}`,
    server,
    translation,
    ...(localizedNews ? { initialNews: jsonValue(localizedNews) } : {}),
    ...(localizedEvents ? { initialEvents: jsonValue(localizedEvents) } : {}),
    ...(localizedUpcomingFeed ? { initialUpcomingFeed: jsonValue(localizedUpcomingFeed) } : {}),
    ...(localizedUpcomingArticle ? { initialUpcomingArticle: jsonValue(localizedUpcomingArticle) } : {}),
    ...(localizedGuideSection ? { initialGuideSection: jsonValue(localizedGuideSection) } : {}),
    ...(localizedGuideCards ? { initialGuides: jsonValue(localizedGuideCards) } : {}),
    ...(localizedGuide ? { initialGuide: jsonValue(localizedGuide) } : {}),
    ...(localizedWikiEntry ? { initialWikiEntry: jsonValue(localizedWikiEntry) } : {}),
    ...(localizedOfficialArticle ? { initialOfficialArticle: jsonValue(localizedOfficialArticle) } : {}),
    ...(localizedTools ? { initialTools: jsonValue(localizedTools) } : {}),
    ...(localizedRequestTitle ? { requestTitle: localizedRequestTitle } : {}),
  };
}

export function pathnameFromStaticContext(context: GetStaticPropsContext) {
  const route = context.params?.route;
  const segments = Array.isArray(route) ? route : typeof route === 'string' ? [route] : [];
  return normalizeRequestPath(`/${segments.join('/')}`);
}

export function pathnameFromServerContext(context: GetServerSidePropsContext) {
  return normalizeRequestPath(context.resolvedUrl);
}

export function getStaticRoutePaths() {
  const staticRoutes = Object.keys(catalogRoutes).filter(
    (route) => !runtimeRouteRoots.some((root) => route === root || route.startsWith(`${root}/`)),
  );

  return staticRoutes.flatMap((route) =>
    supportedLanguages.flatMap((language) =>
      supportedServers.map((server) => {
        const pathname = withRouteSuffixes(route, language, server);
        return { params: { route: pathname.split('/').filter(Boolean) } };
      }),
    ),
  );
}

export function getSitemapEntries() {
  const catalogEntries = Object.entries(metadataCatalog.routes as Record<string, RouteEntry>)
    .filter(([, entry]) => entry.index)
    .flatMap(([route, entry]) =>
      supportedLanguages.flatMap((language) =>
        supportedServers.map((server) => ({
          changefreq: entry.changefreq || 'weekly',
          language,
          pathname: withRouteSuffixes(route, language, server),
          priority: entry.priority || '0.7',
          server: serverPathSegments[server],
          segment: languagePathSegments[language],
        })),
      ),
    );

  const seriesEntries = [
    'maplestory-pc',
    'maplestory-classic',
    'maplestory-m',
    'maplestory-n',
    'maplestory-worlds',
    'maplestory-idle',
  ].flatMap((seriesId) =>
    supportedLanguages.flatMap((language) =>
      supportedServers.map((server) => ({
        changefreq: 'weekly',
        language,
        pathname: withRouteSuffixes(`/series/${seriesId}`, language, server),
        priority: '0.8',
        server: serverPathSegments[server],
        segment: languagePathSegments[language],
      })),
    ),
  );

  return [...catalogEntries, ...seriesEntries];
}
