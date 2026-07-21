import { describe, expect, it } from 'vitest';
import { candidateAudit, preserveDerivedEventState, preserveEditorialReview } from './crawl.mjs';

describe('crawl candidate audit', () => {
  it('reports provenance, storage, hash, date, and duplicate evidence', () => {
    const candidate = {
      id: 'worlds-test-event',
      source_id: 'worlds-creator-center-news',
      external_id: '123',
      original_title: 'Test event',
      canonical_url: 'https://example.com/thread/123',
      published_at: '2026-07-02T05:00:00.000Z',
      updated_at: null,
      series: 'worlds',
      regions: ['global'],
      languages: ['en'],
      content_type: 'event',
      subcategory: 'event',
      storage_mode: 'summary-and-metadata',
      summary: 'An official event with a confirmed schedule.',
      body_text: null,
      body_markdown: null,
      event_start: '2026-07-02T05:00:00.000Z',
      event_end: '2026-10-07T14:59:00.000Z',
      timezone: 'UTC',
      content_hash: 'sha256:test',
      metadata: {
        body_extractable: true,
        original_timezone: null,
        parser: 'worlds-creator-center-news',
        parser_warnings: [],
        unconfirmed_fields: ['updated_at'],
      },
    };
    const previous = { data: candidate };
    const existing = {
      byId: new Map([[candidate.id, previous]]),
      byExternalId: new Map([[`${candidate.source_id}:${candidate.external_id}`, previous]]),
    };

    expect(candidateAudit(candidate, existing, previous)).toMatchObject({
      source_id: 'worlds-creator-center-news',
      source_external_id: '123',
      original_timezone: null,
      content_hash: 'sha256:test',
      summary_extracted: true,
      body_stored: false,
      event_dates_detected: true,
      parser: 'worlds-creator-center-news',
      duplicate: {
        detected: true,
        signals: ['canonical-url', 'stable-content-id', 'source-external-id'],
      },
      quality_gate_passed: true,
    });
  });

  it('accepts an official open-ended event without treating a 9999 sentinel as an end date', () => {
    const candidate = {
      id: 'n-open-ended-event',
      source_id: 'n-official-events',
      external_id: '3472520',
      original_title: 'Maplers Shop',
      canonical_url: 'https://msu.io/maplestoryn/news/events/3472520',
      published_at: '2026-06-11T03:00:00.000Z',
      updated_at: null,
      series: 'n',
      regions: ['multi-region'],
      languages: ['en'],
      content_type: 'event',
      subcategory: 'event',
      storage_mode: 'summary-and-metadata',
      summary: 'An official open-ended event with source-backed publication metadata.',
      body_text: null,
      body_markdown: null,
      event_start: '2026-06-11',
      event_end: null,
      timezone: 'UTC',
      content_hash: 'sha256:open-ended',
      metadata: {
        body_extractable: true,
        event_open_ended: true,
        official_tags: ['2026-06-11', '9999-01-01T23:59:59Z'],
        original_timezone: null,
        parser: 'maplestory-n-official-events',
        parser_warnings: [],
        unconfirmed_fields: ['updated_at'],
      },
    };
    const existing = { byId: new Map(), byExternalId: new Map() };

    expect(candidateAudit(candidate, existing)).toMatchObject({
      event_dates: { event_start: '2026-06-11', event_end: null, timezone: 'UTC' },
      event_dates_detected: true,
      quality_gate_passed: true,
    });
  });
});

describe('crawl editorial review preservation', () => {
  it('keeps reviewed summaries and sections when a source is recrawled', () => {
    const candidate = {
      content_type: 'event',
      subcategory: 'events',
      status: 'published',
      summary: 'Generated publication summary.',
      metadata: {
        sections: [{ title: 'Official publication record', items: ['Thread 1.'] }],
        fetched_at: '2026-07-19T00:00:00Z',
      },
    };
    const previous = {
      content_type: 'event',
      subcategory: 'seasonal-event',
      status: 'expired',
      summary: 'Factual reviewed summary.',
      eligibility: ['Level 200 or higher'],
      rewards: ['Event reward'],
      metadata: {
        sections: [{ title: 'Maintenance window', items: ['Completed at 18:00 PDT.'] }],
        editorial_reviewed: true,
        editorial_reviewed_at: '2026-07-18',
      },
    };

    expect(preserveEditorialReview(candidate, previous)).toEqual({
      content_type: 'event',
      subcategory: 'seasonal-event',
      status: 'expired',
      summary: 'Factual reviewed summary.',
      eligibility: ['Level 200 or higher'],
      rewards: ['Event reward'],
      metadata: {
        sections: [{ title: 'Maintenance window', items: ['Completed at 18:00 PDT.'] }],
        fetched_at: '2026-07-19T00:00:00Z',
        editorial_reviewed: true,
        editorial_reviewed_at: '2026-07-18',
      },
    });
  });

  it('leaves unreviewed generated content unchanged', () => {
    const candidate = { summary: 'Generated.', metadata: { sections: [] } };
    expect(preserveEditorialReview(candidate, { metadata: {} })).toBe(candidate);
  });
});

describe('crawl derived event state preservation', () => {
  it('keeps the calendar status maintained by update:event-status', () => {
    const candidate = { content_type: 'event', calendar_status: 'unknown' };
    const previous = { content_type: 'event', calendar_status: 'active' };
    expect(preserveDerivedEventState(candidate, previous)).toEqual({
      content_type: 'event',
      calendar_status: 'active',
    });
  });

  it('does not apply event state to non-event records', () => {
    const candidate = { content_type: 'news' };
    expect(preserveDerivedEventState(candidate, { content_type: 'news' })).toBe(candidate);
  });
});
