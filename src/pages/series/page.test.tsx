// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import i18n from '@/i18n';
import { VersionProvider } from '@/hooks/VersionContext';
import SeriesPage from './page';

const renderSeries = (seriesId: string, seriesModule?: string) => render(
  <MemoryRouter initialEntries={[`/series/${seriesId}${seriesModule ? `/${seriesModule}` : ''}`]}>
    <VersionProvider>
      <SeriesPage initialSeriesId={seriesId} initialSeriesModule={seriesModule} />
    </VersionProvider>
  </MemoryRouter>,
);

const renderSeriesPath = (path: string, seriesId?: string, seriesModule?: string) => render(
  <MemoryRouter initialEntries={[path]}>
    <VersionProvider>
      <SeriesPage initialSeriesId={seriesId} initialSeriesModule={seriesModule} />
    </VersionProvider>
  </MemoryRouter>,
);

describe('SeriesPage', () => {
  beforeEach(async () => {
    localStorage.clear();
    await i18n.changeLanguage('en');
  });

  afterEach(cleanup);

  it('renders a substantive series hub instead of redirecting to a query-string page', () => {
    renderSeries('maplestory-n');

    expect(screen.getByRole('heading', {
      name: 'MapleStory N news, guides, events, wiki, and tools',
    })).toBeTruthy();
    expect(screen.getByText('Structured content').nextElementSibling?.textContent).toMatch(/\d+/);
    expect(screen.getByRole('link', { name: 'Browse latest updates' }).getAttribute('href'))
      .toBe('/series/maplestory-n/updates');
    expect(screen.getByRole('link', { name: 'Use MapleStory N tools' }).getAttribute('href'))
      .toBe('/series/maplestory-n/tools');
  });

  it('renders a functional per-series tool workspace on the clean route', () => {
    renderSeries('maplestory-worlds', 'tools');

    expect(screen.getByRole('heading', { name: 'MapleStory Worlds Tools' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Creator release checklist' })).toBeTruthy();
    expect(screen.getAllByRole('checkbox').length).toBeGreaterThan(0);
  });

  it('renders a per-series maps route instead of falling back to the generic series hub', () => {
    renderSeries('maplestory-m', 'maps');

    expect(screen.getByRole('heading', { name: 'MapleStory M Maps' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'MapleStory M map workspace' })).toBeTruthy();
  });

  it('renders Classic Events when the clean route uses the GLB suffix', () => {
    renderSeriesPath('/series/maplestory-classic/events/en/GLB', 'maplestory-classic', 'events');

    expect(screen.getAllByRole('heading', { name: 'MapleStory Classic World Events' }).length).toBeGreaterThan(0);
    expect(screen.queryByText('This series content could not be found')).toBeNull();
  });

  it('renders MeowDB-backed Classic World maps, regions, and monster links', () => {
    renderSeries('maplestory-classic', 'maps');

    expect(screen.getByRole('heading', { name: 'MapleStory Classic map atlas' })).toBeTruthy();
    expect(screen.getAllByText('304').length).toBeGreaterThan(0);
    expect(screen.getAllByText('88').length).toBeGreaterThan(0);
    expect(screen.getByRole('heading', { name: 'World Map and Table View' })).toBeTruthy();
    expect(screen.getByPlaceholderText('Search maps or monsters...')).toBeTruthy();
    const henesysButton = screen.getAllByRole('button')
      .find((button) => button.textContent?.includes('弓箭手村'));
    expect(henesysButton).toBeTruthy();
    fireEvent.click(henesysButton!);
    expect(screen.getAllByRole('heading', { name: '弓箭手村' }).length).toBeGreaterThan(0);
    fireEvent.change(screen.getByPlaceholderText('Search maps or monsters...'), { target: { value: 'Slime' } });
    expect(screen.getAllByText('King Slime').length).toBeGreaterThan(0);
  });
});
