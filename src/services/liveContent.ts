import type { WikiCategory, WikiEntry } from '@/mocks/wiki';
import { mapleSqlApi, type WikiMirrorPageRecord } from './mapleSqlApi';
import { cachedJsonFetch, cachedTextFetch, getRealtimeCacheSavedAt, realtimeCacheDurations } from './realtimeCache';
import {
  validateEventData,
  validateNewsData,
  validateToolData,
  validateWikiData,
  type EventDataRecord,
} from '@/domain/contentSchemas';
import { sanitizeMirroredHtml } from './sanitizeHtml';
import type { GameVersion } from '@/domain/regionModel';

export type { WikiCategory, WikiEntry } from '@/mocks/wiki';

export type NewsItem = {
  id: string;
  category: 'Patch Notes' | 'Event' | 'General' | 'Cash Shop';
  title: string;
  excerpt: string;
  author: string;
  date: string;
  publishedAt: string;
  reads: string;
  sourceUrl: string;
  tag: 'primary' | 'accent' | 'secondary';
  versions: string[];
  image: string;
  /** Language used by the official source copy. */
  sourceLanguage?: NewsContentLanguage;
  /** Editorial or backend-provided translations, keyed by interface locale. */
  translations?: Partial<Record<NewsContentLanguage, NewsTranslation>>;
};

export type NewsContentLanguage = 'en' | 'zh' | 'zh-Hant' | 'ja' | 'ko';

export type NewsTranslation = {
  title: string;
  excerpt: string;
};

export type GuideItem = {
  id: string;
  title: string;
  class: string;
  guideSection?: 'Content' | 'Classes' | 'Events';
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  length: string;
  upvotes: number;
  author: string;
  versions: string[];
  image: string;
  excerpt?: string;
  sourceLabel?: string;
  sourceUrl?: string;
  contentHtml?: string;
  contentText?: string;
  sourceSyncedAt?: string;
};

export type ToolResourceItem = {
  id: string;
  name: string;
  desc: string;
  href: string;
  icon: string;
  category: string;
  sourceLabel: string;
};

export type EventItem = {
  id: string;
  name: string;
  windowStart: string;
  windowEnd: string;
  rewards: string[];
  rarity: 'Legendary' | 'Seasonal' | 'Weekly';
  icon: string;
  regions: EventDataRecord['regions'];
  image: string;
  sourceUrl: string;
  sourceLabel: string;
  lastVerified: string;
};

export const liveStorageKeys = {
  news: 'maplehub-online-official-news-v2',
  guides: 'maplehub-online-grandis-guides-v6',
  events: 'maplehub-online-events:v2',
  tools: 'maplehub-online-tools',
  wiki: 'maplehub-online-mswiki-direct-v1',
} as const;

type RemotePayload<T extends { id: string }> = {
  items: T[];
  replace: boolean;
};

export type GrandisGuideSection = 'content' | 'classes' | 'events';

export type GrandisGuideSectionPage = {
  section: GrandisGuideSection;
  html: string;
  text: string;
  sourceUrl: string;
  sourceSyncedAt: string;
};

type WikiApiPage = {
  pageid: number;
  title: string;
  extract?: string;
  fullurl?: string;
  categories?: Array<{
    title: string;
  }>;
};

type WikiSearchResult = {
  pageid: number;
  title: string;
  snippet?: string;
  wordcount?: number;
  timestamp?: string;
};

type WikiParseResponse = {
  parse?: {
    title?: string;
    pageid?: number;
    text?: {
      '*': string;
    };
  };
};

type ParsedWikiPage = {
  text: string;
  html: string;
};

type GuideDetailDbPayload = {
  guide: GuideItem;
};

const sourceLabels: Record<string, string> = {
  mswiki: 'MapleStory Wiki',
};

const allVersions = ['gms', 'kms', 'msea', 'jms', 'tms'];
const newsSourceLanguages: Record<GameVersion, NewsContentLanguage> = {
  gms: 'en',
  kms: 'ko',
  msea: 'en',
  jms: 'ja',
  tms: 'zh-Hant',
};

const newsContentLanguages: NewsContentLanguage[] = ['en', 'zh', 'zh-Hant', 'ja', 'ko'];
const isNewsContentLanguage = (value: unknown): value is NewsContentLanguage =>
  typeof value === 'string' && newsContentLanguages.includes(value as NewsContentLanguage);

export const getNewsSourceLanguageForVersion = (version: GameVersion | string): NewsContentLanguage =>
  newsSourceLanguages[version as GameVersion] || 'en';
