import { describe, expect, it } from 'vitest';
import { mapLocalizedSeriesContent, type LocalizedSeriesContentRow } from './seriesContentTranslation';

const sourceRow: LocalizedSeriesContentRow = {
  content_id: 'content-id',
  source_language: 'en',
  source_title: 'Source title',
  source_summary: 'Source summary',
  source_body_html: '<p>Source body</p>',
  source_revision: 'sha256:revision',
  source_updated_at: '2026-07-22T00:00:00Z',
  translated_title: null,
  translated_summary: null,
  translated_body_html: null,
  provider: null,
  model: null,
  glossary_version: null,
  quality_checks: null,
  review_status: null,
  translation_updated_at: null,
};

describe('series content database localization', () => {
  it('returns source content when no approved database translation exists', () => {
    expect(mapLocalizedSeriesContent(sourceRow, 'zh')).toMatchObject({
      requested_locale: 'zh',
      localization_kind: 'source',
      title: 'Source title',
      provider: 'source',
      review_status: 'source',
    });
  });

  it('uses a current approved database translation', () => {
    expect(mapLocalizedSeriesContent({
      ...sourceRow,
      translated_title: '中文标题',
      translated_summary: '中文摘要',
      translated_body_html: '',
      provider: 'local',
      model: 'runtime-model',
      glossary_version: '1',
      quality_checks: { numbers_match: true },
      review_status: 'approved',
      translation_updated_at: '2026-07-22T01:00:00Z',
    }, 'zh')).toMatchObject({
      localization_kind: 'translated',
      title: '中文标题',
      provider: 'local',
      model: 'runtime-model',
      review_status: 'approved',
    });
  });
});
