// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import i18n from '@/i18n';
import LocaleRouteSync from './LocaleRouteSync';

function CurrentPath() {
  const location = useLocation();
  return <output aria-label="Current route">{`${location.pathname}${location.search}${location.hash}`}</output>;
}

function renderRoute(pathname: string) {
  render(
    <MemoryRouter initialEntries={[pathname]}>
      <LocaleRouteSync />
      <CurrentPath />
    </MemoryRouter>,
  );
}

beforeEach(async () => {
  localStorage.clear();
  await i18n.changeLanguage('en');
});

afterEach(cleanup);

describe('LocaleRouteSync', () => {
  it('redirects a legacy URL to its static English route', async () => {
    renderRoute('/news?category=event#latest');

    await waitFor(() => {
      expect(screen.getByLabelText('Current route').textContent).toBe('/news/en/GMS?category=event#latest');
    });
  });

  it('uses the static URL suffix as the language authority', async () => {
    renderRoute('/guides/grandis-content-progression-guide/ja');

    await waitFor(() => expect(i18n.language).toBe('ja'));
    expect(localStorage.getItem('i18nextLng')).toBe('ja');
    expect(document.documentElement.lang).toBe('ja');
    expect(screen.getByLabelText('Current route').textContent).toBe('/guides/grandis-content-progression-guide/ja/GMS');
  });

  it('uses the static URL suffix as the server authority', async () => {
    renderRoute('/rankings/zh-hant/TMS');

    await waitFor(() => expect(localStorage.getItem('maplehub-game-version')).toBe('tms'));
    expect(document.documentElement.dataset.server).toBe('tms');
  });
});
