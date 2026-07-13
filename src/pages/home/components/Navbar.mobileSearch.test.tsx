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
        nav_sign_in: 'Sign in',
        nav_sign_out: 'Sign out',
        nav_account_dashboard: 'Account & checklist',
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

afterEach(() => {
  cleanup();
  localStorage.clear();
});

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
  it('shows the former More destinations directly in the desktop navigation', () => {
    renderNavbar();

    const desktopNavigation = document.querySelector('header nav.hidden.xl\\:flex');
    expect(desktopNavigation).toBeTruthy();
    const scopedNavigation = within(desktopNavigation as HTMLElement);

    expect(scopedNavigation.getByRole('link', { name: 'nav_upcoming' }).getAttribute('href')).toBe('/upcoming');
    expect(scopedNavigation.getByRole('link', { name: 'nav_wiki' }).getAttribute('href')).toBe('/wiki');
    expect(scopedNavigation.getByRole('link', { name: 'nav_rankings' }).getAttribute('href')).toBe('/rankings');
    expect(scopedNavigation.getByRole('link', { name: 'nav_community' }).getAttribute('href')).toBe('/community');
    expect(scopedNavigation.queryByText('nav_more')).toBeNull();
  });

  it('offers Korean and persists it as the active language', () => {
    renderNavbar();

    fireEvent.click(screen.getByRole('button', { name: 'nav_menu_open' }));
    fireEvent.click(screen.getByRole('button', { name: '한국어' }));

    expect(localStorage.getItem('i18nextLng')).toBe('ko');
    expect(localStorage.getItem('maplehub-language')).toBe('ko');
    expect(document.documentElement.lang).toBe('ko');
  });

  it('opens from the mobile navbar and reuses site-search result navigation', async () => {
    renderNavbar();

    const trigger = screen.getByRole('button', { name: 'Open site search' });
    expect(trigger.className).toContain('h-11');
    fireEvent.click(trigger);

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

describe('Navbar account menu', () => {
  it('clears the browser auth session when signing out', async () => {
    sessionStorage.setItem('maplehub-auth-session', JSON.stringify({
      provider: 'local',
      user: 'Test Mapler',
      displayName: 'Test Mapler',
      mode: 'test',
      signedInAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
      accessToken: 'test-token',
    }));
    renderNavbar();

    const accountButton = screen.getByText('Test Mapler').closest('button');
    expect(accountButton).toBeTruthy();
    fireEvent.click(accountButton as HTMLButtonElement);
    fireEvent.click(screen.getByRole('menuitem', { name: 'Sign out' }));

    await waitFor(() => expect(sessionStorage.getItem('maplehub-auth-session')).toBeNull());
    expect(screen.getByText('Sign in')).toBeTruthy();
  });
});
