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
    expect(document.querySelectorAll('a[href="#choose-your-series"]')).toHaveLength(4);
    expect(document.getElementById('choose-your-series')).toBeTruthy();
  });

  it('presents ten numbered conversion points with direct next steps', () => {
    render(<MemoryRouter><HomeSeriesGateway /></MemoryRouter>);

    expect(screen.getAllByTestId('conversion-point')).toHaveLength(10);
    expect(screen.getAllByText('landing_point_01_title')).toHaveLength(2);
    expect(screen.getByText('landing_point_10_title')).toBeTruthy();
  });

  it('shows a verifiable index snapshot and a balanced competitor comparison', () => {
    render(<MemoryRouter><HomeSeriesGateway /></MemoryRouter>);

    expect(screen.getAllByTestId('snapshot-stat')).toHaveLength(3);
    expect(screen.getByText('1,540+')).toBeTruthy();
    expect(screen.getByText('31')).toBeTruthy();
    expect(screen.getAllByTestId('comparison-row')).toHaveLength(6);
    expect(screen.getByRole('columnheader', { name: 'landing_compare_mpstorys' })).toBeTruthy();
    expect(screen.getByRole('columnheader', { name: 'landing_compare_official' })).toBeTruthy();
    expect(screen.getByRole('columnheader', { name: 'landing_compare_wiki' })).toBeTruthy();
    expect(screen.getByRole('columnheader', { name: 'landing_compare_tools' })).toBeTruthy();
  });

  it('shows three transparent player-feedback themes and links to the feedback form', () => {
    render(<MemoryRouter><HomeSeriesGateway /></MemoryRouter>);

    expect(screen.getAllByTestId('player-voice')).toHaveLength(3);
    expect(screen.getByText('landing_voice_01_quote')).toBeTruthy();
    expect(screen.getByText('landing_voice_note')).toBeTruthy();
    expect(document.querySelector('[data-conversion-id="player-voice-feedback"]')?.getAttribute('href'))
      .toBe('/feedback/en/GMS');
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

  it('gives every series image descriptive alternative text', () => {
    render(<MemoryRouter><HomeSeriesGateway /></MemoryRouter>);

    const images = screen.getAllByRole('img');
    expect(images).toHaveLength(7);
    images.forEach((image) => {
      expect(image.getAttribute('alt')?.trim()).toBeTruthy();
    });
    expect(images.map((image) => image.getAttribute('alt'))).toEqual([
      'MapleStory',
      'MapleStory',
      'MapleStory Classic World',
      'MapleStory M',
      'MapleStory N',
      'MapleStory Worlds',
      'MapleStory: Idle RPG',
    ]);
  });

  it('keeps the four high-intent content paths one click away', () => {
    render(<MemoryRouter><HomeSeriesGateway /></MemoryRouter>);

    expect(document.querySelector('a[href="/news/en/GMS"]')).toBeTruthy();
    expect(document.querySelector('a[href="/guides/en/GMS"]')).toBeTruthy();
    expect(document.querySelector('a[href="/mapler-house/en/GMS"]')).toBeTruthy();
    expect(document.querySelector('a[href="/events/en/GMS"]')).toBeTruthy();
  });

  it('switches the hero workflow preview between content paths', () => {
    render(<MemoryRouter><HomeSeriesGateway /></MemoryRouter>);

    const eventsTab = screen.getByRole('tab', { name: 'nav_events' });
    expect(eventsTab.getAttribute('aria-selected')).toBe('false');

    fireEvent.click(eventsTab);

    expect(eventsTab.getAttribute('aria-selected')).toBe('true');
    expect(document.querySelector('[data-conversion-id="hero-preview-events"]')?.getAttribute('href'))
      .toBe('/events/en/GMS');
  });

  it('emits a privacy-safe conversion event for the primary CTA', () => {
    const gtag = vi.fn();
    window.gtag = gtag;
    render(<MemoryRouter><HomeSeriesGateway /></MemoryRouter>);

    const heroCta = document.querySelector('[data-conversion-id="hero-series-selector"]');
    expect(heroCta).toBeTruthy();
    fireEvent.click(heroCta as HTMLElement);

    expect(gtag).toHaveBeenCalledWith('event', 'landing_cta_click', {
      action: 'hero_series_selector',
      destination: '#choose-your-series',
    });
  });
});
