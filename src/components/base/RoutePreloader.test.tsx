// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const prefetchRouteForPath = vi.hoisted(() => vi.fn(async () => undefined));
const prefetchWikiEntryForLocale = vi.hoisted(() => vi.fn(async () => null));
const fetchLiveNews = vi.hoisted(() => vi.fn(async () => ({ items: [], replace: true })));
const prefetchRealtimeCollection = vi.hoisted(() => vi.fn(async () => []));

vi.mock('@/router/config', () => ({
  idleRoutePrefetchPaths: [],
  prefetchRouteForPath,
}));
vi.mock('@/services/liveContent', () => ({
  fetchLiveNews,
  liveStorageKeys: { news: 'news' },
  prefetchWikiEntryForLocale,
}));
vi.mock('@/hooks/useRealtimeCollection', () => ({ prefetchRealtimeCollection }));
vi.mock('@/services/contentCacheValidation', () => ({
  isRenderableEventItem: () => true,
  isRenderableNewsItem: () => true,
}));
vi.mock('@/services/realtimeCache', () => ({
  realtimeCacheDurations: { short: 300_000 },
}));
vi.mock('@/hooks/VersionContext', () => ({
  useVersion: () => ({ version: 'gms' }),
}));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ i18n: { language: 'zh' } }),
}));

import RoutePreloader from './RoutePreloader';

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('RoutePreloader', () => {
  it('preloads route code and wiki data when an internal link shows navigation intent', async () => {
    render(
      <>
        <RoutePreloader />
        <a href="/wiki/article/Link%20Skill/zh/GMS">Link Skill</a>
      </>,
    );

    fireEvent.pointerOver(screen.getByRole('link', { name: 'Link Skill' }));

    await waitFor(() => {
      expect(prefetchRouteForPath).toHaveBeenCalledWith('/wiki/article/Link%20Skill/zh/GMS');
      expect(prefetchWikiEntryForLocale).toHaveBeenCalledWith('Link Skill', 'zh');
    });
  });

  it('does not preload external links', () => {
    render(
      <>
        <RoutePreloader />
        <a href="https://example.com/wiki/article/Lotus">External</a>
      </>,
    );

    fireEvent.pointerOver(screen.getByRole('link', { name: 'External' }));
    expect(prefetchRouteForPath).not.toHaveBeenCalled();
    expect(prefetchWikiEntryForLocale).not.toHaveBeenCalled();
  });

  it('preloads and persists news data before navigating to the news page', async () => {
    render(
      <>
        <RoutePreloader />
        <a href="/news/zh/GMS">News</a>
      </>,
    );

    fireEvent.pointerOver(screen.getByRole('link', { name: 'News' }));

    await waitFor(() => {
      expect(prefetchRealtimeCollection).toHaveBeenCalledWith(expect.objectContaining({
        storageKey: 'news:gms',
        intervalMs: 300_000,
      }));
    });
  });
});
