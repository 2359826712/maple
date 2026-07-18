// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { VersionProvider } from '@/hooks/VersionContext';
import i18n from '@/i18n';

vi.mock('@/pages/home/components/Navbar', () => ({ default: () => null }));
vi.mock('@/pages/home/components/Footer', () => ({ default: () => null }));
vi.mock('@/pages/home/components/NotificationDrawer', () => ({ default: () => null }));
vi.mock('@/components/feature/RealtimeStatus', () => ({
  default: ({ status, liveCount }: { status: string; liveCount: number }) => (
    <output data-testid="realtime-status">{`${status}:${liveCount}`}</output>
  ),
}));

const collectionState = vi.hoisted(() => ({
  eventOverride: null as null | Record<string, unknown>,
  newsItems: [] as Array<Record<string, unknown>>,
}));

vi.mock('@/hooks/useRealtimeCollection', () => ({
  useRealtimeCollection: ({ storageKey }: { storageKey: string }) => storageKey.startsWith('maplehub-online-official-news')
    ? {
      items: collectionState.newsItems,
      liveCount: collectionState.newsItems.length,
      lastSyncedAt: collectionState.newsItems.length > 0 ? new Date().toISOString() : '',
      status: collectionState.newsItems.length > 0 ? 'live' : 'unavailable',
      syncNow: vi.fn(),
    }
    : collectionState.eventOverride ?? ({
      items: [{
      id: 'event-one',
      name: 'Golden Week',
      windowStart: new Date(Date.now() - 86_400_000).toISOString(),
      windowEnd: new Date(Date.now() + 3 * 86_400_000).toISOString(),
      rewards: ['Symbols'],
      rarity: 'Seasonal',
      icon: 'ri-gift-line',
      regions: ['gms'],
      image: '/event.webp',
      sourceUrl: 'https://example.com/event',
      sourceLabel: 'Official',
      lastVerified: new Date().toISOString(),
      }],
      liveCount: 1,
      lastSyncedAt: new Date().toISOString(),
      status: 'live',
      syncNow: vi.fn(),
    }),
}));

import EventsPage from './page';

describe('event reminders', () => {
  beforeEach(async () => {
    window.localStorage.clear();
    collectionState.eventOverride = null;
    collectionState.newsItems = [];
    await i18n.changeLanguage('en');
  });

  afterEach(() => cleanup());

  it('persists an event reminder on this device and allows removing it', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <VersionProvider>
          <EventsPage />
        </VersionProvider>
      </MemoryRouter>,
    );

    await user.click(screen.getByLabelText('Remind me'));
    expect(screen.getByLabelText('Remove reminder')).toBeTruthy();
    expect(window.localStorage.getItem('maplehub-event-reminders')).toContain('gms:event-one');

    await user.click(screen.getByLabelText('Remove reminder'));
    expect(screen.getByLabelText('Remind me')).toBeTruthy();
    expect(window.localStorage.getItem('maplehub-event-reminders')).toBe('[]');
  });

  it('ignores legacy reminder objects instead of crashing the page', () => {
    window.localStorage.setItem('maplehub-event-reminders', JSON.stringify({ legacy: [] }));
    window.localStorage.setItem('maplehub-event-reminder-notified', JSON.stringify({ legacy: true }));

    render(
      <MemoryRouter>
        <VersionProvider>
          <EventsPage />
        </VersionProvider>
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'Golden Week' })).toBeTruthy();
    expect(screen.getByLabelText('Remind me')).toBeTruthy();
  });

  it('keeps in-app delivery as the default and explains unsupported browser alerts', async () => {
    Reflect.deleteProperty(window, 'Notification');
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <VersionProvider>
          <EventsPage />
        </VersionProvider>
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'Reminder delivery' })).toBeTruthy();
    expect(screen.queryByText('This browser does not support notifications. In-app reminders remain active.')).toBeNull();
    expect(screen.getByRole('button', { name: 'In-app only' }).getAttribute('aria-pressed')).toBe('true');
    await user.click(screen.getByRole('button', { name: 'Browser alerts' }));
    expect(screen.getByText('This browser does not support notifications. In-app reminders remain active.')).toBeTruthy();
    expect(window.localStorage.getItem('maplehub-event-reminder-delivery')).toBeNull();
  });

  it('shows official event news without presenting unverified dates as a schedule', () => {
    collectionState.eventOverride = {
      items: [],
      liveCount: 0,
      lastSyncedAt: '',
      status: 'unavailable',
      syncNow: vi.fn(),
    };
    collectionState.newsItems = [{
      id: 'official-event-news',
      category: 'Event',
      title: 'Momentum Pass',
      excerpt: 'Read the official announcement for details.',
      author: 'MapleStory',
      date: 'Jul 1, 2026',
      publishedAt: '2026-07-01T00:00:00.000Z',
      reads: 'Live',
      sourceUrl: 'https://example.com/momentum-pass',
      tag: 'accent',
      versions: ['gms'],
      image: '/event-news.webp',
    }];

    render(
      <MemoryRouter>
        <VersionProvider>
          <EventsPage />
        </VersionProvider>
      </MemoryRouter>,
    );

    expect(screen.queryByRole('heading', { name: 'Verified event schedule unavailable' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Retry event sources' })).toBeNull();
    expect(screen.getByRole('heading', { name: 'Official event news is still available' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Momentum Pass' })).toBeTruthy();
    expect(screen.getByTestId('realtime-status').textContent).toBe('live:1');
    const href = screen.getByRole('link', { name: 'Open official article' }).getAttribute('href') || '';
    expect(href).toContain('/source?');
    expect(new URL(href, 'https://maplehub.test').searchParams.get('url')).toBe('https://example.com/momentum-pass');
  });
});
