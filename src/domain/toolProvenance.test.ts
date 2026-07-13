import { describe, expect, it } from 'vitest';
import { getToolProvenance } from './toolProvenance';

const now = new Date('2026-07-13T00:00:00Z');

describe('getToolProvenance', () => {
  it('labels an official source with a current verification record', () => {
    expect(getToolProvenance({
      evidence: 'official',
      lastCheckedAt: '2026-07-01T00:00:00Z',
      now,
    })).toMatchObject({
      evidence: 'official',
      freshness: 'verified',
      evidenceLabelKey: 'tools_evidence_official',
      freshnessLabelKey: 'tools_freshness_verified',
    });
  });

  it('keeps an estimate distinct from its freshness', () => {
    expect(getToolProvenance({
      evidence: 'estimate',
      lastCheckedAt: '2026-07-12T00:00:00Z',
      now,
    })).toMatchObject({
      evidence: 'estimate',
      freshness: 'verified',
      evidenceLabelKey: 'tools_evidence_estimate',
    });
  });

  it('marks an old community reference as stale', () => {
    expect(getToolProvenance({
      evidence: 'community',
      lastCheckedAt: '2025-01-01T00:00:00Z',
      staleAfterDays: 90,
      now,
    })).toMatchObject({
      evidence: 'community',
      freshness: 'stale',
      freshnessLabelKey: 'tools_freshness_stale',
    });
  });

  it.each([undefined, null, 'not-a-date'])('withholds freshness for %s', (lastCheckedAt) => {
    expect(getToolProvenance({ evidence: 'estimate', lastCheckedAt, now })).toMatchObject({
      freshness: 'unavailable',
      freshnessLabelKey: 'tools_freshness_unavailable',
    });
  });
});
