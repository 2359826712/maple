// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
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

afterEach(() => {
  cleanup();
  window.gtag = undefined;
});

describe('HomeSeriesGateway landing page', () => {
  it('presents one primary value proposition and a direct series-selection CTA', () => {
    render(<MemoryRouter><HomeSeriesGateway /></MemoryRouter>);

    expect(screen.getByRole('heading', { level: 1, name: 'landing_title_line1—landing_title_line2' })).toBeTruthy();
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

  it('emits a privacy-safe conversion event for the primary CTA', () => {
    const gtag = vi.fn();
    window.gtag = gtag;
    render(<MemoryRouter><HomeSeriesGateway /></MemoryRouter>);

    fireEvent.click(screen.getByRole('link', { name: 'landing_primary_cta' }));

    expect(gtag).toHaveBeenCalledWith('event', 'landing_cta_click', {
      action: 'hero_series_selector',
      destination: '#choose-your-series',
    });
  });
});
