import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/i18n', () => ({
  loadLanguageResources: vi.fn(async () => ({ news_title: 'News' })),
}));
vi.mock('@/router/config', () => ({
  prefetchRouteForPath: vi.fn(async () => undefined),
}));
vi.mock('@/services/liveContent', () => ({
  fetchGrandisGuideSectionPage: vi.fn(),
  fetchLiveEvents: vi.fn(),
  fetchLiveGuideContent: vi.fn(),
  fetchLiveGuides: vi.fn(),
  fetchLiveNews: vi.fn(),
  fetchLiveToolResources: vi.fn(),
  fetchLocalizedWikiEntry: vi.fn(),
  fetchOfficialArticleDocument: vi.fn(),
  fetchWikiEntryByTitleLocalFirst: vi.fn(),
  fetchWikiEntryContent: vi.fn(),
}));
vi.mock('@/services/contentCacheValidation', () => ({
  isRenderableEventItem: () => true,
  isRenderableNewsItem: () => true,
}));
vi.mock('@/services/upcomingUpdates', () => ({
  fetchUpcomingUpdateArticle: vi.fn(),
  fetchUpcomingUpdates: vi.fn(),
}));
vi.mock('@/services/serverDom', () => ({ ensureServerDom: vi.fn() }));
vi.mock('@/services/seriesContentTranslation', async () => {
  const actual = await vi.importActual<typeof import('@/services/seriesContentTranslation')>(
    '@/services/seriesContentTranslation',
  );
  return {
    ...actual,
    readLocalizedSeriesContentBySlug: vi.fn().mockResolvedValue(null),
    readPublishedSeriesContentTranslationsBySlugs: vi.fn().mockResolvedValue({}),
  };
});

import {
  fetchLiveEvents,
  fetchLiveGuides,
  fetchLiveNews,
  fetchLiveToolResources,
  type NewsItem,
} from '@/services/liveContent';
import { readLocalizedSeriesContentBySlug } from '@/services/seriesContentTranslation';
import { createRoutePageProps, getLocalizedRedirect, getSitemapEntries } from './routeData';

const newsItem: NewsItem = {
  id: 'news-1',
  category: 'General',
  title: 'Server-rendered headline',
  excerpt: 'Server-rendered summary',
  author: 'MapleStory',
  date: 'Jul 16, 2026',
  publishedAt: '2026-07-16T00:00:00.000Z',
  reads: 'Official',
  sourceUrl: 'https://example.com/news-1',
  tag: 'primary',
  versions: ['gms'],
  image: 'https://example.com/news-1.jpg',
};

