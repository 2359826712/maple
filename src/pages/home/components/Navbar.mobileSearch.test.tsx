// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Navbar from './Navbar';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      const copy: Record<string, string> = {
        nav_search_open: 'Open site search',
        nav_search_close: 'Close site search',
        nav_search_placeholder: 'Search guides, bosses, classes...',
        nav_search_best_matches: 'Best matches',
        nav_search_popular: 'Popular right now',
        nav_search_no_match: 'No matches found',
        nav_search_filtered: `Results filtered to ${String(options?.version ?? 'GMS')} content`,
        search_section_bosses: 'Bosses',
        search_clear_btn: 'Clear',
      };
      return copy[key] ?? key;
    },
    i18n: { language: 'en', changeLanguage: vi.fn() },
  }),
}));

vi.mock('@/hooks/VersionContext', () => ({
  useVersion: () => ({
    version: 'gms',
    versionInfo: {
      id: 'gms',
      name: 'MapleStory',
      shortLabel: 'GMS',
      fullName: 'Global MapleStory',
      region: 'North America',
    },
    setVersion: vi.fn(),
  }),
  VERSIONS: [
    {
      id: 'gms',
      name: 'MapleStory',
      shortLabel: 'GMS',
      fullName: 'Global MapleStory',
      region: 'North America',
    },
  ],
}));

vi.mock('@/services/siteSearch', () => ({
  getPopularSearchTerms: () => ['Lotus'],
  getSiteSearchResults: (query: string) => query.trim()
    ? [{
      id: 'boss-lotus',
      title: 'Lotus',
      excerpt: 'Weekly boss',
      href: '/wiki/boss/lotus',
      section: 'bosses',
      icon: 'ri-skull-2-line',
      score: 100,
    }]
    : [],
}));

afterEach(() => cleanup());

function CurrentPath() {
  const location = useLocation();
  return <output aria-label="Current path">{location.pathname}</output>;
}

function renderNavbar() {
  render(
    <MemoryRouter>
      <CurrentPath />
      <Navbar onOpenNotifications={vi.fn()} unread={0} />
    </MemoryRouter>,
  );
}

describe('Navbar mobile site search', () => {
  it('opens from the mobile navbar and reuses site-search result navigation', async () => {
    renderNavbar();

    fireEvent.click(screen.getByRole('button', { name: 'Open site search' }));

    const mobileSearch = document.getElementById('mobile-site-search');
    expect(mobileSearch).toBeTruthy();
    const scopedSearch = within(mobileSearch as HTMLElement);
    const input = scopedSearch.getByRole('searchbox', { name: 'Search guides, bosses, classes...' });

    await waitFor(() => expect(document.activeElement).toBe(input));
    fireEvent.change(input, { target: { value: 'Lotus' } });
    const lotusResult = scopedSearch.getByText('Lotus').closest('button');
    expect(lotusResult).toBeTruthy();
    fireEvent.click(lotusResult as HTMLButtonElement);

    expect(screen.getByLabelText('Current path').textContent).toBe('/wiki/boss/lotus');
    expect(document.getElementById('mobile-site-search')).toBeNull();
  });

  it('closes with Escape and restores the trigger state', () => {
    renderNavbar();

    fireEvent.click(screen.getByRole('button', { name: 'Open site search' }));
    const searchForm = screen.getByRole('search');
    fireEvent.keyDown(searchForm, { key: 'Escape' });

    expect(document.getElementById('mobile-site-search')).toBeNull();
    expect(screen.getByRole('button', { name: 'Open site search' })).toBeTruthy();
  });
});
