import type { WikiCategory, WikiEntry } from '@/mocks/wiki';
import { apiEndpoint } from './apiEndpoint';
import { mapleSqlApi, type WikiMirrorPageRecord } from './mapleSqlApi';
import { cachedJsonFetch, cachedTextFetch, cachedValueLoad, getRealtimeCacheSavedAt, realtimeCacheDurations } from './realtimeCache';
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
  /** Locale-specific editorial editions. These may rewrite framing, category and CTA for the target audience. */
  localizedEditions?: Partial<Record<NewsContentLanguage, NewsLocalizedEdition>>;
};

export type NewsContentLanguage = 'en' | 'zh' | 'zh-Hant' | 'ja' | 'ko';

export type NewsTranslation = {
  title: string;
  excerpt: string;
};

export type NewsLocalizedEdition = {
  title: string;
  summary: string;
  categoryLabel: string;
  actionLabel: string;
  searchTerms?: string[];
  editorialStatus: 'reviewed' | 'draft';
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
  localizedLanguage?: NewsContentLanguage;
  localizedCopy?: {
    title: string;
    classLabel: string;
    difficulty: string;
    length: string;
    excerpt?: string;
  };
};

export type ToolResourceItem = {
  id: string;
  name: string;
  desc: string;
  href: string;
  icon: string;
  category: string;
  sourceLabel: string;
  localizedLanguage?: NewsContentLanguage;
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
  localizedLanguage?: NewsContentLanguage;
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
  localizedLanguage?: NewsContentLanguage;
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

type WikiLanguageLinksResponse = {
  query?: {
    pages?: Record<string, {
      pageid?: number;
      title?: string;
      langlinks?: Array<{ lang: string; '*': string }>;
    }>;
  };
};

type LocalizedWikiParseResponse = {
  parse?: {
    title?: string;
    displaytitle?: string;
    text?: { '*': string };
  };
};

type ParsedWikiPage = {
  text: string;
  html: string;
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
const officialNewsImage = '/static/images/vendor/g.nexonstatic.com/1200x628-v269-ride-the-lightning-update-maplestory-fb1a1bc0b2.webp';
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

const grandisClassUrls = ['https://grandislibrary.com/classes'];
const grandisContentUrls = ['https://grandislibrary.com/content'];
const grandisEventsUrls = ['https://grandislibrary.com/events'];
const gucciToolUrls = ['https://gucciguild.com/tools'];

const mapleStoryWikiApiUrls = ['https://maplestorywiki.net/api.php'];

const wikiSearchSources = [
  {
    key: 'mswiki',
    label: 'MapleStory Wiki',
    host: 'maplestorywiki.net',
    urls: mapleStoryWikiApiUrls,
  },
] as const;

const localizedWikiSources: Partial<Record<NewsContentLanguage, {
  langLink: 'zh' | 'ko';
  urls: string[];
  host: string;
  variant?: 'zh-cn' | 'zh-tw';
  label: string;
  articleBaseUrl: string;
}>> = {
  zh: {
    langLink: 'zh',
    urls: ['https://maplestory.fandom.com/zh/api.php'],
    host: 'maplestory.fandom.com',
    variant: 'zh-cn',
    label: 'MapleStory Wiki 中文版',
    articleBaseUrl: 'https://maplestory.fandom.com/zh/wiki/',
  },
  'zh-Hant': {
    langLink: 'zh',
    urls: ['https://maplestory.fandom.com/zh/api.php'],
    host: 'maplestory.fandom.com',
    variant: 'zh-tw',
    label: 'MapleStory Wiki 中文版',
    articleBaseUrl: 'https://maplestory.fandom.com/zh/wiki/',
  },
  ko: {
    langLink: 'ko',
    urls: ['https://maplestory.fandom.com/ko/api.php'],
    host: 'maplestory.fandom.com',
    label: '메이플스토리 위키',
    articleBaseUrl: 'https://maplestory.fandom.com/ko/wiki/',
  },
};

const localizedWikiTitleCandidates: Partial<Record<NewsContentLanguage, Record<string, string>>> = {
  zh: {
    'arcane river': '奧術之河',
    'black mage': '黑魔法師',
    damien: '戴米安',
    gloom: '戴斯克',
    grandis: 'Category:格蘭蒂斯',
    lotus: '史烏',
    lucid: '露希妲',
    magnus: '梅格耐斯',
    will: '威爾',
  },
  'zh-Hant': {
    'arcane river': '奧術之河',
    'black mage': '黑魔法師',
    damien: '戴米安',
    gloom: '戴斯克',
    grandis: 'Category:格蘭蒂斯',
    lotus: '史烏',
    lucid: '露希妲',
    magnus: '梅格耐斯',
    will: '威爾',
  },
  ko: {
    'arcane river': '아케인 리버',
    'black mage': '검은 마법사',
    bosses: '보스 몬스터',
    classes: '직업',
    damien: '데미안',
    grandis: '그란디스',
    magnus: '매그너스',
    'star force': '스타포스',
  },
};

type NativeWikiPageSource = {
  url: string;
  fetchUrl?: string;
  format?: 'html' | 'markdown';
  title: string;
  label: string;
  selector: string;
};

const maplerHouseNativePage = (
  locale: 'zh-cn' | 'zh-tw',
  path: string,
  title: string,
  label: string,
): NativeWikiPageSource => {
  const url = `https://www.maplerhouse.com/${locale}/${path}`;
  return {
    url,
    fetchUrl: `https://r.jina.ai/http://www.maplerhouse.com/${locale}/${path}`,
    format: 'markdown',
    title,
    label,
    selector: 'body',
  };
};

const nativeWikiPageSources: Partial<Record<NewsContentLanguage, Record<string, NativeWikiPageSource>>> = {
  zh: {
    classes: maplerHouseNativePage('zh-cn', 'classes', '职业介绍', '冒险者小屋'),
    'link skill': maplerHouseNativePage('zh-cn', 'guide/basic/link-skills', 'Link技能', '冒险者小屋'),
    'legion system': maplerHouseNativePage('zh-cn', 'guide/basic/union', '联盟战地', '冒险者小屋'),
    bosses: maplerHouseNativePage('zh-cn', 'guide/boss/boss-overview', 'Boss数据', '冒险者小屋'),
  },
  'zh-Hant': {
    classes: maplerHouseNativePage('zh-tw', 'classes', '職業介紹', '冒險者小屋'),
    'link skill': maplerHouseNativePage('zh-tw', 'guide/basic/link-skills', '傳授技能', '冒險者小屋'),
    'legion system': maplerHouseNativePage('zh-tw', 'guide/basic/union', '聯盟戰地', '冒險者小屋'),
    bosses: maplerHouseNativePage('zh-tw', 'guide/boss/boss-overview', 'Boss數據', '冒險者小屋'),
  },
  ja: {
    classes: { url: 'https://maplestory.nexon.co.jp/job/list/', title: '職業紹介', label: 'メイプルストーリー公式', selector: 'article.job.list' },
    'characters and skills': { url: 'https://maplestory.nexon.co.jp/job/list/', title: '職業紹介', label: 'メイプルストーリー公式', selector: 'article.job.list' },
    'link skill': { url: 'https://maplestory.nexon.co.jp/gameguide/growth/linkskill/', title: 'リンクスキル', label: 'メイプルストーリー公式', selector: 'main article, article' },
    'legion system': { url: 'https://maplestory.nexon.co.jp/gameguide/growth/mapleunion/', title: 'メイプルユニオン', label: 'メイプルストーリー公式', selector: 'main article, article' },
    'arcane river': { url: 'https://maplestory.nexon.co.jp/gameguide/growth/force/', title: 'アーケインリバー', label: 'メイプルストーリー公式', selector: 'main article, article' },
    grandis: { url: 'https://maplestory.nexon.co.jp/gameguide/specialcontents/library/', title: 'グランディス', label: 'メイプルストーリー公式', selector: 'main article, article' },
    bosses: { url: 'https://maplestory.nexon.co.jp/gameguide/adventure/processboss/', title: 'ボスへの挑み方', label: 'メイプルストーリー公式', selector: 'main article, article' },
    'star force': { url: 'https://maplestory.nexon.co.jp/gameguide/item/enhance/', title: 'スターフォース', label: 'メイプルストーリー公式', selector: 'main article, article' },
    potential: { url: 'https://maplestory.nexon.co.jp/gameguide/item/enhance/', title: '潜在能力', label: 'メイプルストーリー公式', selector: 'main article, article' },
    equipment: { url: 'https://maplestory.nexon.co.jp/gameguide/item/arms/', title: '装備', label: 'メイプルストーリー公式', selector: 'main article, article' },
    'hexa matrix': { url: 'https://maplestory.nexon.co.jp/gameguide/growth/sixthjob/', title: '6次転職', label: 'メイプルストーリー公式', selector: 'main article, article' },
    locations: { url: 'https://maplestory.nexon.co.jp/gameguide/adventure/', title: '冒険', label: 'メイプルストーリー公式', selector: 'main article, article' },
  },
};

const wikiCatalogSources = [
  {
    source: wikiSearchSources[0],
    from: '!',
  },
] as const;

const buildRequestUrl = (url: string, params: Record<string, string | number>) => {
  const requestUrl = new URL(url, typeof window === 'undefined' ? 'http://localhost' : window.location.origin);
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
          freshMs: cacheOptions.freshMs ?? realtimeCacheDurations.refresh,
          staleMs: cacheOptions.staleMs ?? realtimeCacheDurations.medium,
        });
      } catch (error) {
        lastError = error;
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Live source failed');
};

