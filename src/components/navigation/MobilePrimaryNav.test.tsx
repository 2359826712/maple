// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import MobilePrimaryNav from './MobilePrimaryNav';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en' } }),
}));

afterEach(cleanup);

function renderNav(pathname = '/') {
  return render(
    <MemoryRouter initialEntries={[pathname]}>
      <MobilePrimaryNav />
    </MemoryRouter>,
  );
}

describe('MobilePrimaryNav', () => {
  it('keeps the five highest-value player destinations one tap away', () => {
    renderNav('/');

    expect(screen.getAllByRole('link')).toHaveLength(5);
    expect(screen.getByRole('link', { name: 'nav_home' }).getAttribute('href')).toBe('/');
    expect(screen.getByRole('link', { name: 'nav_updates' }).getAttribute('href')).toBe('/updates');
    expect(screen.getByRole('link', { name: 'nav_tools' }).getAttribute('href')).toBe('/tools');
    expect(screen.getByRole('link', { name: 'nav_search_button' }).getAttribute('href')).toBe('/search');
    expect(screen.getByRole('link', { name: 'nav_series' }).getAttribute('href')).toBe('/series');
  });

  it('marks the current section for assistive technology', () => {
    renderNav('/updates');

    expect(screen.getByRole('link', { name: 'nav_updates' }).getAttribute('aria-current')).toBe('page');
    expect(screen.getByRole('link', { name: 'nav_home' }).hasAttribute('aria-current')).toBe(false);
  });

  it('keeps mobile destinations inside the active series', () => {
    renderNav('/updates?series=maplestory-m');

    expect(screen.getByRole('link', { name: 'nav_series' }).getAttribute('href')).toBe('/series');
    expect(screen.getByRole('link', { name: 'nav_updates' }).getAttribute('href')).toBe('/series/maplestory-m/updates');
    expect(screen.getByRole('link', { name: 'nav_tools' }).getAttribute('href')).toBe('/series/maplestory-m/tools');
  });

  it('stays out of authentication flows', () => {
    renderNav('/auth/login/en/GMS');

    expect(screen.queryByRole('navigation')).toBeNull();
  });
});
