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

import { fetchLiveNews, type NewsItem } from '@/services/liveContent';
import { createRoutePageProps, getLocalizedRedirect } from './routeData';

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
  });

  it('includes official news in the server props for the news route', async () => {
    const props = await createRoutePageProps('/news/en/GMS');

    expect(fetchLiveNews).toHaveBeenCalledWith('gms');
    expect(props?.initialNews).toEqual([newsItem]);
  });

  it('does not fetch news for unrelated routes', async () => {
    const props = await createRoutePageProps('/tools/en/GMS');

    expect(fetchLiveNews).not.toHaveBeenCalled();
    expect(props?.initialNews).toBeUndefined();
  });

  it('preserves series scope while redirecting to a localized route', () => {
    expect(getLocalizedRedirect('/content/news/example?series=maplestory-classic'))
      .toBe('/content/news/example/en/GMS?series=maplestory-classic');
  });

  it('redirects unsupported series ranking routes to series news', () => {
    expect(getLocalizedRedirect('/rankings/en/GMS?series=maplestory-idle'))
      .toBe('/news/en/GMS?series=maplestory-idle');
    expect(getLocalizedRedirect('/rankings/en/GMS?series=maplestory-pc')).toBeNull();
  });
});
