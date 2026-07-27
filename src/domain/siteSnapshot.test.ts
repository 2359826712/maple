import { describe, expect, it } from 'vitest';
import contentStatistics from '../../generated/content-statistics.json';
import resourceStatistics from '../../generated/statistics.json';
import { formattedSiteSnapshot, getSeriesSnapshot, siteSnapshot } from './siteSnapshot';

describe('generated site snapshot', () => {
  it('keeps landing-page proof synchronized with generated data', () => {
    expect(siteSnapshot.content).toBe(contentStatistics.total_content);
    expect(siteSnapshot.resources).toBe(resourceStatistics.total_resources);
    expect(siteSnapshot.series).toBe(6);
    expect(siteSnapshot.sources).toBe(contentStatistics.total_sources);
    expect(formattedSiteSnapshot.content).toBe(siteSnapshot.content.toLocaleString('en-US'));
  });

  it('reports honest per-series coverage for data-aware series cards', () => {
    expect(getSeriesSnapshot('maplestory-pc')).toEqual({
      content: contentStatistics.series.maplestory,
      resources: resourceStatistics.series.maplestory,
    });
    expect(getSeriesSnapshot('maplestory-m')).toEqual({
      content: contentStatistics.series.m,
      resources: resourceStatistics.series.m,
    });
    expect(getSeriesSnapshot('unknown')).toEqual({ content: 0, resources: 0 });
  });
});
