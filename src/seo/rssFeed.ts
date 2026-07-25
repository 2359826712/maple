import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/constants/site';
import { withRouteSuffixes } from '@/i18n/languageRouting';
import { indexedContent, indexedContentSources, type IndexedContentRecord } from '@/domain/contentIndex';
import type { ContentType, MapleSeries } from '@/domain/contentIndexTypes';
import { getSeriesResourceHref, type SeriesModule } from '@/pages/series/scope';

const RSS_ITEM_LIMIT = 50;

const contentTypeModules: Record<ContentType, SeriesModule> = {
  news: 'news',
  event: 'events',
  guide: 'guides',
  'patch-note': 'upcoming',
  maintenance: 'upcoming',
  'cash-shop': 'shop',
  'developer-note': 'news',
  roadmap: 'upcoming',
  'api-announcement': 'tools',
  'creator-announcement': 'news',
};

const contentSeriesIds: Record<MapleSeries, string> = {
  maplestory: 'maplestory-pc',
  classic: 'maplestory-classic',
  m: 'maplestory-m',
  worlds: 'maplestory-worlds',
  n: 'maplestory-n',
  idle: 'maplestory-idle',
};

const sourceNames = new Map(indexedContentSources.map((source) => [source.id, source.name]));

const escapeXml = (value: string) => value
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&apos;');

const hasReadableIndexedDetail = (content: IndexedContentRecord) => {
  if (content.metadata.editorial_reviewed === true) return true;
  const sections = Array.isArray(content.metadata.sections) ? content.metadata.sections : [];
  return sections.some((section) => {
    if (!section || typeof section !== 'object') return false;
    const title = 'title' in section ? String(section.title || '').trim().toLowerCase() : '';
    return title.length > 0 && title !== 'official publication record';
  });
};

const slugForContent = (content: IndexedContentRecord) => {
  const titleSlug = content.title
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 56) || 'content';
  return `${titleSlug}-${content.id}`.slice(0, 120);
};

const contentUrl = (content: IndexedContentRecord) => {
  const module = contentTypeModules[content.content_type];
  const series = contentSeriesIds[content.series];
  const pathname = withRouteSuffixes(getSeriesResourceHref(series, module, slugForContent(content)), 'en', 'gms');
  return `${SITE_URL}${pathname}`;
};

const dateValue = (content: IndexedContentRecord) => (
  Date.parse(content.updated_at || content.published_at || content.discovered_at || content.last_checked || '')
);

const rssDate = (value: string | null | undefined) => {
  const timestamp = Date.parse(value || '');
  return Number.isFinite(timestamp) ? new Date(timestamp).toUTCString() : undefined;
};

const renderItem = (content: IndexedContentRecord) => {
  const url = contentUrl(content);
  const published = rssDate(content.updated_at || content.published_at || content.discovered_at);
  const sourceName = sourceNames.get(content.source_id) || 'Official source';
  const categories = [content.content_type, content.series, ...content.tags].filter(Boolean);
  return [
    '    <item>',
    `      <title>${escapeXml(content.title)}</title>`,
    `      <link>${escapeXml(url)}</link>`,
    `      <guid isPermaLink="false">${escapeXml(`mpstorys:content:${content.id}`)}</guid>`,
    ...(published ? [`      <pubDate>${published}</pubDate>`] : []),
    `      <dc:creator>${escapeXml(content.author || sourceName)}</dc:creator>`,
    `      <description>${escapeXml(content.summary || SITE_DESCRIPTION)}</description>`,
    `      <source url="${escapeXml(content.canonical_url)}">${escapeXml(sourceName)}</source>`,
    ...categories.map((category) => `      <category>${escapeXml(category)}</category>`),
    '    </item>',
  ].join('\n');
};

export const getRssFeedItems = () => indexedContent
  .filter((content) => content.status !== 'removed' && content.status !== 'redirected')
  .filter(hasReadableIndexedDetail)
  .sort((a, b) => dateValue(b) - dateValue(a) || a.id.localeCompare(b.id))
  .slice(0, RSS_ITEM_LIMIT);

export const buildRssFeedXml = (items = getRssFeedItems()) => {
  const latestDate = items.map((item) => dateValue(item)).find(Number.isFinite);
  const lastBuildDate = Number.isFinite(latestDate) ? new Date(latestDate).toUTCString() : new Date().toUTCString();
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">',
    '  <channel>',
    `    <title>${escapeXml(`${SITE_NAME} Updates`)}</title>`,
    `    <link>${escapeXml(SITE_URL)}</link>`,
    `    <description>${escapeXml(SITE_DESCRIPTION)}</description>`,
    '    <language>en</language>',
    `    <lastBuildDate>${lastBuildDate}</lastBuildDate>`,
    '    <ttl>60</ttl>',
    `    <atom:link href="${escapeXml(`${SITE_URL}/rss.xml`)}" rel="self" type="application/rss+xml" />`,
    '    <image>',
    `      <url>${escapeXml(`${SITE_URL}/mpstorys-icon-128.jpg`)}</url>`,
    `      <title>${escapeXml(SITE_NAME)}</title>`,
    `      <link>${escapeXml(SITE_URL)}</link>`,
    '    </image>',
    ...items.map(renderItem),
    '  </channel>',
    '</rss>',
    '',
  ].join('\n');
};