const directWikiJsonFetch = async <T,>(
  url: string,
  params: Record<string, string | number>,
  cacheOptions: { freshMs?: number; staleMs?: number } = {},
) => {
  const requestUrl = buildRequestUrl(url, params).toString();
  return cachedValueLoad(`wiki-api-direct:${requestUrl}`, async () => {
    const response = await fetch(requestUrl, { cache: 'no-store' });
    if (!response.ok) throw new Error(`Wiki source failed with ${response.status}`);
    return response.json() as Promise<T>;
  }, {
    freshMs: cacheOptions.freshMs ?? realtimeCacheDurations.refresh,
    staleMs: cacheOptions.staleMs ?? realtimeCacheDurations.week,
  });
};

const textFetchWithMetadata = async (
  urls: string[],
  cacheOptions: {
    freshMs?: number;
    staleMs?: number;
    timeoutMs?: number;
    suppressFailureCooldown?: boolean;
  } = {},
): Promise<{ text: string; sourceSyncedAt: string }> => {
  let lastError: unknown = null;

  for (const url of urls) {
    const requestUrl = new URL(url, typeof window === 'undefined' ? 'http://localhost' : window.location.origin);
    const candidateUrls = [requestUrl.toString()];

    for (const candidateUrl of candidateUrls) {
      try {
        const cacheKey = `live-content:${candidateUrl}`;
        const text = await cachedTextFetch(candidateUrl, {
          cacheKey,
          freshMs: cacheOptions.freshMs ?? realtimeCacheDurations.refresh,
          staleMs: cacheOptions.staleMs ?? realtimeCacheDurations.week,
          timeoutMs: cacheOptions.timeoutMs ?? 50_000,
          transform: sanitizeMirroredHtml,
          suppressFailureCooldown: cacheOptions.suppressFailureCooldown,
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
  cacheOptions: { freshMs?: number; staleMs?: number; timeoutMs?: number } = {},
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
  if (typeof DOMParser === 'undefined' || !html) {
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
    contentLanguage: 'en',
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
    console.warn('[MPStorys] Rejected invalid mirrored wiki record.', page.id, validation.issues);
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
    contentLanguage: 'en',
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
    console.warn('[MPStorys] Rejected invalid hydrated wiki content.', entry.id, validation.issues);
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
    { freshMs: realtimeCacheDurations.refresh, staleMs: realtimeCacheDurations.week },
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

const normalizeWikiContentLanguage = (language: string): NewsContentLanguage => {
  const normalized = language.trim().toLowerCase();
  if (normalized.startsWith('zh-hant') || normalized.startsWith('zh-tw') || normalized.startsWith('zh-hk')) return 'zh-Hant';
  if (normalized.startsWith('zh')) return 'zh';
  if (normalized.startsWith('ja')) return 'ja';
  if (normalized.startsWith('ko')) return 'ko';
  return 'en';
};

const escapeStaticHtml = (value: string) => value
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const renderLocalizedMarkdownInline = (value: string) => escapeStaticHtml(value)
  .replace(/!\[([^\]]*)\]\((https?:\/\/[^)]+)\)/g, (_match, alt: string, url: string) => (
    `\x3cimg src="${url.replace(/^http:/, 'https:')}" alt="${alt}" loading="lazy">`
  ))
  .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, (_match, label: string, url: string) => (
    `\x3ca href="${url.replace(/^http:/, 'https:')}" target="_blank" rel="noreferrer">${label}\x3c/a>`
  ))
  .replace(/\*\*([^*]+)\*\*/g, '\x3cstrong>$1\x3c/strong>')
  .replace(/`([^`]+)`/g, '\x3ccode>$1\x3c/code>');

const renderLocalizedMarkdown = (value: string) => {
  const content = value.includes('Markdown Content:') ? value.split('Markdown Content:').slice(1).join('Markdown Content:') : value;
  const lines = content.replace(/\r/g, '').split('\n');
  const output: string[] = [];
  let index = 0;
  let listOpen = false;
  const closeList = () => {
    if (!listOpen) return;
    output.push('\x3c/ul>');
    listOpen = false;
  };

  while (index < lines.length) {
    const line = lines[index].trim();
    if (!line) {
      closeList();
      index += 1;
      continue;
    }

    if (line.startsWith('|') && lines[index + 1]?.trim().match(/^\|(?:\s*:?-+:?\s*\|)+$/)) {
      closeList();
      const tableLines: string[] = [line];
      index += 2;
      while (index < lines.length && lines[index].trim().startsWith('|')) {
        tableLines.push(lines[index].trim());
        index += 1;
      }
      const rows = tableLines.map((row) => row.slice(1, -1).split('|').map((cell) => cell.trim()));
      output.push('\x3ctable>\x3cthead>\x3ctr>', ...rows[0].map((cell) => `\x3cth>${renderLocalizedMarkdownInline(cell)}\x3c/th>`), '\x3c/tr>\x3c/thead>\x3ctbody>');
      rows.slice(1).forEach((row) => {
        output.push('\x3ctr>', ...row.map((cell) => `\x3ctd>${renderLocalizedMarkdownInline(cell)}\x3c/td>`), '\x3c/tr>');
      });
      output.push('\x3c/tbody>\x3c/table>');
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      closeList();
      const level = Math.min(6, heading[1].length + 1);
      output.push(`\x3ch${level}>${renderLocalizedMarkdownInline(heading[2])}\x3c/h${level}>`);
      index += 1;
      continue;
    }

    const listItem = line.match(/^[-*]\s+(.+)$/);
    if (listItem) {
      if (!listOpen) {
        output.push('\x3cul>');
        listOpen = true;
      }
      output.push(`\x3cli>${renderLocalizedMarkdownInline(listItem[1])}\x3c/li>`);
      index += 1;
      continue;
    }

    closeList();
    output.push(`\x3cp>${renderLocalizedMarkdownInline(line)}\x3c/p>`);
    index += 1;
  }
  closeList();
  return output.join('');
};

const fetchNativeWikiPageEdition = async (
  entry: WikiEntry,
  targetLanguage: NewsContentLanguage,
): Promise<WikiEntry> => {
  const sourceTitle = normalizedWikiTitle(entry.sourcePageTitle || entry.title);
  const source = nativeWikiPageSources[targetLanguage]?.[sourceTitle];
  if (!source) return entry;

  const sourceHtml = await cachedTextFetch(source.fetchUrl || source.url, {
    cacheKey: `wiki-localized:native:${targetLanguage}:${sourceTitle}`,
    freshMs: realtimeCacheDurations.refresh,
    staleMs: realtimeCacheDurations.week,
    transform: (value) => value,
  });
  const sourceHost = new URL(source.url).hostname;
  let localizedHtml = '';
  if (source.format === 'markdown') {
    localizedHtml = renderLocalizedMarkdown(sourceHtml);
  } else {
    if (typeof DOMParser === 'undefined') return entry;
    const sourceDocument = new DOMParser().parseFromString(sourceHtml, 'text/html');
    const article = sourceDocument.querySelector(source.selector);
    if (!article) return entry;
    localizedHtml = article.outerHTML;
  }
  const parsedPage = parseWikiHtml(localizedHtml, sourceHost);
  if (!parsedPage.html || !parsedPage.text) return entry;
  return {
    ...entry,
    title: source.title,
    titleZh: targetLanguage === 'zh' || targetLanguage === 'zh-Hant' ? source.title : entry.titleZh,
    description: firstSentence(parsedPage.text, source.title),
    descriptionZh: targetLanguage === 'zh' || targetLanguage === 'zh-Hant'
      ? firstSentence(parsedPage.text, source.title)
      : entry.descriptionZh,
    content: parsedPage.text,
    contentZh: targetLanguage === 'zh' || targetLanguage === 'zh-Hant' ? parsedPage.text : entry.contentZh,
    htmlContent: parsedPage.html,
    htmlContentZh: targetLanguage === 'zh' || targetLanguage === 'zh-Hant' ? parsedPage.html : entry.htmlContentZh,
    contentLanguage: targetLanguage,
    sources: uniqueWikiSources([
      { label: source.label, href: source.url },
      ...(entry.sources || []),
    ]),
  };
};

/**
 * Replaces the English mirror with an upstream community edition written for
 * the requested language. This is source localization, not machine translation.
 */
export async function fetchLocalizedWikiEntry(entry: WikiEntry, language: string): Promise<WikiEntry> {
  const targetLanguage = normalizeWikiContentLanguage(language);
  if (targetLanguage === 'en' || entry.contentLanguage === targetLanguage) return entry;

  const nativeEdition = await fetchNativeWikiPageEdition(entry, targetLanguage).catch(() => entry);
  if (nativeEdition.contentLanguage === targetLanguage) return nativeEdition;

  const source = localizedWikiSources[targetLanguage];
  if (!source) return entry;

  const sourceTitle = entry.sourcePageTitle || entry.title;
  let localizedSourceTitle = localizedWikiTitleCandidates[targetLanguage]?.[normalizedWikiTitle(sourceTitle)];
  if (!localizedSourceTitle) {
    const languageLinks = await directWikiJsonFetch<WikiLanguageLinksResponse>(mapleStoryWikiApiUrls[0], {
      action: 'query',
      titles: sourceTitle,
      prop: 'langlinks',
      lllimit: 'max',
      format: 'json',
      origin: '*',
    }, { freshMs: realtimeCacheDurations.week, staleMs: realtimeCacheDurations.week });
    const sourcePage = Object.values(languageLinks.query?.pages || {})[0];
    localizedSourceTitle = sourcePage?.langlinks?.find((link) => link.lang === source.langLink)?.['*'];
  }
  if (!localizedSourceTitle) return entry;

  const params: Record<string, string | number> = {
    action: 'parse',
    page: localizedSourceTitle,
    prop: 'text|displaytitle',
    format: 'json',
    origin: '*',
  };
  if (source.variant) params.variant = source.variant;

  const localizedPayload = await directWikiJsonFetch<LocalizedWikiParseResponse>(source.urls[0], params, {
    freshMs: realtimeCacheDurations.refresh,
    staleMs: realtimeCacheDurations.week,
  });
  const localizedHtml = localizedPayload.parse?.text?.['*'] || '';
  if (!localizedHtml) return entry;

  const parsedPage = parseWikiHtml(localizedHtml, source.host);
  if (!parsedPage.html || !parsedPage.text) return entry;
  const localizedTitle = stripMarkup(localizedPayload.parse?.displaytitle || '')
    || localizedPayload.parse?.title
    || localizedSourceTitle;
  const sourceUrl = `${source.articleBaseUrl}${encodeURIComponent(localizedSourceTitle.replace(/ /g, '_'))}`;

  return {
    ...entry,
    title: localizedTitle,
    titleZh: targetLanguage === 'zh' || targetLanguage === 'zh-Hant' ? localizedTitle : entry.titleZh,
    description: firstSentence(parsedPage.text, localizedTitle),
    descriptionZh: targetLanguage === 'zh' || targetLanguage === 'zh-Hant'
      ? firstSentence(parsedPage.text, localizedTitle)
      : entry.descriptionZh,
    content: parsedPage.text,
    contentZh: targetLanguage === 'zh' || targetLanguage === 'zh-Hant' ? parsedPage.text : entry.contentZh,
    htmlContent: parsedPage.html,
    htmlContentZh: targetLanguage === 'zh' || targetLanguage === 'zh-Hant' ? parsedPage.html : entry.htmlContentZh,
    contentLanguage: targetLanguage,
    sources: uniqueWikiSources([
      { label: source.label, href: sourceUrl },
      ...(entry.sources || []),
    ]),
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
    }, { freshMs: realtimeCacheDurations.refresh, staleMs: realtimeCacheDurations.week });
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
  const sourceTitleAliases: Record<string, string> = {
    locations: 'Maple World',
  };
  const sourceTitle = sourceTitleAliases[normalizedTitle] || title;

  // Try local mirror first
  try {
    const mirrorTitle = sourceTitle.replace(/\s+/g, '_');
    const mirrorPage = await cachedValueLoad(
      `wiki-mirror:title:${mirrorTitle}`,
      () => mapleSqlApi.wikiMirror.getPageByTitle(mirrorTitle),
      { freshMs: realtimeCacheDurations.refresh, staleMs: realtimeCacheDurations.week },
    );
    if (mirrorPage?.content_html) {
      const mirrorEntry = wikiEntryFromMirrorRecord(mirrorPage);
      if (mirrorEntry) {
        return sourceTitle === title ? mirrorEntry : {
          ...mirrorEntry,
          title,
          sourcePageTitle: sourceTitle,
        };
      }
    }
  } catch {
    // Mirror miss — fall through to live API
  }

  // Fall back to live wiki API
  const liveEntry = await fetchWikiEntryByTitle(sourceTitle);
  if (!liveEntry || sourceTitle === title) return liveEntry;
  return {
    ...liveEntry,
    title,
    sourcePageTitle: sourceTitle,
  };
}

const prefetchedWikiEntries = new Map<string, Promise<WikiEntry | null>>();

const loadWikiEntryForLocale = async (title: string, language: string) => {
  const entry = await fetchWikiEntryByTitleLocalFirst(title);
  if (!entry) return null;
  return fetchLocalizedWikiEntry(entry, language).catch(() => entry);
};

export function fetchWikiEntryForLocale(title: string, language: string): Promise<WikiEntry | null> {
  if (typeof window === 'undefined') return loadWikiEntryForLocale(title, language);

  const key = `${normalizeWikiContentLanguage(language)}:${normalizedWikiTitle(title)}`;
  const existing = prefetchedWikiEntries.get(key);
  if (existing) return existing;

  if (prefetchedWikiEntries.size >= 30) {
    const oldestKey = prefetchedWikiEntries.keys().next().value;
    if (oldestKey) prefetchedWikiEntries.delete(oldestKey);
  }

  const request = loadWikiEntryForLocale(title, language);
  prefetchedWikiEntries.set(key, request);
  void request.then((entry) => {
    if (!entry && prefetchedWikiEntries.get(key) === request) prefetchedWikiEntries.delete(key);
  }).catch(() => {
    if (prefetchedWikiEntries.get(key) === request) prefetchedWikiEntries.delete(key);
  });
  return request;
}

export const prefetchWikiEntryForLocale = (title: string, language: string) =>
  fetchWikiEntryForLocale(title, language);

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
  if (source === 'Grandis Library') return '/static/images/vendor/grandislibrary.com/verdel-801df7a4ba.webp';
  return officialNewsImage;
};

const grandisUrlForPath = (path: string) => absoluteUrl(path, 'https://grandislibrary.com');

const grandisLegacyContentPaths: Record<string, string> = {
  '/content/boss-pre-quests': '/content/boss-matchmaking-pre-quests',
  '/content/upgrading-and-enhancing-equipment': '/content/upgrading-enhancing-equipment',
};

const canonicalGrandisSourceUrl = (url: string) => {
  try {
    const parsed = new URL(url, typeof window === 'undefined' ? 'http://localhost' : window.location.origin);
    if (normalizedGrandisHostname(parsed.hostname) !== 'grandislibrary.com') return url;
    parsed.hostname = 'grandislibrary.com';
    parsed.pathname = grandisLegacyContentPaths[normalizedGrandisPath(parsed.pathname)] || parsed.pathname;
    return parsed.toString();
  } catch {
    return url;
  }
};

const grandisProxyUrlsFor = (url: string) => {
  try {
    const canonicalUrl = canonicalGrandisSourceUrl(url);
    const parsed = new URL(canonicalUrl, typeof window === 'undefined' ? 'http://localhost' : window.location.origin);
    if (normalizedGrandisHostname(parsed.hostname) !== 'grandislibrary.com') return [url];
    return canonicalUrl === url ? [canonicalUrl] : [canonicalUrl, url];
  } catch {
    return [url];
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

const grandisClassUrl = (group: string, name: string) => {
  const rawSlug = slugFromText(name);
  const classSlug = rawSlug === 'buccanner' ? 'buccaneer' : rawSlug;
  return grandisUrlForPath(`/${grandisClassGroupPaths[group] || slugFromText(group)}/${classSlug}`);
};

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
  if (typeof DOMParser === 'undefined') {
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
    node.setAttribute('decoding', 'async');
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
  if (typeof DOMParser === 'undefined') {
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
  if (typeof DOMParser === 'undefined') return [] as GuideItem[];
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
  if (typeof DOMParser === 'undefined') return [] as GuideItem[];
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
  if (typeof DOMParser === 'undefined') return [] as ToolResourceItem[];
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const sections = Array.from(doc.querySelectorAll('section.category'));
  return uniqueById(sections.flatMap((section) => {
    const categoryLabel = stripMarkup(section.querySelector('.category-title')?.textContent || 'Tools');
    const normalizedCategory = categoryLabel.toLowerCase();
    const category = normalizedCategory.includes('official')
      ? 'official'
      : normalizedCategory.includes('database') || normalizedCategory.includes('wiki')
        ? 'database'
        : normalizedCategory.includes('calculator') || normalizedCategory.includes('planner')
          ? 'calculator'
          : normalizedCategory.includes('guide')
            ? 'guide'
            : normalizedCategory.includes('community')
              ? 'community'
              : normalizedCategory.includes('trading') || normalizedCategory.includes('economy')
                ? 'tracker'
                : 'utility';
    return Array.from(section.querySelectorAll<HTMLAnchorElement>('a.tool-card')).map((anchor) => {
      const name = stripMarkup(anchor.querySelector('.tool-name')?.textContent || anchor.textContent || '');
      const desc = firstSentence(anchor.querySelector('.tool-desc')?.textContent || '', 'Community MapleStory tool or resource.');
      const href = anchor.getAttribute('href') || '';
      const icon = stripMarkup(anchor.querySelector('.tool-icon')?.textContent || '');
      return {
        id: `gucci-${slugFromText(`${categoryLabel}-${name}`)}`,
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
  quests: 'ri-file-paper-line',
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
      translations: version === 'jms'
        ? getJmsEditorialTranslations(news.sourceUrl) || news.translations
        : news.translations,
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
  localizedEditions?: NewsItem['localizedEditions'];
};

type TmsBulletin = {
  bullentinId: string;
  bullentinCatId: string;
  startDate: string;
  endDate?: string;
  title: string;
  urlLink?: string | null;
  thumbnail?: string | null;
};

// The TMS bulletin endpoint requires a server-side anti-forgery exchange and
// occasionally rejects the hosted edge worker. Keep a reviewed recent snapshot
// so a temporary upstream failure never empties the TMS news and event views.
const tmsBundledBulletins: TmsBulletin[] = [
  { bullentinId: '82108', bullentinCatId: '72', startDate: '2026/07/15', title: '【黃金蘋果】燃燒之戒' },
  { bullentinId: '82107', bullentinCatId: '72', startDate: '2026/07/15', title: '【魔法畫框】強力卷軸 限時販售！' },
  { bullentinId: '82106', bullentinCatId: '72', startDate: '2026/07/15', title: '【閃亮彗星】赤月的妖怪＆愛心俏魔女' },
  { bullentinId: '82105', bullentinCatId: '72', startDate: '2026/07/15', title: '【皇家美容院】里耶＆蒂娜髮型、銀河系夜臉型' },
  { bullentinId: '82104', bullentinCatId: '72', startDate: '2026/07/15', title: '【水球活動】時髦汪洋套組、闇夜靜謐/闇夜深淵交換券、職業組合包' },
  { bullentinId: '82109', bullentinCatId: '68', startDate: '2026/07/14', title: '新楓之谷《0715(三) CROWN例行維護關機公告》' },
  { bullentinId: '82066', bullentinCatId: '67', startDate: '2026/07/08', title: '新楓之谷《0708(三)CROWN例行維護開機公告》' },
  { bullentinId: '82054', bullentinCatId: '72', startDate: '2026/07/08', title: '【潘朵拉箱子】強力裝備 限定販售！' },
  { bullentinId: '82052', bullentinCatId: '72', startDate: '2026/07/08', title: '【跳框洗洗樂】跳框3倍！一日限定販售方塊限時推出' },
  { bullentinId: '82065', bullentinCatId: '68', startDate: '2026/07/07', title: '新楓之谷《0708(三) CROWN例行維護關機公告》' },
  { bullentinId: '82045', bullentinCatId: '68', startDate: '2026/07/06', title: '新楓之谷《0706(一) 全伺服器分段分流維護公告》' },
  { bullentinId: '81045', bullentinCatId: '68', startDate: '2026/07/02', title: '新楓之谷《0702(四) 挑戰者伺服器分段分流維護公告》' },
  { bullentinId: '81028', bullentinCatId: '67', startDate: '2026/07/01', title: '新楓之谷《0701(三)CROWN例行維護開機公告》' },
  { bullentinId: '81023', bullentinCatId: '72', startDate: '2026/07/01', title: '【全新道具】神諭者的戒指&神諭者的遺產組合包(7/1 13:25更新)' },
  { bullentinId: '81020', bullentinCatId: '72', startDate: '2026/07/01', title: '【魔法馬車】全新椅子/騎寵、復刻時裝 妮洛&莉莉' },
  { bullentinId: '81019', bullentinCatId: '72', startDate: '2026/07/01', title: '【超級傳播者】雙排傳說潛能，靠這顆' },
  { bullentinId: '81018', bullentinCatId: '68', startDate: '2026/06/30', title: '新楓之谷《0701(三) CROWN例行維護關機公告》' },
  { bullentinId: '80998', bullentinCatId: '68', startDate: '2026/06/26', title: '新楓之谷《0626(五)修改第二組密碼功能頁面暫停服務說明》' },
  { bullentinId: '80996', bullentinCatId: '68', startDate: '2026/06/25', title: '新楓之谷《0625(四)V279版本異常遊戲行為制裁公告》' },
  { bullentinId: '80988', bullentinCatId: '68', startDate: '2026/06/24', title: '《0625(四) 全伺服器臨時維護公告》' },
];

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
  sourceLanguage?: NewsContentLanguage;
  translations?: NewsItem['translations'];
  localizedEditions?: NewsItem['localizedEditions'];
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
  sourceLanguage: input.sourceLanguage || getNewsSourceLanguageForVersion(input.version),
  translations: input.translations,
  localizedEditions: input.localizedEditions,
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

const articleImageFetchUrls = (sourceUrl: string, _version: GameVersion) =>
  [apiEndpoint(`/official-content/article?url=${encodeURIComponent(sourceUrl)}`)];

const fetchOfficialArticleImage = async (sourceUrl: string, version: GameVersion) => {
  for (const url of articleImageFetchUrls(sourceUrl, version)) {
    try {
      const html = await cachedTextFetch(url, {
        cacheKey: `official-article-image:${version}:${sourceUrl}:${url}`,
        freshMs: realtimeCacheDurations.refresh,
        staleMs: realtimeCacheDurations.week,
        timeoutMs: 50_000,
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
  const rows = await cachedJsonFetch<GmsOfficialNews[]>(apiEndpoint('/official-content/gms/news'), {
    cacheKey: 'official-news:gms:backend',
    freshMs: realtimeCacheDurations.short,
    staleMs: realtimeCacheDurations.week,
  });
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
      localizedEditions: row.localizedEditions,
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

type OrangeMushroomKmsPost = {
  ID?: number;
  id?: number;
  title?: string | { rendered?: string };
  URL?: string;
  link?: string;
  date?: string;
  date_gmt?: string;
  excerpt?: string | { rendered?: string };
  featured_image?: string;
  jetpack_featured_media_url?: string;
  author?: { name?: string };
  categories?: Record<string, unknown> | number[];
  tags?: Record<string, unknown> | number[];
  slug?: string;
  content?: string | { rendered?: string };
};

type OrangeMushroomKmsFeed = {
  posts?: OrangeMushroomKmsPost[];
};

const orangeMushroomFeedUrl = 'https://public-api.wordpress.com/wp/v2/sites/orangemushroom.net/posts';
const orangeMushroomCategoryIds = { KMS: 36821, KMST: 2066266 } as const;

const orangeMushroomRenderedText = (value: string | { rendered?: string } | undefined) =>
  typeof value === 'string' ? value : value?.rendered || '';

const decodeHtmlText = (value = '') => {
  if (typeof DOMParser === 'undefined') return stripMarkup(value);
  const document = new DOMParser().parseFromString(value, 'text/html');
  return (document.body.textContent || '').replace(/\[…\]|\[\.\.\.\]/g, '').replace(/\s+/g, ' ').trim();
};

const orangeMushroomKmsCategory = (post: OrangeMushroomKmsPost): NewsItem['category'] => {
  const title = decodeHtmlText(orangeMushroomRenderedText(post.title));
  const labels = [...Object.keys(post.categories || {}), ...Object.keys(post.tags || {})].join(' ');
  const searchable = `${title} ${labels}`;
  if (/\b(?:event|anniversary|collab(?:oration)?|festival|burning)\b|이벤트/i.test(searchable)) return 'Event';
  if (/\b(?:kms?t?\s+ver\.?|update|patch|changes?|remaster|fix(?:es)?)\b/i.test(searchable)) return 'Patch Notes';
  return 'General';
};

export const normalizeOrangeMushroomKmsCoverage = (feeds: OrangeMushroomKmsFeed[]) => {
  const seen = new Set<number>();
  return feeds
    .flatMap((feed) => Array.isArray(feed.posts) ? feed.posts : [])
    .flatMap((post): NewsItem[] => {
      const id = post.ID || post.id;
      if (!id || seen.has(id)) return [];
      const title = decodeHtmlText(orangeMushroomRenderedText(post.title));
      const sourceUrl = normalizeOfficialImageUrl(post.URL || post.link, 'https://orangemushroom.net/');
      const sourceDate = post.date || (post.date_gmt ? `${post.date_gmt}Z` : '');
      const publishedAt = sourceDate && !Number.isNaN(Date.parse(sourceDate))
        ? new Date(sourceDate).toISOString()
        : '';
      if (!title || !sourceUrl || !publishedAt) return [];
      seen.add(id);
      return [newsItem({
        id: `orange-mushroom-kms-${id}`,
        version: 'kms',
        title,
        category: orangeMushroomKmsCategory(post),
        publishedAt,
        sourceUrl,
        excerpt: decodeHtmlText(orangeMushroomRenderedText(post.excerpt)) || title,
        image: normalizeOfficialImageUrl(post.featured_image || post.jetpack_featured_media_url, sourceUrl) || undefined,
        author: decodeHtmlText(post.author?.name) || 'Orange Mushroom',
        sourceLanguage: 'en',
      })];
    })
    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))
    .slice(0, 40);
};

const fetchOrangeMushroomKmsCoverage = async () => {
  const feeds = await Promise.all((['KMS', 'KMST'] as const).map(async (category) => {
    const url = new URL(orangeMushroomFeedUrl);
    url.searchParams.set('categories', String(orangeMushroomCategoryIds[category]));
    url.searchParams.set('per_page', '24');
    url.searchParams.set('_fields', 'id,date_gmt,link,title,excerpt,jetpack_featured_media_url,categories,tags');
    const posts = await cachedJsonFetch<OrangeMushroomKmsPost[]>(url.toString(), {
      cacheKey: `official-news:kms:orange-mushroom:${category.toLowerCase()}:v2`,
      freshMs: realtimeCacheDurations.refresh,
      staleMs: realtimeCacheDurations.week,
      timeoutMs: 50_000,
    });
    return { posts };
  }));

  return normalizeOrangeMushroomKmsCoverage(feeds);
};

const fetchKmsOfficialNews = async () => {
  try {
    const [newsPage, eventsPage] = await Promise.all([
      textFetchWithMetadata([apiEndpoint('/official-content/kms/news')]),
      textFetchWithMetadata([apiEndpoint('/official-content/kms/events')]),
    ]);
    const items = [...parseKmsListing(newsPage.text, 'General'), ...parseKmsListing(eventsPage.text, 'Event')].slice(0, 40);
    if (items.length > 0) return hydrateRegionalImages(items, 'kms');
  } catch {
    // Nexon's Korean site intermittently rejects the edge proxy. Keep a
    // separately hosted KMS/KMST coverage source available as a fallback.
  }

  return fetchOrangeMushroomKmsCoverage();
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
    textFetchWithMetadata([apiEndpoint('/official-content/msea/news')]),
    textFetchWithMetadata([apiEndpoint('/official-content/msea/events')]),
  ]);
  const items = [...parseMseaListing(newsPage.text, 'General'), ...parseMseaListing(eventsPage.text, 'Event')].slice(0, 30);
  return hydrateRegionalImages(items, 'msea');
};

type EditorialTitleTranslations = Partial<Record<Exclude<NewsContentLanguage, 'ja'>, string>>;

const makeEditorialNewsTranslations = (titles: EditorialTitleTranslations): NewsItem['translations'] =>
  Object.fromEntries(Object.entries(titles).map(([language, title]) => [language, { title, excerpt: title }])) as NewsItem['translations'];

const jmsEditorialTranslations: Record<string, NewsItem['translations']> = Object.fromEntries(Object.entries({
  '9fc8b68f727147f489e6df5371c3ed8e': {
    en: 'Apology and response regarding an issue with the equipment-specific Miracle Time event',
    zh: '关于装备类别奇迹时间活动应用异常的致歉及处理公告',
    'zh-Hant': '關於裝備類別奇蹟時間活動套用異常的致歉及處理公告',
    ko: '장비별 미라클 타임 이벤트 적용 오류에 대한 사과 및 대응 안내',
  },
  '8b228593c490497e916cb10df82fbd66': {
    en: 'Temporary system maintenance on Wednesday, July 15',
    zh: '7月15日（周三）系统临时维护公告',
    'zh-Hant': '7月15日（週三）系統臨時維護公告',
    ko: '7월 15일(수) 시스템 임시 점검 안내',
  },
  '1a690fcb48c64c6b8d8f458d9d58a504': {
    en: "Wisp's Wondrous Wonderberry / Luna Crystal",
    zh: 'Wisp的神奇宠物箱／露娜水晶',
    'zh-Hant': 'Wisp的神奇寵物箱／露娜水晶',
    ko: '위습의 원더베리 / 루나 크리스탈',
  },
  'fd2ddba401c648b18edaf2d399a18e6e': {
    en: '“#Maple CCC CREW Support Mission” post campaign announced',
    zh: '“#Maple CCC CREW应援任务”投稿活动公告',
    'zh-Hant': '「#Maple CCC CREW應援任務」投稿活動公告',
    ko: '“#메이플 CCC CREW 응원 미션” 게시물 캠페인 안내',
  },
  '23be945847fd412cb1bc778856c2478a': {
    en: 'Special Sunday Maple',
    zh: '特别周日冒险岛',
    'zh-Hant': '特別週日楓之谷',
    ko: '스페셜 선데이 메이플',
  },
  'c9b13254c1354690ba2060d08b2edfbc': {
    en: '[Completed] Temporary shop and channel maintenance on Wednesday, July 8 (updated 13:10)',
    zh: '【已完成】7月8日（周三）商城及部分频道临时维护公告（13:10更新）',
    'zh-Hant': '【已完成】7月8日（週三）商城及部分頻道臨時維護公告（13:10更新）',
    ko: '【완료】7월 8일(수) 상점 및 채널별 임시 점검 안내 (13:10 갱신)',
  },
  'b350585790b1473388733a946fad3a58': {
    en: 'Platinum Apple',
    zh: '白金苹果',
    'zh-Hant': '白金蘋果',
    ko: '플래티넘 애플',
  },
  '1d26c6943f5f4280a23e83438acbcb6d': {
    en: '“#Maple CCC Support Comment” post campaign announced',
    zh: '“#Maple CCC应援评论”投稿活动公告',
    'zh-Hant': '「#Maple CCC應援留言」投稿活動公告',
    ko: '“#메이플 CCC 응원 댓글” 게시물 캠페인 안내',
  },
  'afc8b8d6638f4c0191b0d918fd3a76f3': {
    en: '[Completed] Temporary login and channel maintenance on Monday, July 6 (updated 19:30)',
    zh: '【已完成】7月6日（周一）登录及部分频道临时维护公告（19:30更新）',
    'zh-Hant': '【已完成】7月6日（週一）登入及部分頻道臨時維護公告（19:30更新）',
    ko: '【완료】7월 6일(월) 로그인 및 채널별 임시 점검 안내 (19:30 갱신)',
  },
  'd7a3ebf2244e4940b501ef5dbceb33d0': {
    en: '[Updated] DRKS_CREW vs SPYGEA_CREW clash in the viewer challenge “CROWN CREW CHALLENGE” (July 10, 16:10)',
    zh: '【更新】DRKS_CREW对阵SPYGEA_CREW！观众参与挑战“CROWN CREW CHALLENGE”确定举办！（7月10日16:10）',
    'zh-Hant': '【更新】DRKS_CREW對陣SPYGEA_CREW！觀眾參與挑戰「CROWN CREW CHALLENGE」確定舉辦！（7月10日16:10）',
    ko: '【갱신】DRKS_CREW vs SPYGEA_CREW 격돌! 시청자 참여형 “CROWN CREW CHALLENGE” 개최 확정! (7/10 16:10)',
  },
  '46592b4c0e594305bb153ff78d392818': {
    en: '“CROWN” update PV sharing campaign',
    zh: '“CROWN”版本更新宣传片扩散活动',
    'zh-Hant': '「CROWN」版本更新宣傳片分享活動',
    ko: '“CROWN” 업데이트 PV 공유 캠페인',
  },
  '37e05944762c4aeb904c43e964d8b6e4': {
    en: '[Completed] Temporary login, channel, and Challengers World system maintenance on Friday, July 3 (updated 21:00)',
    zh: '【已完成】7月3日（周五）登录、频道及挑战者世界系统临时维护公告（21:00更新）',
    'zh-Hant': '【已完成】7月3日（週五）登入、頻道及挑戰者世界系統臨時維護公告（21:00更新）',
    ko: '【완료】7월 3일(금) 로그인, 채널 및 챌린저스 월드 시스템 임시 점검 안내 (21:00 갱신)',
  },
  '5b381b46c924436692e2fbe83ec46a4c': {
    en: 'Challengers Partner web mission event sharing campaign',
    zh: '“挑战者伙伴网页任务活动”扩散活动公告',
    'zh-Hant': '「挑戰者夥伴網頁任務活動」分享活動公告',
    ko: '챌린저스 파트너 웹 미션 이벤트 공유 캠페인 안내',
  },
  'd800f7b0ac4e4007bfb6f9b7651be82d': {
    en: 'About CROWN (v4.43 update), Part 1 — Jobs, content, improvements, and bug fixes',
    zh: 'CROWN（v4.43更新）第一部分——职业、内容、优化与错误修复',
    'zh-Hant': 'CROWN（v4.43更新）第一部分——職業、內容、改善與錯誤修正',
    ko: 'CROWN(v4.43 업데이트) 1부 — 직업, 콘텐츠, 개선 및 오류 수정',
  },
  'fc81435a373f4492929121d07be4919e': {
    en: 'Challengers World Season 3',
    zh: '挑战者世界第3季',
    'zh-Hant': '挑戰者世界第3季',
    ko: '챌린저스 월드 시즌 3',
  },
  'd713cf10ccdc470dad3282f47e68dba6': {
    en: 'Challengers Partner',
    zh: '挑战者伙伴',
    'zh-Hant': '挑戰者夥伴',
    ko: '챌린저스 파트너',
  },
  'fbe67d8fc3e94d41809a4263d04cc712': {
    en: 'Season Boss: Kai (updated July 6, 20:20)',
    zh: '赛季Boss：凯（7月6日20:20补充）',
    'zh-Hant': '賽季Boss：凱（7月6日20:20補充）',
    ko: '시즌 보스: 카이 (7/6 20:20 추가)',
  },
  'ce2bf6f0f0dc4f94a9564d158bd8a3cf': {
    en: 'Mysterious Barrier',
    zh: '神秘结界',
    'zh-Hant': '神秘結界',
    ko: '수수께끼의 결계',
  },
  'cfda997c05684e2381f81bf69a9fea31': {
    en: 'Wild Psychic',
    zh: '狂野·念动力',
    'zh-Hant': '狂野·念動力',
    ko: '와일드 사이킥',
  },
  '4a47ad9631b9451796318343e164ee3e': {
    en: 'Hyper Mushroom Pass',
    zh: '超级蘑菇通行证',
    'zh-Hant': '超級菇菇通行證',
    ko: '하이퍼 버섯 패스',
  },
} satisfies Record<string, EditorialTitleTranslations>).map(([alias, titles]) => [alias, makeEditorialNewsTranslations(titles)]));

function getJmsEditorialTranslations(sourceUrl: string | undefined) {
  if (!sourceUrl) return undefined;
  try {
    return jmsEditorialTranslations[new URL(sourceUrl).searchParams.get('alias') || ''];
  } catch {
    return undefined;
  }
}

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
      translations: getJmsEditorialTranslations(sourceUrl),
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
      translations: getJmsEditorialTranslations(match[3]),
    })];
  });
};

const fetchJmsOfficialNews = async () => {
  const page = await textFetchWithMetadata([
    apiEndpoint('/official-content/jms/news'),
  ]);
  return hydrateRegionalImages(parseJmsListing(page.text).slice(0, 30), 'jms');
};

const fetchTmsOfficialNews = async () => {
  try {
    const mirrored = await cachedJsonFetch<{
      data?: { myDataSet?: { table?: TmsBulletin[] } };
    }>(apiEndpoint('/official-content/tms/news'), {
      cacheKey: 'official-news:tms:backend',
      freshMs: realtimeCacheDurations.refresh,
      staleMs: realtimeCacheDurations.week,
    });
    const items = normalizeTmsBulletins(mirrored.data?.myDataSet?.table || []);
    if (items.length > 0) return hydrateRegionalImages(items, 'tms');
  } catch {
    // Use the bundled snapshot below while the TMS anti-forgery adapter recovers.
  }
  return hydrateRegionalImages(normalizeTmsBulletins(tmsBundledBulletins), 'tms');
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
  contentLanguage?: NewsContentLanguage;
};

export const officialArticleHref = (sourceUrl: string, title: string, version: GameVersion, image?: string) => {
  const params = new URLSearchParams({ url: sourceUrl, title, server: version });
  if (image) params.set('image', image);
  return `/source?${params.toString()}`;
};

async function loadOfficialArticleDocument(
  sourceUrl: string,
  version: GameVersion,
): Promise<OfficialArticleDocument> {
  const normalizedSourceUrl = (() => {
    try {
      const url = new URL(sourceUrl);
      if (url.hostname === 'www.maplesea.com' && url.protocol === 'http:') url.protocol = 'https:';
      return url.toString();
    } catch {
      return sourceUrl;
    }
  })();

  try {
    const source = new URL(normalizedSourceUrl);
    if (source.hostname === 'orangemushroom.net' || source.hostname === 'www.orangemushroom.net') {
      const slug = source.pathname.split('/').filter(Boolean).at(-1) || '';
      if (slug) {
        const feedUrl = new URL(orangeMushroomFeedUrl);
        feedUrl.searchParams.set('slug', slug);
        feedUrl.searchParams.set('_fields', 'content,link,title');
        const posts = await cachedJsonFetch<OrangeMushroomKmsPost[]>(feedUrl.toString(), {
          cacheKey: `official-article:orange-mushroom:${slug}`,
          freshMs: realtimeCacheDurations.refresh,
          staleMs: realtimeCacheDurations.week,
          retryMs: 0,
          timeoutMs: 50_000,
        });
        const rendered = orangeMushroomRenderedText(posts[0]?.content);
        const html = sanitizeMirroredHtml(rendered, normalizedSourceUrl);
        if (html) return { html, text: stripMarkup(html), sourceUrl: normalizedSourceUrl };
      }
    }
  } catch {
    // Continue with the official-site mirror below.
  }

  if (version === 'gms') {
    const id = normalizedSourceUrl.match(/\/news\/[^/]+\/(\d+)/i)?.[1];
    if (id) {
      try {
        const officialArticleUrl = `https://g.nexonstatic.com/maplestory/cms/v1/news/${id}`;
        const article = await cachedJsonFetch<{ body?: string }>(
          apiEndpoint(`/official-content/article?url=${encodeURIComponent(officialArticleUrl)}`),
          {
            cacheKey: `official-article:gms:${id}`,
            freshMs: realtimeCacheDurations.refresh,
            staleMs: realtimeCacheDurations.week,
            retryMs: 0,
            timeoutMs: 50_000,
          },
        );
        const html = sanitizeMirroredHtml(article.body || '', 'https://g.nexonstatic.com');
        if (html) return { html, text: stripMarkup(html), sourceUrl: normalizedSourceUrl };
      } catch {
        // Retry through the page mirror below when the CMS endpoint is transiently unavailable.
      }
    }
  }

  const raw = await cachedTextFetch(apiEndpoint(`/official-content/article?url=${encodeURIComponent(normalizedSourceUrl)}`), {
    cacheKey: `official-article:${normalizedSourceUrl}`,
    freshMs: realtimeCacheDurations.refresh,
    staleMs: realtimeCacheDurations.week,
    retryMs: 0,
    timeoutMs: 50_000,
  });

  try {
    const payload = JSON.parse(raw) as { body?: unknown };
    if (typeof payload.body === 'string') {
      const origin = new URL(normalizedSourceUrl).origin;
      const html = sanitizeMirroredHtml(payload.body, origin);
      if (html) return { html, text: stripMarkup(html), sourceUrl: normalizedSourceUrl };
    }
  } catch {
    // The regional mirrors normally return HTML or Markdown rather than JSON.
  }

  if (/^Title:\s/m.test(raw) && /Markdown Content:/m.test(raw)) {
    const text = raw.split(/Markdown Content:\s*/m)[1]?.trim() || raw;
    return { html: '', text, sourceUrl: normalizedSourceUrl };
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
  const origin = new URL(normalizedSourceUrl).origin;
  const html = sanitizeMirroredHtml(content.innerHTML, origin);
  return { html, text: stripMarkup(html), sourceUrl: normalizedSourceUrl };
}

