import { describe, expect, it } from 'vitest';
import {
  mapLocalizedSeriesContent,
  normalizeDatabaseContentLocale,
  type LocalizedSeriesContentRow,
} from './seriesContentTranslation';

const sourceRow: LocalizedSeriesContentRow = {
  content_id: 'content-id',
  source_language: 'en',
  source_title: 'Source title',
  source_summary: 'Source summary',
  source_body_html: '<p>Source body</p>',
  source_content_data: { metadata: { sections: [{ title: 'Source section' }] } },
  source_revision: 'sha256:revision',
  source_updated_at: '2026-07-22T00:00:00Z',
  translated_title: null,
  translated_summary: null,
  translated_body_html: null,
  translated_content_data: null,
  provider: null,
  model: null,
  glossary_version: null,
  quality_checks: null,
  review_status: null,
  translation_updated_at: null,
  fulltext_translation_updated_at: null,
};

describe('series content database localization', () => {
  it.each([
    ['zh-CN', 'zh'],
    ['zh_TW', 'zh-Hant'],
    ['zh-HK', 'zh-Hant'],
    ['zh-Hant', 'zh-Hant'],
    ['ja-JP', 'ja'],
    ['ko-KR', 'ko'],
    ['en-US', 'en'],
    ['fr', null],
  ])('maps route locale %s to database locale %s', (routeLocale, databaseLocale) => {
    expect(normalizeDatabaseContentLocale(routeLocale)).toBe(databaseLocale);
  });

  it('returns source content when no approved database translation exists', () => {
    expect(mapLocalizedSeriesContent(sourceRow, 'zh', 'zh-CN')).toMatchObject({
      requested_locale: 'zh-CN',
      database_locale: 'zh',
      localization_kind: 'source',
      localizationKind: 'source',
      title: 'Source title',
      summary: 'Source summary',
      body_html: '<p>Source body</p>',
      content_data: sourceRow.source_content_data,
      translated_fields: [],
      fallback_fields: ['title', 'summary', 'body_html', 'content_data'],
      translatedFields: [],
      fallbackFields: ['title', 'summary', 'body_html', 'content_data'],
      provider: 'source',
      review_status: 'source',
    });
  });

  it('uses field-level fallback when the title pipeline has no translated body', () => {
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
      localization_kind: 'partial',
      title: '中文标题',
      summary: '中文摘要',
      body_html: '<p>Source body</p>',
      content_data: sourceRow.source_content_data,
      translated_fields: ['title', 'summary'],
      fallback_fields: ['body_html', 'content_data'],
      provider: 'local',
      model: 'runtime-model',
      review_status: 'approved',
    });
  });

  it('combines current title and structured-content translations', () => {
    const translatedContentData = { metadata: { sections: [{ title: '中文章节' }] } };
    expect(mapLocalizedSeriesContent({
      ...sourceRow,
      translated_title: '中文标题',
      translated_summary: '中文摘要',
      translated_body_html: '<p>中文正文</p>',
      translated_content_data: translatedContentData,
      provider: 'local',
      model: 'runtime-model',
      glossary_version: '1',
      quality_checks: { numbers_match: true },
      review_status: 'automatic',
      translation_updated_at: '2026-07-22T01:00:00Z',
      fulltext_translation_updated_at: '2026-07-22T02:00:00Z',
    }, 'zh')).toMatchObject({
      localization_kind: 'translated',
      content_data: translatedContentData,
      translated_fields: ['title', 'summary', 'body_html', 'content_data'],
      fallback_fields: [],
      updated_at: '2026-07-22T02:00:00Z',
    });
  });

  it('ignores translations when the requested locale is the source locale', () => {
    expect(mapLocalizedSeriesContent({
      ...sourceRow,
      translated_title: 'Unexpected translation',
      translated_content_data: { unexpected: true },
    }, 'en')).toMatchObject({
      localization_kind: 'source',
      title: 'Source title',
      content_data: sourceRow.source_content_data,
      translated_fields: [],
    });
  });
});
