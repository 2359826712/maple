// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { VersionProvider } from '@/hooks/VersionContext';
import i18n from '@/i18n';

const realtimeState = vi.hoisted(() => ({ items: [] as Array<Record<string, unknown>> }));

vi.mock('@/hooks/useRealtimeCollection', () => ({
  useRealtimeCollection: () => ({
    items: realtimeState.items,
    liveCount: 0,
    lastSyncedAt: null,
    status: 'idle',
    syncNow: vi.fn(),
  }),
}));

import Hero from './components/Hero';
import QuickTools from './components/QuickTools';

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter>
    <VersionProvider>{children}</VersionProvider>
  </MemoryRouter>
);

describe('homepage consolidation', () => {
  beforeEach(async () => {
    localStorage.clear();
    realtimeState.items = [];
    await i18n.changeLanguage('en');
  });

  it('uses one static, touch-friendly mobile update and hides duplicate ticker copy from assistive technology', () => {
    realtimeState.items = [{
      id: 'patch-one',
      title: 'Scheduled maintenance',
      date: 'Jul 13, 2026',
      publishedAt: '2026-07-13T00:00:00.000Z',
      versions: ['gms'],
      category: 'Patch Notes',
      excerpt: '',
      author: 'MapleStory',
      reads: 'Live',
      sourceUrl: 'https://example.com',
      tag: 'primary',
      image: '',
    }];

    render(<Hero />, { wrapper: Wrapper });

    expect(screen.getByTestId('mobile-news-ticker').className).toContain('sm:hidden');
    expect(screen.getByRole('link', { name: /Scheduled maintenance/ }).className).toContain('min-h-11');
    expect(screen.getByTestId('desktop-news-ticker').className).toContain('hidden');
    expect(document.querySelectorAll('.ticker-duplicate[aria-hidden="true"]')).toHaveLength(1);
  });

  afterEach(() => cleanup());

  it('keeps one content-search input in the new-player hero', () => {
    render(<Hero />, { wrapper: Wrapper });

    expect(screen.getAllByRole('textbox')).toHaveLength(1);
    expect(screen.getByPlaceholderText('Search a class, boss, item or player IGN...')).toBeTruthy();
    expect(screen.queryByPlaceholderText('Enter character name...')).toBeNull();
    expect(screen.queryByText('Try:')).toBeNull();
  });

  it('does not repeat Character Lookup in Quick Tools', () => {
    render(<QuickTools />, { wrapper: Wrapper });

    expect(screen.queryByText('Character Lookup')).toBeNull();
    expect(screen.getByText('Star Force Sim')).toBeTruthy();
    expect(document.querySelectorAll('#tools h3')).toHaveLength(4);
  });

  it('uses a safe default when pinned-tool storage is malformed', () => {
    localStorage.setItem('maplehub-home-tool-pins:v1', '{bad json');

    render(<QuickTools />, { wrapper: Wrapper });

    const titles = Array.from(document.querySelectorAll('#tools h3')).map((heading) => heading.textContent);
    expect(titles).toEqual(['Star Force Sim', 'Cube Simulator', 'Ranking Board', 'Mapler House']);
  });

  it('persists pins and moves pinned tools before defaults', async () => {
    const user = userEvent.setup();
    render(<QuickTools />, { wrapper: Wrapper });

    await user.click(screen.getByRole('button', { name: 'Pin Ranking Board' }));

    expect(JSON.parse(localStorage.getItem('maplehub-home-tool-pins:v1') || '[]')).toEqual(['ranking']);
    const titles = Array.from(document.querySelectorAll('#tools h3')).map((heading) => heading.textContent);
    expect(titles[0]).toBe('Ranking Board');
    expect(screen.getByRole('button', { name: 'Unpin Ranking Board' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: 'Unpin Ranking Board' }).className).toContain('h-11');
  });
});
