import { describe, expect, it } from 'vitest';
import { preserveEditorialReview } from './crawl.mjs';

describe('crawl editorial review preservation', () => {
  it('keeps reviewed summaries and sections when a source is recrawled', () => {
    const candidate = {
      summary: 'Generated publication summary.',
      metadata: {
        sections: [{ title: 'Official publication record', items: ['Thread 1.'] }],
        fetched_at: '2026-07-19T00:00:00Z',
      },
    };
    const previous = {
      summary: 'Factual reviewed summary.',
      metadata: {
        sections: [{ title: 'Maintenance window', items: ['Completed at 18:00 PDT.'] }],
        editorial_reviewed: true,
        editorial_reviewed_at: '2026-07-18',
      },
    };

    expect(preserveEditorialReview(candidate, previous)).toEqual({
      summary: 'Factual reviewed summary.',
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
