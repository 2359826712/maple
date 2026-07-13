// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { VersionProvider } from '@/hooks/VersionContext';
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
import CurrentVersionHighlights from './CurrentVersionHighlights';

const mockUseRealtimeCollection = vi.mocked(useRealtimeCollection);

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
});
