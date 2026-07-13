// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import MobilePrimaryNav from './MobilePrimaryNav';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
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
  it('keeps the four highest-value player destinations one tap away', () => {
    renderNav('/');

    expect(screen.getAllByRole('link')).toHaveLength(4);
    expect(screen.getByRole('link', { name: 'dashboard_title' }).getAttribute('href')).toBe('/');
    expect(screen.getByRole('link', { name: 'nav_checklist' }).getAttribute('href')).toBe('/checklist');
    expect(screen.getByRole('link', { name: 'nav_search_button' }).getAttribute('href')).toBe('/search');
    expect(screen.getByRole('link', { name: 'nav_tools' }).getAttribute('href')).toBe('/mapler-house');
  });

  it('marks the current section for assistive technology', () => {
    renderNav('/checklist');

    expect(screen.getByRole('link', { name: 'nav_checklist' }).getAttribute('aria-current')).toBe('page');
    expect(screen.getByRole('link', { name: 'dashboard_title' }).hasAttribute('aria-current')).toBe(false);
  });

  it('stays out of authentication flows', () => {
    renderNav('/auth/login');

    expect(screen.queryByRole('navigation')).toBeNull();
  });
});
