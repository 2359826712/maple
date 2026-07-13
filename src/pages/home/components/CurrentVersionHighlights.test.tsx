// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useVersion, VersionProvider } from '@/hooks/VersionContext';
import i18n from '@/i18n';

vi.mock('@/hooks/useRealtimeCollection', () => ({
  useRealtimeCollection: vi.fn(),
}));

vi.mock('@/services/liveContent', () => ({
  fetchLiveNews: vi.fn(),
  fetchLiveEvents: vi.fn(),
  fetchLiveGuides: vi.fn(),
  liveStorageKeys: {
    news: 'test-news',
    events: 'test-events',
    guides: 'test-guides',
  },
}));

import { useRealtimeCollection } from '@/hooks/useRealtimeCollection';
import { fetchLiveNews } from '@/services/liveContent';
import CurrentVersionHighlights from './CurrentVersionHighlights';

const mockUseRealtimeCollection = vi.mocked(useRealtimeCollection);
const mockFetchLiveNews = vi.mocked(fetchLiveNews);

function VersionSwitchProbe() {
  const { setVersion } = useVersion();
  return (
    <>
      <button type="button" onClick={() => setVersion('gms')}>Switch to GMS</button>
      <CurrentVersionHighlights />
    </>
  );
}

describe('CurrentVersionHighlights resilience', () => {
  beforeEach(async () => {
    localStorage.clear();
    await i18n.changeLanguage('zh');
    mockUseRealtimeCollection.mockImplementation(({ storageKey }: { storageKey: string }) => ({
      items: storageKey === 'test-guides' ? [{
        id: 'hero-guide',
        title: 'Hero Class Overview',
        class: 'Explorers',
        difficulty: 'Intermediate',
        length: '8 min',
        upvotes: 10,
        author: 'Grandis Library',
        versions: ['gms'],
        image: '',
        sourceLabel: 'Grandis Library',
        sourceUrl: 'https://grandislibrary.com/classes/hero',
      }] : [],
      liveCount: storageKey === 'test-guides' ? 1 : 0,
      lastSyncedAt: null,
      status: 'idle',
      syncNow: vi.fn(),
    }) as never);
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('fills missing categories independently and labels the English guide source', () => {
    render(
      <MemoryRouter>
        <VersionProvider>
          <CurrentVersionHighlights />
        </VersionProvider>
      </MemoryRouter>,
    );

    expect(screen.getByText('查看最新官方资讯')).toBeTruthy();
    expect(screen.getByText('查看活动日历')).toBeTruthy();
    expect(screen.getByText('Hero Class Overview')).toBeTruthy();
    expect(screen.getByText('英语来源 · Grandis Library')).toBeTruthy();
    expect(screen.getAllByRole('link')).toHaveLength(3);
  });

  it('binds live requests to the newly selected version instead of the previous KMS setting', async () => {
    localStorage.setItem('maplehub-game-version', 'kms');
    mockFetchLiveNews.mockResolvedValue({ items: [], replace: true });

    render(
      <MemoryRouter>
        <VersionProvider>
          <VersionSwitchProbe />
        </VersionProvider>
      </MemoryRouter>,
    );

    const kmsOptions = mockUseRealtimeCollection.mock.calls
      .map(([options]) => options)
      .find((options) => options.storageKey === 'test-news:kms');
    await kmsOptions?.remoteLoader?.();
    expect(mockFetchLiveNews).toHaveBeenLastCalledWith('kms');

    fireEvent.click(screen.getByRole('button', { name: 'Switch to GMS' }));

    const gmsOptions = [...mockUseRealtimeCollection.mock.calls]
      .reverse()
      .map(([options]) => options)
      .find((options) => options.storageKey === 'test-news:gms');
    await gmsOptions?.remoteLoader?.();
    expect(mockFetchLiveNews).toHaveBeenLastCalledWith('gms');
  });
});
