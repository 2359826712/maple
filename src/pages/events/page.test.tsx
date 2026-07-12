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
vi.mock('@/components/feature/RealtimeStatus', () => ({ default: () => null }));
vi.mock('@/hooks/useRealtimeCollection', () => ({
  useRealtimeCollection: () => ({
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
});