describe('Next route data', () => {
  beforeEach(() => {
    vi.mocked(fetchLiveNews).mockReset();
    vi.mocked(fetchLiveNews).mockResolvedValue({ items: [newsItem], replace: true });
    vi.mocked(fetchLiveEvents).mockReset();
    vi.mocked(fetchLiveEvents).mockResolvedValue({ items: [], replace: true });
    vi.mocked(fetchLiveGuides).mockReset();
    vi.mocked(fetchLiveGuides).mockResolvedValue({ items: [], replace: true });
    vi.mocked(fetchLiveToolResources).mockReset();
    vi.mocked(fetchLiveToolResources).mockResolvedValue({ items: [], replace: true });
    vi.mocked(readLocalizedSeriesContentBySlug).mockReset();
    vi.mocked(readLocalizedSeriesContentBySlug).mockResolvedValue(null);
  });

  it('includes official news in the server props for the canonical updates route', async () => {
    const props = await createRoutePageProps('/updates');

    expect(fetchLiveNews).toHaveBeenCalledWith('gms');
    expect(props?.initialNews).toEqual([newsItem]);
    expect(props).toEqual(expect.objectContaining({ language: 'en', pathname: '/updates', server: 'gms' }));
  });

  it('redirects the legacy default news URL to the canonical updates route', () => {
    expect(getLocalizedRedirect('/news/en/GMS?series=maplestory-pc'))
      .toBe('/series/maplestory-pc/updates');
  });

  it('does not fetch news for unrelated routes', async () => {
    const props = await createRoutePageProps('/tools/en/GMS');

    expect(fetchLiveNews).not.toHaveBeenCalled();
    expect(props?.initialNews).toBeUndefined();
  });

  it('preserves series scope while redirecting to a localized route', () => {
    expect(getLocalizedRedirect('/content/news/example?series=maplestory-classic')).toBeNull();
    expect(getLocalizedRedirect('/series/maplestory-classic/news/example')).toBeNull();
    expect(getLocalizedRedirect('/content/news/example/en/GMS?series=maplestory-classic'))
      .toBe('/content/news/example?series=maplestory-classic');
  });

  it('serves the default homepage at the bare domain and retires the legacy suffix', async () => {
    expect(getLocalizedRedirect('/')).toBeNull();
    expect(getLocalizedRedirect('/?series=maplestory-pc')).toBeNull();
    expect(getLocalizedRedirect('/en/GMS')).toBe('/');

    const props = await createRoutePageProps('/');
    expect(props).toEqual(expect.objectContaining({ language: 'en', pathname: '/', server: 'gms' }));
    expect(fetchLiveNews).not.toHaveBeenCalled();
    expect(fetchLiveEvents).not.toHaveBeenCalled();
    expect(fetchLiveGuides).not.toHaveBeenCalled();
    expect(props?.initialNews).toBeUndefined();
    expect(props?.initialEvents).toBeUndefined();
    expect(props?.initialGuides).toBeUndefined();
  });

  it('redirects unsupported series ranking routes to series news', () => {
    expect(getLocalizedRedirect('/rankings/en/GMS?series=maplestory-classic'))
      .toBe('/series/maplestory-classic/updates');
    expect(getLocalizedRedirect('/rankings/en/GMS?series=maplestory-idle'))
      .toBe('/series/maplestory-idle/rankings');
    expect(getLocalizedRedirect('/rankings/en/GMS?series=maplestory-pc'))
      .toBe('/series/maplestory-pc/rankings');
  });

  it('publishes unique, clean series hub and module URLs in the sitemap', () => {
    const paths = getSitemapEntries().map((entry) => entry.pathname);

    expect(paths).toContain('/series/maplestory-n');
    expect(paths).toContain('/series/maplestory-n/updates');
    expect(paths).toContain('/series/maplestory-worlds/tools');
    expect(paths.some((pathname) => pathname.includes('?series='))).toBe(false);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it('server-renders field-level database localization without changing content identity', async () => {
    vi.mocked(readLocalizedSeriesContentBySlug).mockResolvedValue({
      content_id: 'content-uuid',
      requested_locale: 'zh',
      database_locale: 'zh',
      source_language: 'en',
      localization_kind: 'partial',
      localizationKind: 'partial',
      title: '本地化指南标题',
      summary: '本地化摘要',
      body_html: '<p>Source body remains readable.</p>',
      content_data: {
        canonical_url: 'https://invalid.example/should-not-replace-source',
        metadata: {
          sections: [{ title: '本地化章节', items: ['本地化条目'] }],
        },
      },
      translated_fields: ['title', 'summary', 'content_data'],
      fallback_fields: ['body_html'],
      translatedFields: ['title', 'summary', 'content_data'],
      fallbackFields: ['body_html'],
      source_revision: 'sha256:revision',
      provider: 'local',
      model: 'model',
      glossary_version: '1',
      quality_checks: {},
      review_status: 'approved',
      updated_at: '2026-07-27T00:00:00Z',
    });
    const pathname = '/series/maplestory-worlds/guides/welcome-to-maplestory-worlds-worlds-creator-center-welcome-to-msw/zh/GMS';

    const props = await createRoutePageProps(pathname);

    expect(readLocalizedSeriesContentBySlug).toHaveBeenCalledWith(
      'welcome-to-maplestory-worlds-creator-guide',
      'zh',
      'zh',
    );
    expect(props?.requestTitle).toBe('本地化指南标题');
    expect(props?.initialSeriesResourceDetail).toMatchObject({
      bodyHtml: '<p>Source body remains readable.</p>',
      localization: {
        localizationKind: 'partial',
        translatedFields: ['title', 'summary', 'content_data'],
        fallbackFields: ['body_html'],
      },
      contentRecord: {
        id: 'welcome-to-maplestory-worlds-creator-guide',
        title: '本地化指南标题',
        summary: '本地化摘要',
      },
    });
    expect(props?.initialSeriesResourceDetail?.contentSections)
      .toContainEqual({ title: '本地化章节', items: ['本地化条目'] });
    expect(props?.initialSeriesResourceDetail?.contentRecord?.canonical_url)
      .not.toBe('https://invalid.example/should-not-replace-source');
  });
});