const officialArticleRequests = new Map<string, Promise<OfficialArticleDocument>>();
const prefetchedOfficialArticles = new Map<string, OfficialArticleDocument>();

export function getPrefetchedOfficialArticleDocument(sourceUrl: string, version: GameVersion) {
  if (typeof window === 'undefined') return null;
  return prefetchedOfficialArticles.get(`${version}:${sourceUrl}`) || null;
}

export function fetchOfficialArticleDocument(sourceUrl: string, version: GameVersion) {
  const key = `${version}:${sourceUrl}`;
  const prefetched = getPrefetchedOfficialArticleDocument(sourceUrl, version);
  if (prefetched) return Promise.resolve(prefetched);
  const existing = officialArticleRequests.get(key);
  if (existing) return existing;

  const request = loadOfficialArticleDocument(sourceUrl, version)
    .then((article) => {
      if (typeof window !== 'undefined') {
        if (prefetchedOfficialArticles.size >= 30) {
          const oldestKey = prefetchedOfficialArticles.keys().next().value;
          if (oldestKey) prefetchedOfficialArticles.delete(oldestKey);
        }
        prefetchedOfficialArticles.set(key, article);
      }
      return article;
    })
    .finally(() => {
      if (officialArticleRequests.get(key) === request) officialArticleRequests.delete(key);
    });
  officialArticleRequests.set(key, request);
  return request;
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
      console.warn('[MPStorys] Rejected invalid event import.', validation.issues);
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
    textFetchWithMetadata(grandisContentUrls, { freshMs: realtimeCacheDurations.refresh, staleMs: realtimeCacheDurations.week, timeoutMs: 50_000 }),
    textFetchWithMetadata(grandisClassUrls, { freshMs: realtimeCacheDurations.refresh, staleMs: realtimeCacheDurations.week, timeoutMs: 50_000 }),
    textFetchWithMetadata(grandisEventsUrls, { freshMs: realtimeCacheDurations.refresh, staleMs: realtimeCacheDurations.week, timeoutMs: 50_000 }),
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
    freshMs: realtimeCacheDurations.refresh,
    staleMs: realtimeCacheDurations.week,
    timeoutMs: 50_000,
  });

  return parseGrandisSectionPage(page.text, section, sourceUrl, page.sourceSyncedAt);
}

