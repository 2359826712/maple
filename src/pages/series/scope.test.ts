import { describe, expect, it } from 'vitest';
import {
  getSeriesModuleHref,
  getSeriesResourceHref,
  getSeriesRouteState,
  isSeriesModuleAvailable,
  isSharedSeriesModule,
  scopeModuleHref,
  withSeriesScope,
} from './scope';

describe('series module scope', () => {
  it('keeps the real module route and stores the series in the query string', () => {
    expect(getSeriesModuleHref('maplestory-m', 'guides')).toBe('/guides?series=maplestory-m');
    expect(scopeModuleHref('maplestory-n', '/rankings')).toBe('/rankings?series=maplestory-n');
  });

  it('preserves existing search and hash state', () => {
    expect(withSeriesScope('/news?q=Classic#latest', 'maplestory-classic'))
      .toBe('/news?q=Classic&series=maplestory-classic#latest');
    expect(scopeModuleHref('maplestory-m', '/mapler-house#enhance'))
      .toBe('/mapler-house?series=maplestory-m#enhance');
  });

  it('keeps shared shop, community, and feedback content scoped to the selected series', () => {
    expect(isSharedSeriesModule('shop')).toBe(true);
    expect(isSharedSeriesModule('community')).toBe(true);
    expect(isSharedSeriesModule('feedback')).toBe(true);
    expect(isSharedSeriesModule('news')).toBe(false);
    expect(getSeriesModuleHref('maplestory-m', 'shop')).toBe('/shop?series=maplestory-m');
    expect(getSeriesModuleHref('maplestory-n', 'community')).toBe('/community?series=maplestory-n');
    expect(getSeriesModuleHref('maplestory-classic', 'feedback')).toBe('/feedback?series=maplestory-classic');
    expect(scopeModuleHref('maplestory-idle', '/shop?ref=nav#offers'))
      .toBe('/shop?ref=nav&series=maplestory-idle#offers');
    expect(scopeModuleHref('maplestory-worlds', '/feedback'))
      .toBe('/feedback?series=maplestory-worlds');
    expect(getSeriesResourceHref('maplestory-classic', 'community', 'classic-world-subreddit'))
      .toBe('/series/maplestory-classic/community/classic-world-subreddit');
  });

  it('reads both current and legacy series routes', () => {
    expect(getSeriesRouteState('/news', '?series=maplestory-idle')).toEqual({
      seriesId: 'maplestory-idle',
      module: 'news',
    });
    expect(getSeriesRouteState('/series/maplestory-m/guides')).toEqual({
      seriesId: 'maplestory-m',
      module: 'guides',
    });
  });

  it('keeps the owning module on article and nested detail routes', () => {
    expect(getSeriesRouteState('/content/news/patch-note', '?series=maplestory-classic')).toEqual({
      seriesId: 'maplestory-classic',
      module: 'news',
    });
    expect(getSeriesRouteState('/wiki/boss/lotus')).toEqual({
      seriesId: undefined,
      module: 'wiki',
    });
    expect(getSeriesRouteState('/maps/arcane-river')).toEqual({
      seriesId: undefined,
      module: 'tools',
    });
    expect(getSeriesRouteState('/series/maplestory-idle/tools/hero-token-calculator')).toEqual({
      seriesId: 'maplestory-idle',
      module: 'tools',
    });
  });

  it('only exposes rankings for series with verified ranking resources', () => {
    expect(isSeriesModuleAvailable('maplestory-pc', 'rankings')).toBe(true);
    expect(isSeriesModuleAvailable('maplestory-n', 'rankings')).toBe(true);
    expect(isSeriesModuleAvailable('maplestory-idle', 'rankings')).toBe(true);
    ['maplestory-classic', 'maplestory-m', 'maplestory-worlds']
      .forEach((seriesId) => expect(isSeriesModuleAvailable(seriesId, 'rankings')).toBe(false));
    expect(isSeriesModuleAvailable('maplestory-idle', 'news')).toBe(true);
  });
});
