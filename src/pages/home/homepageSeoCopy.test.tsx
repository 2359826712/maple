// @vitest-environment jsdom

import { cleanup, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import i18n from '@/i18n';
import common from '@/i18n/local/en/common';
import HomeSeriesGateway from './components/HomeSeriesGateway';

describe('homepage SEO copy', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en');
  });

  afterEach(cleanup);

  it('covers the relevant MapleStory search intents in visible copy', () => {
    const visibleCopy = [
      common.landing_title_line1,
      common.landing_title_line2,
      common.landing_subtitle,
      common.landing_point_04_title,
      common.landing_point_05_title,
      common.landing_point_06_title,
      common.landing_point_07_title,
      common.landing_point_07_desc,
      common.landing_point_08_title,
      common.landing_point_09_title,
    ].join(' ');

    [
      'MapleStory news',
      'MapleStory events',
      'MapleStory guides',
      'MapleStory tools',
      'MapleStory calculators',
      'MapleStory wiki',
      'MapleStory rankings',
    ].forEach((searchIntent) => {
      expect(visibleCopy.toLowerCase()).toContain(searchIntent.toLowerCase());
    });
  });

  it('keeps MapleStory density useful without keyword stuffing', () => {
    const { container } = render(
      <MemoryRouter>
        <HomeSeriesGateway />
      </MemoryRouter>,
    );
    const words: string[] = (container.textContent || '').match(/[A-Za-z0-9:+-]+/g) || [];
    const mapleStoryCount = words.filter((word) => word.toLowerCase().replace(/[^a-z]/g, '') === 'maplestory').length;
    const density = (mapleStoryCount / words.length) * 100;

    expect(density).toBeGreaterThanOrEqual(2.7);
    expect(density).toBeLessThanOrEqual(4.2);
  });

  it('uses complete search phrases and useful series shortcuts', () => {
    const { container } = render(
      <MemoryRouter>
        <HomeSeriesGateway />
      </MemoryRouter>,
    );
    const copy = (container.textContent || '').toLowerCase();
    const exactNewsPhraseCount = copy.split('maplestory news and updates').length - 1;

    expect(exactNewsPhraseCount).toBeGreaterThanOrEqual(7);
    expect(container.querySelectorAll('[data-series-search-link]').length).toBe(24);
    [
      'MapleStory news and updates',
      'MapleStory Classic World news and updates',
      'MapleStory M news and updates',
      'MapleStory N news and updates',
      'MapleStory Worlds news and updates',
      'MapleStory: Idle RPG news and updates',
    ].forEach((phrase) => expect(copy).toContain(phrase.toLowerCase()));
  });
});
