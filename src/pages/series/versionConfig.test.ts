import { describe, expect, it } from 'vitest';
import { getSeriesVersions, getSeriesVersionShortLabel } from './versionConfig';

describe('series server versions', () => {
  it('keeps all regional servers for the main PC game', () => {
    expect(getSeriesVersions('maplestory-pc').map((item) => item.id)).toEqual(['gms', 'kms', 'jms', 'tms', 'msea']);
  });

  it('narrows products that only have one supported global service', () => {
    expect(getSeriesVersions('maplestory-classic').map((item) => item.id)).toEqual(['gms']);
    expect(getSeriesVersions('maplestory-n').map((item) => item.id)).toEqual(['gms']);
    expect(getSeriesVersions('maplestory-idle').map((item) => item.id)).toEqual(['gms']);
  });

  it('uses product-region labels outside the main PC game', () => {
    expect(getSeriesVersionShortLabel('maplestory-m', 'gms')).toBe('GLB');
    expect(getSeriesVersionShortLabel('maplestory-worlds', 'kms')).toBe('KR');
  });
});
