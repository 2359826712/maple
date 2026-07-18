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
  return <output aria-label="Current path">{location.pathname}{location.search}</output>;
}

function renderNavbar(pathname = '/') {
  render(
    <MemoryRouter initialEntries={[pathname]}>
      <CurrentPath />
      <Navbar onOpenNotifications={vi.fn()} unread={0} />
    </MemoryRouter>,
  );
}

describe('Navbar mobile site search', () => {
  it('switches to a dedicated on-site series hub before the server selector', () => {
    renderNavbar();

    const seriesButton = screen.getByRole('button', { name: 'nav_series' });
    fireEvent.click(seriesButton);
    fireEvent.click(screen.getByRole('menuitem', { name: 'MapleStory M' }));

    expect(screen.getByLabelText('Current path').textContent).toBe('/news/en/GMS?series=maplestory-m');
  });

  it('keeps the current module when the selected series changes', () => {
    renderNavbar('/guides/en/GMS');

    fireEvent.click(screen.getByRole('button', { name: 'MapleStory' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'MapleStory M' }));

    expect(screen.getByLabelText('Current path').textContent).toBe('/guides/en/GMS?series=maplestory-m');
  });

  it('keeps shared feedback content open when the selected series changes', () => {
    renderNavbar('/feedback/en/GMS');

    fireEvent.click(screen.getByRole('button', { name: 'MapleStory' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'MapleStory M' }));

    expect(screen.getByLabelText('Current path').textContent).toBe('/feedback/en/GMS?series=maplestory-m');
  });

  it('scopes every desktop module link to the selected series', () => {
    renderNavbar('/news/en/GMS?series=maplestory-m');

    const desktopNavigation = document.querySelector('header nav[class*="2xl:flex"]');
    expect(desktopNavigation).toBeTruthy();
    const scopedNavigation = within(desktopNavigation as HTMLElement);

    expect(scopedNavigation.getByRole('link', { name: 'nav_news' }).getAttribute('href')).toBe('/news/en/GMS?series=maplestory-m');
    expect(scopedNavigation.getByRole('link', { name: 'nav_guides' }).getAttribute('href')).toBe('/guides/en/GMS?series=maplestory-m');
    expect(scopedNavigation.getByRole('link', { name: 'nav_shop' }).getAttribute('href')).toBe('/shop/en/GMS?series=maplestory-m');
    expect(scopedNavigation.getByRole('link', { name: 'nav_feedback' }).getAttribute('href')).toBe('/feedback/en/GMS?series=maplestory-m');
    expect(scopedNavigation.queryByRole('link', { name: 'nav_rankings' })).toBeNull();
  });

  it('falls back to series news when rankings are unavailable after switching series', () => {
    renderNavbar('/rankings/en/GMS');

    fireEvent.click(screen.getByRole('button', { name: 'MapleStory' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'MapleStory N' }));

    expect(screen.getByLabelText('Current path').textContent).toBe('/news/en/GMS?series=maplestory-n');
  });

  it('shows the former More destinations directly in the desktop navigation', () => {
    renderNavbar();

    const desktopNavigation = document.querySelector('header nav[class*="2xl:flex"]');
    expect(desktopNavigation).toBeTruthy();
    const scopedNavigation = within(desktopNavigation as HTMLElement);

    expect(scopedNavigation.queryByRole('link', { name: 'nav_series' })).toBeNull();
    expect(screen.getByRole('button', { name: 'nav_series' })).toBeTruthy();
    expect(scopedNavigation.getByRole('link', { name: 'nav_upcoming' }).getAttribute('href')).toBe('/upcoming/en/GMS');
    expect(scopedNavigation.getByRole('link', { name: 'nav_wiki' }).getAttribute('href')).toBe('/wiki/en/GMS');
    expect(scopedNavigation.getByRole('link', { name: 'nav_rankings' }).getAttribute('href')).toBe('/rankings/en/GMS');
    expect(scopedNavigation.getByRole('link', { name: 'nav_community' }).getAttribute('href')).toBe('/community/en/GMS');
    expect(scopedNavigation.getByRole('link', { name: 'nav_feedback' }).getAttribute('href')).toBe('/feedback/en/GMS');
    expect(scopedNavigation.queryByText('nav_more')).toBeNull();
  });

  it('offers Korean and persists it as the active language', () => {
    renderNavbar();

    fireEvent.click(screen.getByRole('button', { name: 'nav_menu_open' }));
    fireEvent.click(screen.getByRole('button', { name: '한국어' }));

    expect(localStorage.getItem('i18nextLng')).toBe('ko');
    expect(localStorage.getItem('maplehub-language')).toBe('ko');
    expect(document.documentElement.lang).toBe('ko');
    expect(screen.getByLabelText('Current path').textContent).toBe('/ko/GMS');
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
  it('clears the browser auth session immediately when signing out', () => {
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

    expect(sessionStorage.getItem('maplehub-auth-session')).toBeNull();
    expect(screen.getByText('Sign in')).toBeTruthy();
  });
});