export async function fetchLiveGuideContent(guide: GuideItem): Promise<GuideItem> {
  if (!guide.sourceUrl) return guide;

  const sourceUrl = canonicalGrandisSourceUrl(guide.sourceUrl);
  const page = await textFetchWithMetadata(grandisProxyUrlsFor(sourceUrl), {
    freshMs: realtimeCacheDurations.refresh,
    staleMs: realtimeCacheDurations.week,
    timeoutMs: 50_000,
    suppressFailureCooldown: true,
  });
  const renderedArticleHtml = await renderGrandisArticleFromChunk(page.text, sourceUrl);
  const parsed = parseGrandisArticle(
    renderedArticleHtml ? `<div id="main-content">${renderedArticleHtml}</div>` : page.text,
    sourceUrl,
  );

  return {
    ...guide,
    sourceUrl,
    contentHtml: parsed.html,
    contentText: parsed.text,
    excerpt: guide.excerpt || firstSentence(parsed.text, `${guide.title} from Grandis Library.`),
    sourceSyncedAt: page.sourceSyncedAt,
  };
}

const warnedInvalidToolImports = new Set<string>();

export async function fetchLiveToolResources(): Promise<RemotePayload<ToolResourceItem>> {
  const gucciHtml = await textFetch(gucciToolUrls, {
    freshMs: realtimeCacheDurations.refresh,
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
      console.warn('[MPStorys] Rejected invalid tool import.', item.id, validation.issues);
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
        }>(source.urls, params, { freshMs: realtimeCacheDurations.refresh, staleMs: realtimeCacheDurations.week });

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
      }, { freshMs: realtimeCacheDurations.refresh, staleMs: realtimeCacheDurations.week });

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
      }, { freshMs: realtimeCacheDurations.refresh, staleMs: realtimeCacheDurations.week });

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
