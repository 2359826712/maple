// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import HomeSeriesGateway from './HomeSeriesGateway';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

vi.mock('@/hooks/VersionContext', () => ({
  useVersion: () => ({ version: 'gms' }),
}));

afterEach(cleanup);

describe('HomeSeriesGateway landing page', () => {
  it('presents one primary value proposition and a direct series-selection CTA', () => {
    render(<MemoryRouter><HomeSeriesGateway /></MemoryRouter>);

    expect(screen.getByRole('heading', { level: 1, name: 'home_series_title—series_catalog_title' })).toBeTruthy();
    expect(document.querySelectorAll('a[href="#choose-your-series"]')).toHaveLength(2);
    expect(document.getElementById('choose-your-series')).toBeTruthy();
  });

  it('routes every supported series into its scoped news hub', () => {
    render(<MemoryRouter><HomeSeriesGateway /></MemoryRouter>);

    const expectedSeries = [
      ['MapleStory', 'maplestory-pc'],
      ['MapleStory Classic World', 'maplestory-classic'],
      ['MapleStory M', 'maplestory-m'],
      ['MapleStory N', 'maplestory-n'],
      ['MapleStory Worlds', 'maplestory-worlds'],
      ['MapleStory: Idle RPG', 'maplestory-idle'],
    ];

    expectedSeries.forEach(([name, id]) => {
      expect(screen.getByRole('link', { name: `${name} — series_enter_hub` }).getAttribute('href'))
        .toBe(`/news/en/GMS?series=${id}`);
    });
  });

  it('keeps the four high-intent content paths one click away', () => {
    render(<MemoryRouter><HomeSeriesGateway /></MemoryRouter>);

    expect(document.querySelector('a[href="/news/en/GMS"]')).toBeTruthy();
    expect(document.querySelector('a[href="/guides/en/GMS"]')).toBeTruthy();
    expect(document.querySelector('a[href="/mapler-house/en/GMS"]')).toBeTruthy();
    expect(document.querySelector('a[href="/events/en/GMS"]')).toBeTruthy();
  });
});