const officialNewsImage = 'https://g.nexonstatic.com/media/igbblld4/1200x628-v269-ride-the-lightning-update-maplestory.png';
const regionalNewsFallbacks: Record<GameVersion, string> = {
  gms: officialNewsImage,
  kms: '/news-fallback-kms.svg',
  jms: '/news-fallback-jms.svg',
  tms: '/news-fallback-tms.svg',
  msea: '/news-fallback-msea.svg',
};
const imageUrlPattern = /https?:\/\/[^\s"'<>]+?\.(?:png|jpe?g|webp)(?:\?[^\s"'<>]+)?/i;

export const getNewsFallbackImage = (version: GameVersion | string) =>
  regionalNewsFallbacks[version as GameVersion] || officialNewsImage;

export const getRegionalContentImage = (image: string | undefined, version: GameVersion | string) => {
  if (!image || (version !== 'gms' && image === officialNewsImage)) return getNewsFallbackImage(version);
  return image;
};

const grandisClassUrls = ['/api/grandis-library/classes', 'https://grandislibrary.com/classes'];
const grandisContentUrls = ['/api/grandis-library/content', 'https://grandislibrary.com/content'];
const grandisEventsUrls = ['/api/grandis-library/events', 'https://grandislibrary.com/events'];
const gucciToolUrls = ['/api/gucci-guild/tools', 'https://gucciguild.com/tools'];

const mapleStoryWikiApiUrls = ['https://maplestorywiki.net/api.php'];

const wikiSearchSources = [
  {
    key: 'mswiki',
    label: 'MapleStory Wiki',
    host: 'maplestorywiki.net',
    urls: mapleStoryWikiApiUrls,
  },
] as const;

const wikiCatalogSources = [
  {
    source: wikiSearchSources[0],
    from: '!',
  },
] as const;

const buildRequestUrl = (url: string, params: Record<string, string | number>) => {
  const requestUrl = new URL(url, window.location.origin);
  Object.entries(params).forEach(([key, value]) => requestUrl.searchParams.set(key, String(value)));
  return requestUrl;
};

const jsonFetch = async <T,>(
  urls: string[],
  params: Record<string, string | number>,
  cacheOptions: { freshMs?: number; staleMs?: number } = {},
) => {
  let lastError: unknown = null;

  for (const url of urls) {
    const requestUrl = buildRequestUrl(url, params);
    const candidateUrls = [requestUrl.toString()];

    for (const candidateUrl of candidateUrls) {
      try {
        return await cachedJsonFetch<T>(candidateUrl, {
          cacheKey: `live-content:${candidateUrl}`,
          freshMs: cacheOptions.freshMs ?? 10 * 1000,
          staleMs: cacheOptions.staleMs ?? realtimeCacheDurations.medium,
        });
      } catch (error) {
        lastError = error;
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Live source failed');
};

const textFetchWithMetadata = async (
  urls: string[],
  cacheOptions: { freshMs?: number; staleMs?: number } = {},
): Promise<{ text: string; sourceSyncedAt: string }> => {
  let lastError: unknown = null;

  for (const url of urls) {
    const requestUrl = new URL(url, window.location.origin);
    const candidateUrls = [requestUrl.toString()];

    for (const candidateUrl of candidateUrls) {
      try {
        const cacheKey = `live-content:${candidateUrl}`;
        const text = await cachedTextFetch(candidateUrl, {
          cacheKey,
          freshMs: cacheOptions.freshMs ?? realtimeCacheDurations.long,
          staleMs: cacheOptions.staleMs ?? realtimeCacheDurations.week,
          timeoutMs: 8000,
          transform: sanitizeMirroredHtml,
        });
        const savedAt = getRealtimeCacheSavedAt(cacheKey) ?? Date.now();
        return { text, sourceSyncedAt: new Date(savedAt).toISOString() };
      } catch (error) {
        lastError = error;
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Live source failed');
};

const textFetch = async (
  urls: string[],
  cacheOptions: { freshMs?: number; staleMs?: number } = {},
) => (await textFetchWithMetadata(urls, cacheOptions)).text;

const stripMarkup = (value = '') =>
  value
    .replace(/\[img\].*?\[\/img\]/gis, ' ')
    .replace(/\[url=.*?\](.*?)\[\/url\]/gis, '$1')
    .replace(/\[[^\]]+\]/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

const firstSentence = (value: string, fallback: string) => {
  const clean = stripMarkup(value);
  if (!clean) return fallback;
  return clean.length > 180 ? `${clean.slice(0, 177).trim()}...` : clean;
};

const slugFromText = (value: string) =>
  stripMarkup(value)
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'resource';

const absoluteUrl = (href: string, base: string) => {
  try {
    return new URL(href, base).toString();
  } catch {
    return base;
  }
};

const uniqueById = <T extends { id: string }>(items: T[]) => {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
};

const uniqueStrings = (items: string[]) => {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const uniqueWikiSources = (sources: NonNullable<WikiEntry['sources']>) => {
  const seen = new Set<string>();
  return sources.filter((source) => {
    const key = source.href.trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const parseWikiHtml = (html = '', host = ''): ParsedWikiPage => {
  if (typeof window === 'undefined' || !html) {
    const text = stripMarkup(html);
    return { text, html: text };
  }

  const doc = new DOMParser().parseFromString(html, 'text/html');
  doc.querySelectorAll('script, style, noscript, iframe, form, .mw-editsection, .noprint').forEach((node) => node.remove());
  doc.querySelectorAll('a[href]').forEach((node) => {
    const href = node.getAttribute('href') || '';
    const url = new URL(href, `https://${host}`);
    if (url.hostname === host) {
      const titleFromPath = url.pathname.match(/^\/(?:wiki|w)\/(.+)$/)?.[1];
      const titleFromQuery = url.searchParams.get('title');
      const rawTitle = titleFromPath || titleFromQuery;
      if (rawTitle) {
        node.setAttribute('href', `/wiki/article/${encodeURIComponent(decodeURIComponent(rawTitle).replace(/_/g, ' '))}`);
        node.removeAttribute('target');
        node.removeAttribute('rel');
        return;
      }
    }
    node.setAttribute('href', url.toString());
    node.setAttribute('target', '_blank');
    node.setAttribute('rel', 'noreferrer');
  });
  doc.querySelectorAll('img[src]').forEach((node) => {
    const src = node.getAttribute('src') || '';
    if (src.startsWith('//')) node.setAttribute('src', `https:${src}`);
    if (src.startsWith('/')) node.setAttribute('src', `https://${host}${src}`);
    node.setAttribute('loading', 'lazy');
  });

  return {
    text: stripMarkup(doc.body.textContent || ''),
    html: sanitizeMirroredHtml(doc.body.innerHTML),
  };
};

const pageUrlForSource = (host: string, title: string) =>
  `https://${host}/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}`;

const wikiEntryFromPage = (
  source: (typeof wikiSearchSources)[number],
  page: Pick<WikiSearchResult, 'pageid' | 'title' | 'snippet' | 'wordcount'> & { categories?: Array<{ title: string }> },
  parsedPage?: ParsedWikiPage,
): WikiEntry => {
  const text = parsedPage?.text || stripMarkup(page.snippet || '');
  const description = firstSentence(text || page.snippet, `${source.label} page: ${page.title}.`);
  const content = text || stripMarkup(page.snippet || description);
  const categoryTags = (page.categories || [])
    .map((item) => item.title.replace(/^Category:/i, ''))
    .filter((item) => item && !/hidden categories|pages with/i.test(item))
    .slice(0, 5);
  const category = wikiCategoryForPage(page.title, categoryTags);
  const sourceUrl = pageUrlForSource(source.host, page.title);
  const tags = [source.label, ...categoryTags, page.wordcount ? `${page.wordcount} words` : 'Mirrored page'].slice(0, 7);

  return {
    id: `${source.key}-wiki-${page.pageid}`,
    category,
    title: page.title,
    titleZh: page.title,
    icon: iconForWikiCategory[category],
    tags,
    tagsZh: tags.map((tag) => (tag === 'Mirrored page' ? 'Mirrored page' : tag)),
    versions: allVersions,
    description,
    descriptionZh: description,
    content,
    contentZh: content,
    htmlContent: parsedPage?.html,
    htmlContentZh: parsedPage?.html,
    sourceKey: source.key,
    sourcePageTitle: page.title,
    sources: [{ label: source.label, href: sourceUrl }],
  };
};

export const wikiEntryFromMirrorRecord = (page: WikiMirrorPageRecord): WikiEntry | null => {
  const sourceLabel = sourceLabels.mswiki;
  const tags = page.tags?.length ? page.tags : [sourceLabel];
  const category = wikiCategoryForPage(page.title, [...tags, page.category]);
  const htmlContent = sanitizeMirroredHtml(page.content_html || '', 'https://maplestorywiki.net');
  const validation = validateWikiData({
    title: page.title,
    htmlContent,
    lastSynced: page.updated_at || page.touched_at || page.created_at,
    sourceUrl: page.source_url,
    categories: tags,
  });
  if ('issues' in validation) {
    console.warn('[MapleHub] Rejected invalid mirrored wiki record.', page.id, validation.issues);
    return null;
  }

  return {
    id: `${page.source_key}-wiki-${page.source_page_id}`,
    category,
    title: page.title,
    titleZh: page.title,
    icon: iconForWikiCategory[category],
    tags,
    tagsZh: tags,
    versions: allVersions,
    description: page.extract || firstSentence(page.content_text || page.title, `${sourceLabel} page: ${page.title}.`),
    descriptionZh: page.extract || firstSentence(page.content_text || page.title, `${sourceLabel} page: ${page.title}.`),
    content: page.content_text || page.extract,
    contentZh: page.content_text || page.extract,
    htmlContent,
    htmlContentZh: htmlContent,
    sourceKey: 'mswiki',
    sourcePageTitle: page.title,
    sources: [{ label: sourceLabel, href: page.source_url }],
    lastSynced: page.updated_at || page.touched_at || page.created_at,
  };
};

const normalizedWikiTitle = (title: string) =>
  stripMarkup(title)
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

const wikiEntryScore = (entry: WikiEntry) =>
  (entry.htmlContent?.length || 0) +
  (entry.content?.length || 0) +
  (entry.description?.length || 0) +
  (entry.sourceKey === 'mswiki' ? 1000 : 0);

const mergeWikiEntriesByTitle = (items: WikiEntry[]) => {
  const merged = new Map<string, WikiEntry>();

  uniqueById(items).forEach((entry) => {
    const key = normalizedWikiTitle(entry.title) || entry.id;
    const existing = merged.get(key);
    if (!existing) {
      merged.set(key, entry);
      return;
    }

    const primary = wikiEntryScore(entry) > wikiEntryScore(existing) ? entry : existing;
    const secondary = primary === entry ? existing : entry;
    const sources = uniqueWikiSources([...(primary.sources || []), ...(secondary.sources || [])]);
    const tags = uniqueStrings([...primary.tags, ...secondary.tags]).slice(0, 10);
    const tagsZh = uniqueStrings([...primary.tagsZh, ...secondary.tagsZh]).slice(0, 10);

    merged.set(key, {
      ...primary,
      tags,
      tagsZh,
      versions: uniqueStrings([...primary.versions, ...secondary.versions]),
      sources,
    });
  });

  return Array.from(merged.values());
};

export const validateHydratedWikiEntry = (
  entry: WikiEntry,
  lastSynced = new Date().toISOString(),
): WikiEntry | null => {
  const htmlContent = sanitizeMirroredHtml(entry.htmlContent || '');
  const sourceUrl = entry.sources?.find((source) => source.href)?.href || '';
  const validation = validateWikiData({
    title: entry.title,
    htmlContent,
    lastSynced,
    sourceUrl,
    categories: entry.tags,
  });
  if ('issues' in validation) {
    console.warn('[MapleHub] Rejected invalid hydrated wiki content.', entry.id, validation.issues);
    return null;
  }

  return {
    ...entry,
    htmlContent,
    htmlContentZh: htmlContent,
  };
};

const loadMirroredWikiPages = async (params: { q?: string; category?: string; limit?: number } = {}) => {
  const batchSize = Math.min(params.limit ?? 1000, 1000);
  const maxPages = params.limit ?? 10000;
  const pages: WikiMirrorPageRecord[] = [];

  for (let offset = 0; offset < maxPages; offset += batchSize) {
    const batch = await mapleSqlApi.wikiMirror.listPages({
      ...params,
      source: 'mswiki',
      namespace: 0,
      limit: Math.min(batchSize, maxPages - offset),
      offset,
    });
    pages.push(...batch);
    if (batch.length < batchSize) break;
  }

  return pages.flatMap((page) => {
    const entry = wikiEntryFromMirrorRecord(page);
    return entry ? [entry] : [];
  });
};

const wikiEntryMatchesQuery = (entry: WikiEntry, query: string) => {
  const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return true;
  const haystack = [
    entry.title,
    entry.titleZh,
    entry.description,
    entry.descriptionZh,
    ...entry.tags,
    ...entry.tagsZh,
  ].join(' ').toLowerCase();
  return tokens.every((token) => haystack.includes(token));
};

const fetchWikiPageText = async (source: (typeof wikiSearchSources)[number], title: string) => {
  const parsed = await jsonFetch<WikiParseResponse>(
    source.urls,
    {
      action: 'parse',
      page: title,
      prop: 'text',
      format: 'json',
      origin: '*',
    },
    { freshMs: realtimeCacheDurations.week, staleMs: realtimeCacheDurations.week },
  );

  return parseWikiHtml(parsed.parse?.text?.['*'] || '', source.host);
};

const getWikiSourceByKey = (sourceKey?: string) =>
  wikiSearchSources.find((source) => source.key === sourceKey);

export async function fetchWikiEntryContent(entry: WikiEntry): Promise<WikiEntry> {
  const preserveMergedEntry = (hydrated: WikiEntry): WikiEntry => {
    const sources = uniqueWikiSources([...(hydrated.sources || []), ...(entry.sources || [])]);

    return {
      ...hydrated,
      tags: uniqueStrings([...hydrated.tags, ...entry.tags]).slice(0, 10),
      tagsZh: uniqueStrings([...hydrated.tagsZh, ...entry.tagsZh]).slice(0, 10),
      versions: uniqueStrings([...hydrated.versions, ...entry.versions]),
      sources,
    };
  };

  const source = getWikiSourceByKey(entry.sourceKey);
  const title = entry.sourcePageTitle || entry.title;
  if (!source) return entry;

  const parsedPage = await fetchWikiPageText(source, title);
  const hydrated = preserveMergedEntry(
    wikiEntryFromPage(
      source,
      {
        pageid: Number(entry.id.replace(/\D+/g, '')) || 0,
        title,
        categories: entry.tags
          .filter((tag) => tag !== source.label && !/words|Mirrored page|Online Wiki/i.test(tag))
          .map((tag) => ({ title: `Category:${tag}` })),
      },
      parsedPage,
    ),
  );
  return validateHydratedWikiEntry(hydrated) || {
    ...entry,
    htmlContent: undefined,
    htmlContentZh: undefined,
  };
}

export async function fetchWikiEntryByTitle(title: string): Promise<WikiEntry | null> {
  const normalizedTitle = normalizedWikiTitle(title);
  if (!normalizedTitle) return null;

  const source = wikiSearchSources[0];
  try {
    const pageData = await jsonFetch<{ query?: { pages?: Record<string, WikiApiPage> } }>(source.urls, {
      action: 'query',
      titles: title,
      prop: 'info|categories',
      cllimit: 20,
      inprop: 'url',
      format: 'json',
      origin: '*',
    }, { freshMs: realtimeCacheDurations.medium, staleMs: realtimeCacheDurations.week });
    const page = Object.values(pageData.query?.pages || {}).find((item) => item.pageid > 0 && item.title);
    const parsedPage = await fetchWikiPageText(source, page?.title || title);

    return validateHydratedWikiEntry(wikiEntryFromPage(
      source,
      {
        pageid: page?.pageid || 0,
        title: page?.title || title,
        categories: page?.categories,
      },
      parsedPage,
    ));
  } catch {
    return null;
  }
}

export async function fetchWikiEntryByTitleLocalFirst(title: string): Promise<WikiEntry | null> {
  const normalizedTitle = normalizedWikiTitle(title);
  if (!normalizedTitle) return null;

  // Try local mirror first
  try {
    const mirrorPage = await mapleSqlApi.wikiMirror.getPageByTitle(title.replace(/\s+/g, '_'));
    if (mirrorPage?.content_html) {
      const mirrorEntry = wikiEntryFromMirrorRecord(mirrorPage);
      if (mirrorEntry) return mirrorEntry;
    }
  } catch {
    // Mirror miss — fall through to live API
  }

  // Fall back to live wiki API
  return fetchWikiEntryByTitle(title);
}

const formatDate = (seconds?: number) => {
  const date = seconds ? new Date(seconds * 1000) : new Date();
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
};

const daysSince = (seconds?: number) => {
  if (!seconds) return 0;
  return Math.max(0, Math.floor((Date.now() - seconds * 1000) / 86_400_000));
};

const stableNumber = (seed: string, min: number, max: number) => {
  const hash = Array.from(seed).reduce((total, char) => total + char.charCodeAt(0), 0);
  return min + (hash % (max - min + 1));
};

const extractImage = (contents?: string) => {
  const htmlMatch = contents?.match(/<img[^>]+src=["']([^"']+)["']/i);
  const bbcodeMatch = contents?.match(/\[img\]([^\[]+)\[\/img\]/i);
  const plainUrlMatch = contents?.match(imageUrlPattern);
  return htmlMatch?.[1] || bbcodeMatch?.[1] || plainUrlMatch?.[0] || officialNewsImage;
};

const classifyNews = (title: string): NewsItem['category'] => {
  const normalized = title.toLowerCase();
  if (/(cash shop|sale|package|premium surprise|wonderberry)/.test(normalized)) return 'Cash Shop';
  if (/(event|burning|sunday|miracle|challenger|login|reward)/.test(normalized)) return 'Event';
  if (/(patch|update|maintenance|v\.\d+)/.test(normalized)) return 'Patch Notes';
  return 'General';
};

const tagForCategory = (category: NewsItem['category']): NewsItem['tag'] => {
  if (category === 'Patch Notes') return 'primary';
  if (category === 'Event' || category === 'Cash Shop') return 'accent';
  return 'secondary';
};

const iconForTitle = (title: string) => {
  const normalized = title.toLowerCase();
  if (/(cash|sale|shop|package)/.test(normalized)) return 'ri-shopping-bag-3-line';
  if (/(burning|fire|blaze)/.test(normalized)) return 'ri-fire-line';
  if (/(sunny|sunday)/.test(normalized)) return 'ri-sun-line';
  if (/(miracle|magic|star)/.test(normalized)) return 'ri-magic-line';
  return 'ri-calendar-event-line';
};

const rarityForTitle = (title: string): EventItem['rarity'] => {
  const normalized = title.toLowerCase();
  if (/(miracle|marvel|premium|legendary)/.test(normalized)) return 'Legendary';
  if (/(sunday|weekly)/.test(normalized)) return 'Weekly';
  return 'Seasonal';
};

const sourceImageForGuide = (source: string) => {
  if (source === 'Grandis Library') return 'https://grandislibrary.com/headers/verdel.png';
  return officialNewsImage;
};

const grandisUrlForPath = (path: string) => absoluteUrl(path, 'https://grandislibrary.com');

const grandisProxyUrlsFor = (url: string) => {
  try {
    const parsed = new URL(url, window.location.origin);
    if (parsed.hostname !== 'grandislibrary.com') return [url];
    return [`/api/grandis-library${parsed.pathname}${parsed.search}`, parsed.toString()];
  } catch {
    return [url];
  }
};

const liveGuideDbCacheKey = (guide: GuideItem) => `grandis-guide-detail:${guide.id}:${guide.sourceUrl || ''}`;

const readLiveGuideDbCache = async (guide: GuideItem) => {
  if (!guide.sourceUrl) return null;

  try {
    const record = await mapleSqlApi.realtimeContent.get<GuideDetailDbPayload>(liveGuideDbCacheKey(guide));
    const cachedGuide = record.payload?.guide;
    const contentHtml = sanitizeMirroredHtml(cachedGuide?.contentHtml || record.content_html || '');
    if (!cachedGuide || !contentHtml) return null;
    return {
      ...guide,
      ...cachedGuide,
      contentHtml,
      contentText: cachedGuide.contentText || record.content_text,
      sourceSyncedAt: cachedGuide.sourceSyncedAt || guide.sourceSyncedAt || record.synced_at || record.updated_at,
    };
  } catch {
    return null;
  }
};

const writeLiveGuideDbCache = async (guide: GuideItem) => {
  if (!guide.sourceUrl || !guide.contentHtml) return;

  const expiresAt = new Date(Date.now() + realtimeCacheDurations.long).toISOString();
  const contentHtml = sanitizeMirroredHtml(guide.contentHtml);
  if (!contentHtml) return;
  const sanitizedGuide = { ...guide, contentHtml };
  try {
    await mapleSqlApi.realtimeContent.upsert<GuideDetailDbPayload>({
      key: liveGuideDbCacheKey(guide),
      source: 'grandis-library',
      source_url: guide.sourceUrl,
      content_type: 'guide-detail',
      payload: { guide: sanitizedGuide },
      content_text: guide.contentText || '',
      content_html: contentHtml,
      expires_at: expiresAt,
    });
  } catch {
    // The database cache is best-effort. Direct live fetching still works without it.
  }
};

// Never execute JavaScript downloaded from a content source. If an upstream page
// exposes only client-rendered placeholders, keep the sanitized server HTML and
// provide its source link instead of evaluating its application chunks.
const renderGrandisArticleFromChunk = async (_html: string, _sourceUrl: string) => '';

const guideDifficultyForTitle = (title: string): GuideItem['difficulty'] => {
  const normalized = title.toLowerCase();
  if (/(beginner|glossary|introduction|level content|link skills|legion)/.test(normalized)) return 'Beginner';
  if (/(boss|hexa|6th|challenger|endgame|hard|liberation|matrix|node)/.test(normalized)) return 'Advanced';
  return 'Intermediate';
};

const guideItem = (input: {
  id: string;
  title: string;
  sourceLabel: string;
  sourceUrl: string;
  classLabel: string;
  excerpt: string;
  guideSection: NonNullable<GuideItem['guideSection']>;
  image?: string;
  versions?: string[];
  author?: string;
  sourceSyncedAt?: string;
}): GuideItem => ({
  id: input.id,
  title: input.title,
  class: input.classLabel,
  guideSection: input.guideSection,
  difficulty: guideDifficultyForTitle(input.title),
  length: `${stableNumber(input.title, 4, 12)} min`,
  upvotes: stableNumber(`${input.sourceLabel}:${input.title}`, 24, 380),
  author: input.author || input.sourceLabel,
  versions: input.versions || ['gms'],
  image: input.image || sourceImageForGuide(input.sourceLabel),
  excerpt: input.excerpt,
  sourceLabel: input.sourceLabel,
  sourceUrl: input.sourceUrl,
  sourceSyncedAt: input.sourceSyncedAt,
});

const nearestPreviousHeading = (node: Element | null) => {
  let current = node?.previousElementSibling || null;
  while (current) {
    if (/^h[1-6]$/i.test(current.tagName)) return stripMarkup(current.textContent || '');
    current = current.previousElementSibling;
  }
  return '';
};

const grandisClassGroupForContainer = (node: Element | null) => {
  let current = node?.previousElementSibling || null;
  while (current) {
    if (current.tagName.toLowerCase() === 'h2') return stripMarkup(current.textContent || '');
    current = current.previousElementSibling;
  }
  return 'Class Overview';
};

const grandisClassGroupPaths: Record<string, string> = {
  Explorers: 'explorers',
  'Cygnus Knights': 'cygnus-knights',
  Heroes: 'heroes',
  Resistance: 'resistance',
  Nova: 'nova',
  Sengoku: 'sengoku',
  Flora: 'flora',
  Anima: 'anima',
  Jianghu: 'jianghu',
  Shine: 'shine',
  Other: 'other',
};

const grandisClassPortraits: Record<string, Array<[string, string]>> = {
  Explorers: [
    ['hero', 'Hero'],
    ['paladin', 'Paladin'],
    ['dark-knight', 'Dark Knight'],
    ['bishop', 'Bishop'],
    ['arch-mage-ice-lightning', 'Arch Mage (Ice, Lightning)'],
    ['arch-mage-fire-poison', 'Arch Mage (Fire, Poison)'],
    ['dual-blade', 'Dual Blade'],
    ['shadower', 'Shadower'],
    ['night-lord', 'Night Lord'],
    ['pathfinder', 'Pathfinder'],
    ['marksman', 'Marksman'],
    ['bowmaster', 'Bowmaster'],
    ['cannoneer', 'Cannoneer'],
    ['buccaneer', 'Buccanner'],
    ['corsair', 'Corsair'],
  ],
  'Cygnus Knights': [
    ['dawn-warrior', 'Dawn Warrior'],
    ['thunder-breaker', 'Thunder Breaker'],
    ['night-walker', 'Night Walker'],
    ['wind-archer', 'Wind Archer'],
    ['blaze-wizard', 'Blaze Wizard'],
    ['mihile', 'Mihile'],
  ],
  Heroes: [
    ['mercedes', 'Mercedes'],
    ['aran', 'Aran'],
    ['phantom', 'Phantom'],
    ['luminous', 'Luminous'],
    ['evan', 'Evan'],
    ['shade', 'Shade'],
  ],
  Resistance: [
    ['battle-mage', 'Battle Mage'],
    ['blaster', 'Blaster'],
    ['mechanic', 'Mechanic'],
    ['wild-hunter', 'Wild Hunter'],
    ['xenon', 'Xenon'],
    ['demon-slayer', 'Demon Slayer'],
    ['demon-avenger', 'Demon Avenger'],
  ],
  Nova: [
    ['angelic-buster', 'Angelic Buster'],
    ['kaiser', 'Kaiser'],
    ['cadena', 'Cadena'],
    ['kain', 'Kain'],
  ],
  Sengoku: [
    ['kanna', 'Kanna'],
    ['hayato', 'Hayato'],
  ],
  Flora: [
    ['adele', 'Adele'],
    ['ark', 'Ark'],
    ['illium', 'Illium'],
    ['khali', 'Khali'],
  ],
  Anima: [
    ['hoyoung', 'Hoyoung'],
    ['lara', 'Lara'],
    ['ren', 'Ren'],
  ],
  Jianghu: [
    ['lynn', 'Lynn'],
    ['mo-xuan', 'Mo Xuan'],
  ],
  Shine: [
    ['sia-astelle', 'Sia Astelle'],
    ['erel-light', 'Erel Light'],
  ],
  Other: [
    ['kinesis', 'Kinesis'],
    ['zero', 'Zero'],
  ],
};

const grandisClassUrl = (group: string, name: string) =>
  grandisUrlForPath(`/${grandisClassGroupPaths[group] || slugFromText(group)}/${slugFromText(name)}`);

const grandisGuideSectionForPath = (path: string): GuideItem['guideSection'] | null => {
  const firstPart = path
    .replace(/^\/?contents?(?=\/|$)/i, 'content')
    .replace(/^\/?events?(?=\/|$)/i, 'events')
    .split('/')
    .filter(Boolean)[0] || '';
  if (firstPart === 'content') return 'Content';
  if (firstPart === 'events') return 'Events';
  if (Object.values(grandisClassGroupPaths).includes(firstPart)) return 'Classes';
  return null;
};

const normalizedGrandisHostname = (hostname: string) => hostname.replace(/^www\./i, '').toLowerCase();

const normalizedGrandisPath = (pathname: string) =>
  (pathname
    .replace(/\/+$/, '')
    .replace(/^\/contents?(?=\/|$)/i, '/content')
    .replace(/^\/events?(?=\/|$)/i, '/events') || '');

const grandisGuideSlugForPath = (path: string) => {
  const parts = normalizedGrandisPath(path).split('/').filter(Boolean);
  const section = grandisGuideSectionForPath(parts.join('/'));
  if (!section) return slugFromText(path);
  if (section === 'Content' || section === 'Events') return slugFromText(parts.slice(1).join('/'));
  return slugFromText(parts.join('/'));
};

const grandisGuideIdForPath = (path: string) => {
  const section = grandisGuideSectionForPath(path);
  if (!section) return null;
  return `grandis-${section.toLowerCase()}-${grandisGuideSlugForPath(path)}`;
};

const grandisLocalGuideHref = (href: string, base: string) => {
  if (!href || href.startsWith('#')) return null;

  try {
    const url = new URL(href, base);
    if (normalizedGrandisHostname(url.hostname) !== 'grandislibrary.com') return null;

    const path = normalizedGrandisPath(url.pathname);
    const basePath = normalizedGrandisPath(new URL(base).pathname);
    if (path === basePath && url.hash) return url.hash;

    if (!path || path === '/content') return '/guides?section=content';
    if (path === '/classes') return '/guides?section=classes';
    if (path === '/events') return '/guides?section=events';

    const guideId = grandisGuideIdForPath(path);
    if (!guideId) return null;

    return `/guides/${guideId}${url.hash}`;
  } catch {
    return null;
  }
};

const parseGrandisArticle = (html: string, sourceUrl: string) => {
  if (typeof window === 'undefined') {
    const text = stripMarkup(html);
    return { html: text, text };
  }

  const doc = new DOMParser().parseFromString(html, 'text/html');
  const root = doc.querySelector('#main-content')?.cloneNode(true) as HTMLElement | null;
  const article = root || doc.body;
  article.querySelectorAll('script, style, nav, footer, .navbar, [id^="nn_"], [class*="Ads__"], [class*="HeaderImage__"], [class*="DarkOverlay"]').forEach((node) => node.remove());
  article.querySelectorAll('[class]').forEach((node) => {
    const className = node.getAttribute('class') || '';
    if (/lazyload-placeholder|lazyload-wrapper/.test(className)) node.remove();
  });
  article.querySelectorAll('a[href]').forEach((node) => {
    const href = node.getAttribute('href') || '';
    if (href.startsWith('/guides')) return;
    const localHref = grandisLocalGuideHref(href, sourceUrl);
    if (localHref) {
      node.setAttribute('href', localHref);
      node.removeAttribute('target');
      node.removeAttribute('rel');
      return;
    }

    if (href.startsWith('#')) {
      node.removeAttribute('target');
      node.removeAttribute('rel');
      return;
    }

    node.setAttribute('href', absoluteUrl(href, sourceUrl));
    node.setAttribute('target', '_blank');
    node.setAttribute('rel', 'noreferrer');
  });

  article.querySelectorAll('img[src]').forEach((node) => {
    const src = node.getAttribute('src') || '';
    node.setAttribute('src', absoluteUrl(src, sourceUrl));
    node.setAttribute('loading', 'lazy');
  });
  article.querySelectorAll('iframe[src], video[src], source[src]').forEach((node) => {
    const src = node.getAttribute('src') || '';
    node.setAttribute('src', absoluteUrl(src, sourceUrl));
  });
  article.querySelectorAll('h2, h3').forEach((node) => {
    if (!node.id) node.id = slugFromText(node.textContent || '');
  });

  const text = stripMarkup(article.textContent || '');
  return {
    html: article.innerHTML,
    text,
  };
};

const enhanceGrandisClassLanding = (article: HTMLElement, sourceUrl: string) => {
  const containers = Array.from(article.querySelectorAll<HTMLElement>('div[class*="ClassContainer"]'));
  if (!containers.length) return;

  // Collect every group's data before mutating the DOM.
  const groups = containers.map((container) => {
    const group = grandisClassGroupForContainer(container);
    const listedNames = Array.from(container.querySelectorAll('p[class*="FilterTitle"]'))
      .map((node) => stripMarkup(node.textContent || ''))
      .filter(Boolean);
    const knownPortraits = grandisClassPortraits[group] || [];
    const portraits = knownPortraits.length > 0
      ? knownPortraits.filter(([, label]) => listedNames.length === 0 || listedNames.includes(label))
      : listedNames.map((name) => [slugFromText(name), name] as [string, string]);
    const groupPath = grandisClassGroupPaths[group] || slugFromText(group);
    return { group, groupPath, portraits };
  });

  // Remove the original per-group h2 headings and ClassContainer divs.
  containers.forEach((c) => {
    let prev = c.previousElementSibling;
    while (prev && prev.tagName.toLowerCase() !== 'h2') prev = prev.previousElementSibling;
    if (prev) prev.remove();
    c.remove();
  });

  // Build separate group sections: h2 heading + container per group (GL layout).
  groups.forEach(({ group, groupPath, portraits }) => {
    const heading = article.ownerDocument.createElement('h2');
    heading.className = 'grandis-class-group-heading';
    heading.textContent = group;

    const container = article.ownerDocument.createElement('div');
    container.className = 'grandis-class-group-container';

    portraits.forEach(([slug, name]) => {
      const anchor = article.ownerDocument.createElement('a');
      anchor.href = grandisLocalGuideHref(`/${groupPath}/${slug}`, sourceUrl) || `/guides/grandis-classes-${slugFromText(`${groupPath}-${slug}`)}`;
      anchor.className = 'grandis-class-portrait-link';
      anchor.setAttribute('aria-label', name);

      const image = article.ownerDocument.createElement('img');
      image.src = absoluteUrl(`/class-portrait/${slug}.png`, sourceUrl);
      image.alt = name;
      image.loading = 'lazy';

      anchor.append(image);
      container.append(anchor);
    });

    article.append(heading, container);
  });
};

export const parseGrandisSectionPage = (
  html: string,
  section: GrandisGuideSection,
  sourceUrl: string,
  sourceSyncedAt = new Date().toISOString(),
): GrandisGuideSectionPage => {
  if (typeof window === 'undefined') {
    const text = stripMarkup(html);
    return { section, html: text, text, sourceUrl, sourceSyncedAt };
  }

  const doc = new DOMParser().parseFromString(html, 'text/html');
  const root = doc.querySelector('#main-content')?.cloneNode(true) as HTMLElement | null;
  const article = root || doc.body;

  article.querySelectorAll('script, style, nav, footer, .navbar, [id^="nn_"], [class*="Ads__"]').forEach((node) => node.remove());
  // Classes section: static HTML only has text + lazyload placeholders (images loaded by JS).
  // Restore the portrait grid with real images from Grandis Library CDN.
  if (section === 'classes') enhanceGrandisClassLanding(article, sourceUrl);
  article.querySelectorAll('[class]').forEach((node) => {
    const className = node.getAttribute('class') || '';
    if (/lazyload-placeholder|lazyload-wrapper/.test(className)) node.remove();
  });

  if (section !== 'classes') {
    article.querySelectorAll<HTMLElement>('.card, [class*="ContentCard"]').forEach((card) => {
      const title = stripMarkup(card.querySelector('.card-title, [class*="ContentCardTitle"]')?.textContent || '');
      if (!title) return;
      const fallbackHref = `/guides/grandis-${section}-${slugFromText(title)}`;
      card.querySelectorAll<HTMLAnchorElement>('a').forEach((anchor) => {
        if (!anchor.getAttribute('href')) anchor.setAttribute('href', fallbackHref);
      });
    });
  }

  article.querySelectorAll('a[href]').forEach((node) => {
    const href = node.getAttribute('href') || '';
    if (href.startsWith('/guides')) return;
    const localHref = grandisLocalGuideHref(href, sourceUrl);
    if (localHref) {
      node.setAttribute('href', localHref);
      node.removeAttribute('target');
      node.removeAttribute('rel');
      return;
    }

    if (href.startsWith('#')) {
      node.removeAttribute('target');
      node.removeAttribute('rel');
      return;
    }

    node.setAttribute('href', absoluteUrl(href, sourceUrl));
    node.setAttribute('target', '_blank');
    node.setAttribute('rel', 'noreferrer');
  });

  article.querySelectorAll<HTMLAnchorElement>('a[href^="/guides/"]').forEach((anchor) => {
    anchor.dataset.guideRegion = 'gms';
    anchor.dataset.guideSourceSyncedAt = sourceSyncedAt;
    const card = anchor.closest<HTMLElement>('.card, [class*="ContentCard"]');
    if (!card || card.querySelector('.maplehub-guide-card-meta')) return;
    const metadata = article.ownerDocument.createElement('div');
    metadata.className = 'maplehub-guide-card-meta';
    metadata.setAttribute('aria-label', 'GMS · Grandis Library');
    metadata.innerHTML = '<span>GMS</span><span>Grandis Library</span>';
    card.append(metadata);
  });

  const sourceHeading = article.querySelector('h1');
  if (sourceHeading && /^(content|classes|events)$/i.test(stripMarkup(sourceHeading.textContent || ''))) {
    sourceHeading.remove();
  }

  article.querySelectorAll('img[src]').forEach((node) => {
    const src = node.getAttribute('src') || '';
    node.setAttribute('src', absoluteUrl(src, sourceUrl));
    node.setAttribute('loading', 'lazy');
  });
  article.querySelectorAll('iframe[src], video[src], source[src]').forEach((node) => {
    const src = node.getAttribute('src') || '';
    node.setAttribute('src', absoluteUrl(src, sourceUrl));
  });
  article.querySelectorAll('h2, h3').forEach((node) => {
    if (!node.id) node.id = slugFromText(node.textContent || '');
  });

  const text = stripMarkup(article.textContent || '');
  return {
    section,
    html: article.innerHTML,
    text,
    sourceUrl,
    sourceSyncedAt,
  };
};

const parseGrandisCardGuides = (
  html: string,
  guideSection: NonNullable<GuideItem['guideSection']>,
  fallbackExcerpt: string,
  sourceSyncedAt?: string,
) => {
  if (typeof window === 'undefined') return [] as GuideItem[];
  const doc = new DOMParser().parseFromString(html, 'text/html');

  return Array.from(doc.querySelectorAll('.card'))
    .map((card) => {
      const title = stripMarkup(card.querySelector('.card-title')?.textContent || '');
      const href = card.querySelector<HTMLAnchorElement>('a[href]')?.getAttribute('href') || '';
      const image = card.querySelector<HTMLImageElement>('img')?.getAttribute('src') || '';
      const sourceUrl = absoluteUrl(href, 'https://grandislibrary.com');
      const path = new URL(sourceUrl).pathname.replace(/\/+$/, '');
      const guideId = grandisGuideIdForPath(path);
      const excerpt = firstSentence(card.querySelector('.card-text')?.textContent || '', fallbackExcerpt);
      const section = nearestPreviousHeading(card.parentElement) || guideSection;
      if (!title || !href) return null;

      return guideItem({
        id: guideId || `grandis-${guideSection.toLowerCase()}-${slugFromText(href)}`,
        title,
        sourceLabel: 'Grandis Library',
        sourceUrl,
        classLabel: section,
        excerpt,
        guideSection,
        versions: ['gms'],
        sourceSyncedAt,
        image: image ? absoluteUrl(image, 'https://grandislibrary.com') : sourceImageForGuide('Grandis Library'),
      });
    })
    .filter((item): item is GuideItem => Boolean(item));
};

const parseGrandisGuides = (
  contentHtml: string,
  classesHtml: string,
  eventsHtml: string,
  syncedAt: { content: string; classes: string; events: string },
) => {
  if (typeof window === 'undefined') return [] as GuideItem[];
  const classDoc = new DOMParser().parseFromString(classesHtml, 'text/html');

  const contentGuides = parseGrandisCardGuides(
    contentHtml,
    'Content',
    'Grandis Library content guide.',
    syncedAt.content,
  );
  const eventGuides = parseGrandisCardGuides(
    eventsHtml,
    'Events',
    'Grandis Library event guide.',
    syncedAt.events,
  );

  const classGuides = Array.from(classDoc.querySelectorAll('div[class*="ClassContainer"]'))
    .flatMap((container) => {
      const group = grandisClassGroupForContainer(container);
      const groupPath = grandisClassGroupPaths[group] || slugFromText(group);
      return Array.from(container.querySelectorAll('p[class*="FilterTitle"]'))
        .map((node) => stripMarkup(node.textContent || ''))
        .filter(Boolean)
        .map((name) => {
          const sourceUrl = grandisClassUrl(group, name);
          return guideItem({
            id: grandisGuideIdForPath(`/${groupPath}/${slugFromText(name)}`) || `grandis-classes-${slugFromText(`${group}-${name}`)}`,
            title: `${name} Class Overview`,
            sourceLabel: 'Grandis Library',
            sourceUrl,
            classLabel: group,
            excerpt: `Grandis Library class overview for ${name}, including class identity, skills, boost nodes, hyper skills, and setup references where available.`,
            guideSection: 'Classes',
            versions: ['gms'],
            sourceSyncedAt: syncedAt.classes,
            image: sourceImageForGuide('Grandis Library'),
          });
        });
    });

  return uniqueById([...contentGuides, ...classGuides, ...eventGuides]);
};

const parseGucciTools = (html: string) => {
  if (typeof window === 'undefined') return [] as ToolResourceItem[];
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const sections = Array.from(doc.querySelectorAll('section.category'));
  return uniqueById(sections.flatMap((section) => {
    const category = stripMarkup(section.querySelector('.category-title')?.textContent || 'Tools');
    return Array.from(section.querySelectorAll<HTMLAnchorElement>('a.tool-card')).map((anchor) => {
      const name = stripMarkup(anchor.querySelector('.tool-name')?.textContent || anchor.textContent || '');
      const desc = firstSentence(anchor.querySelector('.tool-desc')?.textContent || '', 'Community MapleStory tool or resource.');
      const href = anchor.getAttribute('href') || '';
      const icon = stripMarkup(anchor.querySelector('.tool-icon')?.textContent || '');
      return {
        id: `gucci-${slugFromText(`${category}-${name}`)}`,
        name,
        desc,
        href,
        icon: icon || 'ri-tools-line',
        category,
        sourceLabel: 'GUCCI Guild Tools',
      };
    }).filter((item) => item.name && item.href);
  }));
};

const wikiCategoryForPage = (title: string, categories: string[] = []): WikiCategory => {
  const normalized = [title, ...categories.map((category) => category.replace(/^Category:/i, ''))].join(' ').toLowerCase();
  if (/(patch|update|updates|v\.\d+|kms|kmst|gms|tms|jms|msea|patch notes|release)/.test(normalized)) return 'updates';
  if (/(quest|quests|storyline|pre-requisite|pre-requisites|advancement quest)/.test(normalized)) return 'quests';
  if (/(npc|npcs|merchant|shop|store|vendor|24\s*hr|24hr|mobile store)/.test(normalized)) return 'npcs';
  if (/(boss|bosses|balrog|zakum|horntail|hilla|lotus|damien|lucid|will|seren|kalos|black mage|kaling|karing|verus hilla|gloom|darknell)/.test(normalized)) return 'bosses';
  if (/(job|jobs|class|classes|skill|skills|warrior|magician|bowman|thief|pirate|hero|mage|adele|kain|kanna)/.test(normalized)) return 'classes';
  if (/(monster|monsters|mob|mobs|enemy|enemies)/.test(normalized)) return 'monsters';
  if (/(location|locations|map|maps|town|towns|road|forest|river|temple|cave|tower|world|region|regions|area|areas|street|field|dungeon)/.test(normalized)) return 'locations';
  if (/(item|items|equipment|weapon|armor|ring|set|scroll|cube|symbol|chair|mount|medal|cash)/.test(normalized)) return 'items';
  if (/(content|system|systems|event|events|guide|mechanic|mechanics|arcane river|grandis|legion|union|familiar|potential|profession)/.test(normalized)) return 'content';
  return 'other';
};

const iconForWikiCategory: Record<WikiCategory, string> = {
  classes: 'ri-sword-line',
  locations: 'ri-map-pin-line',
  monsters: 'ri-skull-2-line',
  bosses: 'ri-ghost-2-line',
  npcs: 'ri-chat-quote-line',
  quests: 'ri-scroll-line',
  items: 'ri-shield-star-line',
  updates: 'ri-refresh-line',
  content: 'ri-book-2-line',
  other: 'ri-more-line',
};

const normalizeRegionalNews = (payload: unknown, version: GameVersion): NewsItem[] => {
  const source = Array.isArray(payload)
    ? payload
    : payload && typeof payload === 'object' && Array.isArray((payload as { items?: unknown[] }).items)
      ? (payload as { items: unknown[] }).items
      : [];

  return source.flatMap((item): NewsItem[] => {
    if (!item || typeof item !== 'object' || typeof (item as { id?: unknown }).id !== 'string') return [];
    const news = item as NewsItem;
    return [{
      ...news,
      versions: [version],
      image: getRegionalContentImage(news.image, version),
      sourceLanguage: isNewsContentLanguage(news.sourceLanguage)
        ? news.sourceLanguage
        : getNewsSourceLanguageForVersion(version),
    }];
  });
};

type GmsOfficialNews = {
  id: number;
  name: string;
  summary?: string;
  category: string;
  liveDate: string;
  imageThumbnail?: string;
};

type TmsBulletin = {
  bullentinId: string;
  bullentinCatId: string;
  startDate: string;
  title: string;
  urlLink?: string | null;
  thumbnail?: string | null;
};

const officialCategory = (value: string): NewsItem['category'] => {
  const normalized = value.toLowerCase();
  if (normalized.includes('event') || normalized.includes('活動') || normalized.includes('イベント')) return 'Event';
  if (normalized.includes('sale') || normalized.includes('cash') || normalized.includes('shop') || normalized.includes('商城')) return 'Cash Shop';
  if (normalized.includes('update') || normalized.includes('maintenance') || normalized.includes('更新') || normalized.includes('メンテナンス')) return 'Patch Notes';
  return 'General';
};

const displayDate = (publishedAt: string) => new Intl.DateTimeFormat('en-US', {
  year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC',
}).format(new Date(publishedAt));

const listingDateToIso = (value: string) => {
  const full = value.match(/(20\d{2})[./-](\d{1,2})[./-](\d{1,2})/);
  if (full) return new Date(Date.UTC(Number(full[1]), Number(full[2]) - 1, Number(full[3]))).toISOString();

  const short = value.match(/(\d{1,2})[./](\d{1,2})/);
  if (!short) return new Date().toISOString();
  const now = new Date();
  let year = now.getUTCFullYear();
  const candidate = new Date(Date.UTC(year, Number(short[2]) - 1, Number(short[1])));
  if (candidate.getTime() > now.getTime() + 31 * 86_400_000) year -= 1;
  return new Date(Date.UTC(year, Number(short[2]) - 1, Number(short[1]))).toISOString();
};

const newsItem = (input: {
  id: string;
  version: GameVersion;
  title: string;
  category: NewsItem['category'];
  publishedAt: string;
  sourceUrl: string;
  excerpt?: string;
  reads?: string;
  image?: string;
  author: string;
}): NewsItem => ({
  id: input.id,
  category: input.category,
  title: input.title.trim(),
  excerpt: input.excerpt?.trim() || input.title.trim(),
  author: input.author,
  date: displayDate(input.publishedAt),
  publishedAt: input.publishedAt,
  reads: input.reads || 'Official',
  sourceUrl: input.sourceUrl,
  tag: tagForCategory(input.category),
  versions: [input.version],
  image: input.image || getNewsFallbackImage(input.version),
  sourceLanguage: getNewsSourceLanguageForVersion(input.version),
});

const normalizeOfficialImageUrl = (value: string | null | undefined, pageUrl: string) => {
  if (!value) return '';
  try {
    const url = new URL(value.replace(/&amp;/g, '&').trim(), pageUrl);
    if (url.protocol === 'http:') url.protocol = 'https:';
    return url.protocol === 'https:' ? url.toString() : '';
  } catch {
    return '';
  }
};

const ignoredArticleImagePattern = /(?:doubleclick|facebook\.com\/tr|\/logo(?:[_./-]|$)|as_footer|icon_rating|\/ratings?\.|\/nexon\.(?:png|gif)|PP_vert|\/facebook\/maplestory\.png)/i;

export const extractOfficialArticleImage = (html: string, pageUrl: string) => {
  const document = new DOMParser().parseFromString(html, 'text/html');
  const contentSelectors = [
    '.new_board_con img',
    '.contents_wrap img',
    '.content-item img',
    '#contents_Subpage img',
    '.mBulletin-content img',
    '.notice-view img',
    '.view-content img',
    '.entry-content img',
    'article img',
    'main img',
  ];
  const imageNodes = contentSelectors.flatMap((selector) =>
    Array.from(document.querySelectorAll<HTMLImageElement>(selector)));
  const contentImages = imageNodes.flatMap((image) => {
    const width = Number(image.getAttribute('width') || 0);
    const height = Number(image.getAttribute('height') || 0);
    if ((width > 0 && width <= 2) || (height > 0 && height <= 2)) return [];
    const candidate = normalizeOfficialImageUrl(
      image.getAttribute('data-src') || image.getAttribute('data-original') || image.getAttribute('src'),
      pageUrl,
    );
    return candidate && !ignoredArticleImagePattern.test(candidate) ? [candidate] : [];
  });
  if (contentImages[0]) return contentImages[0];

  const socialImage = document.querySelector<HTMLMetaElement>(
    'meta[property="og:image"], meta[name="twitter:image"], meta[property="twitter:image"]',
  )?.content;
  const normalizedSocialImage = normalizeOfficialImageUrl(socialImage, pageUrl);
  if (normalizedSocialImage && !ignoredArticleImagePattern.test(normalizedSocialImage)) return normalizedSocialImage;

  const markdownImage = html.match(/!\[[^\]]*\]\((https?:\/\/[^)]+)\)/i)?.[1]
    || html.match(imageUrlPattern)?.[0];
  const normalizedMarkdownImage = normalizeOfficialImageUrl(markdownImage, pageUrl);
  return normalizedMarkdownImage && !ignoredArticleImagePattern.test(normalizedMarkdownImage)
    ? normalizedMarkdownImage
    : '';
};

const articleImageFetchUrls = (sourceUrl: string, version: GameVersion) => {
  const urls = [`/api/official-content/article?url=${encodeURIComponent(sourceUrl)}`];
  try {
    const source = new URL(sourceUrl);
    const proxyPrefix = version === 'kms'
      ? '/api/kms'
      : version === 'jms'
        ? '/api/jms'
        : version === 'msea'
          ? '/api/msea'
          : version === 'tms'
            ? '/api/tms'
            : '';
    if (proxyPrefix) urls.push(`${proxyPrefix}${source.pathname}${source.search}`);
  } catch {
    // The validated source URL remains available to the backend mirror.
  }
  return urls;
};

const fetchOfficialArticleImage = async (sourceUrl: string, version: GameVersion) => {
  for (const url of articleImageFetchUrls(sourceUrl, version)) {
    try {
      const html = await cachedTextFetch(url, {
        cacheKey: `official-article-image:${version}:${sourceUrl}:${url}`,
        freshMs: realtimeCacheDurations.long,
        staleMs: realtimeCacheDurations.week,
        timeoutMs: 8_000,
      });
      const image = extractOfficialArticleImage(html, sourceUrl);
      if (image) return image;
    } catch {
      // Try the next server-specific transport before keeping the branded fallback.
    }
  }
  return '';
};

const hydrateRegionalImages = async <T extends { image: string; sourceUrl: string }>(
  items: T[],
  version: GameVersion,
  limit = 12,
) => {
  const fallback = getNewsFallbackImage(version);
  return Promise.all(items.map(async (item, index) => {
    if (index >= limit || (item.image && item.image !== fallback && item.image !== officialNewsImage)) return item;
    const image = await fetchOfficialArticleImage(item.sourceUrl, version);
    return image ? { ...item, image } : { ...item, image: fallback };
  }));
};

const fetchGmsOfficialNews = async () => {
  let rows: GmsOfficialNews[];
  try {
    rows = await cachedJsonFetch<GmsOfficialNews[]>('/api/official-content/gms/news', {
      cacheKey: 'official-news:gms:backend',
      freshMs: realtimeCacheDurations.medium,
      staleMs: realtimeCacheDurations.week,
    });
  } catch {
    rows = await cachedJsonFetch<GmsOfficialNews[]>('https://g.nexonstatic.com/maplestory/cms/v1/news', {
      cacheKey: 'official-news:gms',
      freshMs: realtimeCacheDurations.medium,
      staleMs: realtimeCacheDurations.week,
    });
  }
  return rows.slice(0, 30).map((row) => {
    const category = officialCategory(row.category);
    return newsItem({
      id: `gms-${row.id}`,
      version: 'gms',
      title: row.name,
      category,
      publishedAt: row.liveDate,
      sourceUrl: `https://www.nexon.com/maplestory/news/${row.category.toLowerCase()}/${row.id}/${slugFromText(row.name)}`,
      excerpt: stripMarkup(row.summary),
      image: row.imageThumbnail ? absoluteUrl(row.imageThumbnail, 'https://g.nexonstatic.com') : undefined,
      author: 'MapleStory Global',
    });
  });
};

export const parseKmsListing = (html: string, category: NewsItem['category']) => {
  const document = new DOMParser().parseFromString(html, 'text/html');
  const seen = new Set<string>();
  return Array.from(document.querySelectorAll<HTMLAnchorElement>('a[href*="/News/Notice/"], a[href*="/News/Event/"]'))
    .flatMap((anchor): NewsItem[] => {
      const href = anchor.getAttribute('href');
      if (!href || !/\/(?:Notice\/(?:All|Notice|Inspection)\/\d+|Event\/\d+)$/i.test(href) || seen.has(href)) return [];
      const container = anchor.closest('li') || anchor.parentElement;
      const anchors = Array.from(container?.querySelectorAll<HTMLAnchorElement>(`a[href="${href}"]`) || []);
      const title = anchors
        .map((candidate) => candidate.textContent?.replace(/\s+/g, ' ').trim() || '')
        .find((text) => text && !/^20\d{2}[.\/-]/.test(text));
      if (!title) return [];
      seen.add(href);
      const publishedAt = listingDateToIso(container?.textContent || '');
      const image = anchors.map((candidate) => candidate.querySelector('img')?.getAttribute('src')).find(Boolean);
      return [newsItem({
        id: `kms-${slugFromText(href)}`,
        version: 'kms',
        title,
        category,
        publishedAt,
        sourceUrl: absoluteUrl(href, 'https://maplestory.nexon.com/'),
        image: image ? normalizeOfficialImageUrl(image, 'https://maplestory.nexon.com/') : undefined,
        author: '메이플스토리',
      })];
    });
};

const fetchKmsOfficialNews = async () => {
  const [newsPage, eventsPage] = await Promise.all([
    textFetchWithMetadata(['/api/official-content/kms/news', '/api/kms/News/Notice', 'https://maplestory.nexon.com/News/Notice']),
    textFetchWithMetadata(['/api/official-content/kms/events', '/api/kms/News/Event', 'https://maplestory.nexon.com/News/Event']),
  ]);
  const items = [...parseKmsListing(newsPage.text, 'General'), ...parseKmsListing(eventsPage.text, 'Event')].slice(0, 40);
  return hydrateRegionalImages(items, 'kms');
};

export const parseMseaListing = (html: string, category: NewsItem['category']) => {
  const document = new DOMParser().parseFromString(html, 'text/html');
  return Array.from(document.querySelectorAll('li.title_links')).flatMap((node, index): NewsItem[] => {
    const anchor = node.querySelector('a');
    const href = anchor?.getAttribute('href')?.trim();
    const title = anchor?.textContent?.replace(/\s+/g, ' ').trim();
    if (!href || !title) return [];
    const publishedAt = listingDateToIso(node.textContent || '');
    const sourceUrl = absoluteUrl(href.replace(/^http:/, 'https:'), 'https://www.maplesea.com/');
    const listingImage = node.querySelector<HTMLImageElement>('img');
    const image = normalizeOfficialImageUrl(
      listingImage?.getAttribute('data-src') || listingImage?.getAttribute('src'),
      sourceUrl,
    );
    return [newsItem({
      id: `msea-${category}-${slugFromText(sourceUrl)}-${index}`,
      version: 'msea', title, category, publishedAt, sourceUrl, image: image || undefined, author: 'MapleStorySEA',
    })];
  });
};

const fetchMseaOfficialNews = async () => {
  const [newsPage, eventsPage] = await Promise.all([
    textFetchWithMetadata(['/api/official-content/msea/news', '/api/msea/news/', 'https://www.maplesea.com/news/']),
    textFetchWithMetadata(['/api/official-content/msea/events', '/api/msea/events/', 'https://www.maplesea.com/events/']),
  ]);
  const items = [...parseMseaListing(newsPage.text, 'General'), ...parseMseaListing(eventsPage.text, 'Event')].slice(0, 30);
  return hydrateRegionalImages(items, 'msea');
};

export const parseJmsListing = (html: string) => {
  const document = new DOMParser().parseFromString(html, 'text/html');
  const tableItems = Array.from(document.querySelectorAll('table.notice-list tr')).flatMap((row, index): NewsItem[] => {
    const anchor = row.querySelector<HTMLAnchorElement>('td.ttl a');
    const title = anchor?.textContent?.replace(/\s+/g, ' ').trim();
    const href = anchor?.getAttribute('href');
    if (!title || !href) return [];
    const categoryText = row.querySelector('td.category')?.textContent || '';
    const publishedAt = listingDateToIso(row.querySelector('td.date')?.textContent || '');
    const listingImage = row.querySelector<HTMLImageElement>('img');
    const sourceUrl = absoluteUrl(href, 'https://maplestory.nexon.co.jp/');
    const image = normalizeOfficialImageUrl(
      listingImage?.getAttribute('data-src') || listingImage?.getAttribute('src'),
      sourceUrl,
    );
    return [newsItem({
      id: `jms-${slugFromText(href)}-${index}`,
      version: 'jms', title, category: officialCategory(categoryText), publishedAt,
      sourceUrl,
      image: image || undefined,
      reads: row.querySelector('td.view')?.textContent?.trim(),
      author: 'メイプルストーリー',
    })];
  });
  if (tableItems.length > 0) return tableItems;

  return (document.body.textContent || '').split('\n').flatMap((line, index): NewsItem[] => {
    const match = line.trim().match(/^\|\s*([^|]+?)\s*\|\s*\[([^\]]+)\]\((https:\/\/maplestory\.nexon\.co\.jp\/notice\/view\/[^)]+)\)\s*\|\s*(20\d{2}\.\d{2}\.\d{2})\s*\|\s*([^|]+?)\s*\|$/);
    if (!match) return [];
    return [newsItem({
      id: `jms-${slugFromText(match[3])}-${index}`,
      version: 'jms',
      title: match[2],
      category: officialCategory(match[1]),
      publishedAt: listingDateToIso(match[4]),
      sourceUrl: match[3],
      reads: match[5].trim(),
      author: 'メイプルストーリー',
    })];
  });
};

const fetchJmsOfficialNews = async () => {
  const page = await textFetchWithMetadata([
    '/api/official-content/jms/news',
    '/api/jms/notice/_noticelist/?id=all&p=1',
    'https://maplestory.nexon.co.jp/notice/_noticelist/?id=all&p=1',
  ]);
  return hydrateRegionalImages(parseJmsListing(page.text).slice(0, 30), 'jms');
};

const fetchTmsOfficialNews = async () => {
  try {
    const mirrored = await cachedJsonFetch<{
      data?: { myDataSet?: { table?: TmsBulletin[] } };
    }>('/api/official-content/tms/news', {
      cacheKey: 'official-news:tms:backend',
      freshMs: realtimeCacheDurations.medium,
      staleMs: realtimeCacheDurations.week,
    });
    const rows = mirrored.data?.myDataSet?.table || [];
    if (rows.length > 0) return hydrateRegionalImages(normalizeTmsBulletins(rows), 'tms');
  } catch {
    // Local Vite proxy fallback keeps standalone frontend development working.
  }

  const mainPage = await cachedTextFetch('/api/tms/main', {
    cacheKey: 'official-news:tms:csrf-page',
    freshMs: realtimeCacheDurations.medium,
    staleMs: realtimeCacheDurations.long,
    timeoutMs: 15_000,
  });
  const document = new DOMParser().parseFromString(mainPage, 'text/html');
  const token = document.querySelector<HTMLInputElement>('input[name="__RequestVerificationToken"]')?.value || '';
  const payload = await cachedJsonFetch<{
    data?: { myDataSet?: { table?: TmsBulletin[] } };
  }>('/api/tms/main?handler=BulletinProxy', {
    cacheKey: 'official-news:tms',
    freshMs: realtimeCacheDurations.medium,
    staleMs: realtimeCacheDurations.week,
    requestInit: {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        'X-CSRF-TOKEN': token,
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: new URLSearchParams({ Kind: '0', Page: '1', method: '0', PageSize: '20' }).toString(),
    },
  });
  return hydrateRegionalImages(normalizeTmsBulletins(payload.data?.myDataSet?.table || []), 'tms');
};

export const normalizeTmsBulletins = (rows: TmsBulletin[]) => rows.map((row) => newsItem({
    id: `tms-${row.bullentinId}`,
    version: 'tms',
    title: row.title,
    category: row.bullentinCatId === '72' ? 'Event' : row.bullentinCatId === '67' ? 'Patch Notes' : 'General',
    publishedAt: listingDateToIso(row.startDate),
    sourceUrl: row.urlLink || `https://maplestory.beanfun.com/bulletin?bid=${row.bullentinId}`,
    image: row.thumbnail ? normalizeOfficialImageUrl(row.thumbnail, 'https://maplestory.beanfun.com/') : undefined,
    author: '新楓之谷',
  }));

export async function fetchLiveNews(version: GameVersion): Promise<RemotePayload<NewsItem>> {
  if (version !== 'gms') {
    try {
      const feed = await mapleSqlApi.realtimeContent.get<unknown>(`news:${version}`);
      const mirroredItems = normalizeRegionalNews(feed.payload, version);
      if (mirroredItems.length > 0) {
        return { items: await hydrateRegionalImages(mirroredItems, version), replace: true };
      }
    } catch {
      // Fall through to the official website adapter when no server-side mirror exists.
    }
  }

  const items = version === 'gms'
    ? await fetchGmsOfficialNews()
    : version === 'kms'
      ? await fetchKmsOfficialNews()
    : version === 'msea'
      ? await fetchMseaOfficialNews()
      : version === 'jms'
        ? await fetchJmsOfficialNews()
        : version === 'tms'
          ? await fetchTmsOfficialNews()
          : [];
  return { items, replace: true };
}

export type OfficialArticleDocument = {
  html: string;
  text: string;
  sourceUrl: string;
};

export const officialArticleHref = (sourceUrl: string, title: string, version: GameVersion) => {
  const params = new URLSearchParams({ url: sourceUrl, title, server: version });
  return `/source?${params.toString()}`;
};

export async function fetchOfficialArticleDocument(
  sourceUrl: string,
  version: GameVersion,
): Promise<OfficialArticleDocument> {
  if (version === 'gms') {
    const id = sourceUrl.match(/\/news\/[^/]+\/(\d+)/i)?.[1];
    if (id) {
      const officialArticleUrl = `https://g.nexonstatic.com/maplestory/cms/v1/news/${id}`;
      const article = await cachedJsonFetch<{ body?: string }>(
        `/api/official-content/article?url=${encodeURIComponent(officialArticleUrl)}`,
        {
          cacheKey: `official-article:gms:${id}`,
          freshMs: realtimeCacheDurations.long,
          staleMs: realtimeCacheDurations.week,
        },
      );
      const html = sanitizeMirroredHtml(article.body || '', 'https://g.nexonstatic.com');
      return { html, text: stripMarkup(html), sourceUrl };
    }
  }

  const raw = await cachedTextFetch(`/api/official-content/article?url=${encodeURIComponent(sourceUrl)}`, {
    cacheKey: `official-article:${sourceUrl}`,
    freshMs: realtimeCacheDurations.long,
    staleMs: realtimeCacheDurations.week,
    timeoutMs: 20_000,
  });

  if (/^Title:\s/m.test(raw) && /Markdown Content:/m.test(raw)) {
    const text = raw.split(/Markdown Content:\s*/m)[1]?.trim() || raw;
    return { html: '', text, sourceUrl };
  }

  const document = new DOMParser().parseFromString(raw, 'text/html');
  const selector = version === 'msea'
    ? '#contents_Subpage'
    : version === 'kms'
      ? '.new_board_con, .contents_wrap'
    : version === 'jms'
      ? '.content-item'
      : version === 'tms'
        ? '.mBulletin-content'
        : 'main, article';
  const content = document.querySelector<HTMLElement>(selector) || document.body;
  const origin = new URL(sourceUrl).origin;
  const html = sanitizeMirroredHtml(content.innerHTML, origin);
  return { html, text: stripMarkup(html), sourceUrl };
}

export function normalizeEventFeed(payload: unknown, nowMs = Date.now(), version: GameVersion = 'gms'): EventItem[] {
  const candidates = Array.isArray(payload)
    ? payload
    : payload && typeof payload === 'object' && Array.isArray((payload as { items?: unknown[] }).items)
      ? (payload as { items: unknown[] }).items
      : [];

  const items = candidates.flatMap((candidate): EventItem[] => {
    const validation = validateEventData(candidate);
    if ('issues' in validation) {
      console.warn('[MapleHub] Rejected invalid event import.', validation.issues);
      return [];
    }

    const event = validation.value;
    if (Date.parse(event.windowEnd) <= nowMs) return [];
    return [{
      id: event.id,
      name: event.title,
      windowStart: event.windowStart,
      windowEnd: event.windowEnd,
      rewards: event.rewards,
      rarity: rarityForTitle(event.title),
      icon: iconForTitle(event.title),
      regions: event.regions,
      image: event.imageUrl || getNewsFallbackImage(version),
      sourceUrl: event.sourceUrl,
      sourceLabel: event.source,
      lastVerified: event.lastVerified,
    }];
  });

  return items;
}

export async function fetchLiveEvents(version: GameVersion): Promise<RemotePayload<EventItem>> {
  let feed;
  try {
    feed = await mapleSqlApi.realtimeContent.get<unknown>(`events:${version}`);
  } catch {
    feed = await mapleSqlApi.realtimeContent.get<unknown>('events');
  }
  const items = await hydrateRegionalImages(normalizeEventFeed(feed.payload, Date.now(), version), version);

  return { items, replace: true };
}

export async function fetchLiveGuides(): Promise<RemotePayload<GuideItem>> {
  const [content, classes, events] = await Promise.all([
    textFetchWithMetadata(grandisContentUrls, { freshMs: realtimeCacheDurations.long, staleMs: realtimeCacheDurations.week }),
    textFetchWithMetadata(grandisClassUrls, { freshMs: realtimeCacheDurations.long, staleMs: realtimeCacheDurations.week }),
    textFetchWithMetadata(grandisEventsUrls, { freshMs: realtimeCacheDurations.long, staleMs: realtimeCacheDurations.week }),
  ]);

  return {
    items: parseGrandisGuides(content.text, classes.text, events.text, {
      content: content.sourceSyncedAt,
      classes: classes.sourceSyncedAt,
      events: events.sourceSyncedAt,
    }),
    replace: true,
  };
}

export async function fetchGrandisGuideSectionPage(section: GrandisGuideSection): Promise<GrandisGuideSectionPage> {
  const urls = section === 'classes'
    ? grandisClassUrls
    : section === 'events' ? grandisEventsUrls : grandisContentUrls;
  const sourceUrl = `https://grandislibrary.com/${section}`;
  const page = await textFetchWithMetadata(urls, {
    freshMs: realtimeCacheDurations.long,
    staleMs: realtimeCacheDurations.week,
  });

  return parseGrandisSectionPage(page.text, section, sourceUrl, page.sourceSyncedAt);
}

export async function fetchLiveGuideContent(guide: GuideItem): Promise<GuideItem> {
  if (!guide.sourceUrl) return guide;

  const dbCachedGuide = await readLiveGuideDbCache(guide);
  if (dbCachedGuide) return dbCachedGuide;

  const page = await textFetchWithMetadata(grandisProxyUrlsFor(guide.sourceUrl), {
    freshMs: realtimeCacheDurations.long,
    staleMs: realtimeCacheDurations.week,
  });
  const renderedArticleHtml = await renderGrandisArticleFromChunk(page.text, guide.sourceUrl);
  const parsed = parseGrandisArticle(
    renderedArticleHtml ? `<div id="main-content">${renderedArticleHtml}</div>` : page.text,
    guide.sourceUrl,
  );

  const nextGuide = {
    ...guide,
    contentHtml: parsed.html,
    contentText: parsed.text,
    excerpt: guide.excerpt || firstSentence(parsed.text, `${guide.title} from Grandis Library.`),
    sourceSyncedAt: page.sourceSyncedAt,
  };
  void writeLiveGuideDbCache(nextGuide);
  return nextGuide;
}

const warnedInvalidToolImports = new Set<string>();

export async function fetchLiveToolResources(): Promise<RemotePayload<ToolResourceItem>> {
  const gucciHtml = await textFetch(gucciToolUrls, {
    freshMs: realtimeCacheDurations.long,
    staleMs: realtimeCacheDurations.week,
  });
  const candidates = parseGucciTools(gucciHtml);
  const lastVerified = new Date().toISOString();
  const items = candidates.filter((item) => {
    const validation = validateToolData({
      id: item.id,
      name: item.name,
      href: item.href,
      category: item.category,
      regions: ['all'],
      source: item.sourceLabel,
      sourceUrl: item.href,
      lastVerified,
    });
    if ('issues' in validation && !warnedInvalidToolImports.has(item.id)) {
      warnedInvalidToolImports.add(item.id);
      console.warn('[MapleHub] Rejected invalid tool import.', item.id, validation.issues);
    }
    return validation.ok;
  });
  return { items, replace: true };
}

export async function fetchLiveWikiEntries(): Promise<RemotePayload<WikiEntry>> {
  const catalogResponses = await Promise.allSettled(
    wikiCatalogSources.map(async ({ source, from }) => {
      const pages: WikiApiPage[] = [];
      let gapContinue = '';

      for (let pageIndex = 0; pageIndex < 4; pageIndex += 1) {
        const params: Record<string, string | number> = {
          action: 'query',
          generator: 'allpages',
          gapnamespace: 0,
          gaplimit: 100,
          prop: 'info|categories',
          cllimit: 12,
          inprop: 'url',
          format: 'json',
          origin: '*',
        };
        if (gapContinue) {
          params.gapcontinue = gapContinue;
        } else {
          params.gapfrom = from;
        }

        const data = await jsonFetch<{
          continue?: {
            gapcontinue?: string;
          };
          query?: { pages?: Record<string, WikiApiPage> };
        }>(source.urls, params, { freshMs: realtimeCacheDurations.long, staleMs: realtimeCacheDurations.week });

        pages.push(...Object.values(data.query?.pages || {}).filter((item) => item.pageid > 0 && item.title));
        if (!data.continue?.gapcontinue) break;
        gapContinue = data.continue.gapcontinue;
      }

      return {
        source,
        pages,
      };
    }),
  );

  const catalogPages = catalogResponses.flatMap((response) => (response.status === 'fulfilled' ? [response.value] : []));
  const seen = new Set<string>();
  const items = catalogPages.flatMap(({ source, pages }) =>
    pages
      .filter((page) => {
        const key = `${source.key}:${page.pageid}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .map((page) =>
        wikiEntryFromPage(
          source,
          {
            pageid: page.pageid,
            title: page.title,
            categories: page.categories,
          },
        ),
      ),
  );

  return { items: mergeWikiEntriesByTitle(items), replace: true };
}

export async function fetchWikiSearchEntries(query: string): Promise<RemotePayload<WikiEntry>> {
  const trimmedQuery = query.trim();
  if (trimmedQuery.length < 2) return { items: [], replace: true };

  const searchResponses = await Promise.allSettled(
    wikiSearchSources.map(async (source) => {
      const data = await jsonFetch<{ query?: { search?: WikiSearchResult[] } }>(source.urls, {
        action: 'query',
        list: 'search',
        srsearch: trimmedQuery,
        srnamespace: 0,
        srlimit: 10,
        srprop: 'snippet|wordcount|timestamp',
        format: 'json',
        origin: '*',
      }, { freshMs: 30 * 1000, staleMs: realtimeCacheDurations.medium });

      return {
        source,
        results: data.query?.search || [],
      };
    }),
  );

  const sourceResults = searchResponses.flatMap((response) => (response.status === 'fulfilled' ? [response.value] : []));
  const categoryResponses = await Promise.allSettled(
    sourceResults.map(async ({ source, results }) => {
      const pageids = results.map((result) => result.pageid).join('|');
      if (!pageids) return { source, pages: {} as Record<string, WikiApiPage> };

      const data = await jsonFetch<{ query?: { pages?: Record<string, WikiApiPage> } }>(source.urls, {
        action: 'query',
        pageids,
        prop: 'categories',
        cllimit: 12,
        format: 'json',
        origin: '*',
      }, { freshMs: realtimeCacheDurations.medium, staleMs: realtimeCacheDurations.week });

      return {
        source,
        pages: data.query?.pages || {},
      };
    }),
  );
  const categoriesByKey = new Map<string, WikiApiPage['categories']>();
  categoryResponses.forEach((response) => {
    if (response.status !== 'fulfilled') return;
    Object.values(response.value.pages).forEach((page) => {
      categoriesByKey.set(`${response.value.source.key}:${page.pageid}`, page.categories || []);
    });
  });

  const parsedPages = await Promise.allSettled(
    sourceResults.flatMap(({ source, results }) =>
      results.slice(0, 10).map(async (result) => {
        return {
          source,
          result,
          parsedPage: await fetchWikiPageText(source, result.title),
        };
      }),
    ),
  );

  const parsedByKey = new Map<string, ParsedWikiPage>();
  parsedPages.forEach((response) => {
    if (response.status !== 'fulfilled') return;
    parsedByKey.set(`${response.value.source.key}:${response.value.result.pageid}`, response.value.parsedPage);
  });

  const items = sourceResults.flatMap(({ source, results }) =>
    results.map((result): WikiEntry =>
      wikiEntryFromPage(
        source,
        {
          ...result,
          categories: categoriesByKey.get(`${source.key}:${result.pageid}`),
        },
        parsedByKey.get(`${source.key}:${result.pageid}`),
      ),
    ),
  );

  return { items: mergeWikiEntriesByTitle(items), replace: true };
}
