import { describe, expect, it } from 'vitest';
import type { IndexedContentRecord } from '@/domain/contentIndex';
import type { LocalizedSeriesContent } from '@/services/seriesContentTranslation';
import {
  getSeriesContentLocalization,
  mergeLocalizedContentRecord,
} from './localizedContent';

const sourceRecord = {
  id: 'stable-slug',
  title: 'Source title',
  summary: 'Source summary',
  canonical_url: 'https://example.com/source',
  source_url: 'https://example.com/source',
  metadata: {
    resource_id: 'stable-resource',
    sections: [{ title: 'Source section', items: ['Source item'] }],
  },
  requirements: ['Source requirement'],
  rewards: ['Source reward'],
} as unknown as IndexedContentRecord;

const localized = {
  requested_locale: 'zh-CN',
  database_locale: 'zh',
  source_language: 'en',
  localization_kind: 'partial',
  localizationKind: 'partial',
  title: '中文标题',
  summary: '中文摘要',
  body_html: '<p>Source body</p>',
  content_data: {
    canonical_url: 'https://malicious.example/changed',
    metadata: {
      resource_id: 'changed-resource',
      sections: [{ title: '中文章节', items: ['中文条目'] }],
    },
    requirements: ['中文条件'],
    rewards: ['中文奖励'],
  },
  translated_fields: ['title', 'summary', 'content_data'],
  fallback_fields: ['body_html'],
  translatedFields: ['title', 'summary', 'content_data'],
  fallbackFields: ['body_html'],
  content_id: 'content-uuid',
  source_revision: 'sha256:revision',
  provider: 'local',
  model: 'model',
  glossary_version: '1',
  quality_checks: {},
  review_status: 'approved',
  updated_at: '2026-07-27T00:00:00Z',
} satisfies LocalizedSeriesContent;

describe('localized series content projection', () => {
  it('merges translated display fields without changing stable identity or URLs', () => {
    const result = mergeLocalizedContentRecord(sourceRecord, localized);

    expect(result).toMatchObject({
      id: 'stable-slug',
      title: '中文标题',
      summary: '中文摘要',
      canonical_url: 'https://example.com/source',
      requirements: ['中文条件'],
      rewards: ['中文奖励'],
      metadata: {
        resource_id: 'stable-resource',
        sections: [{ title: '中文章节', items: ['中文条目'] }],
      },
    });
  });

  it('exposes explicit camel-case SSR localization metadata', () => {
    expect(getSeriesContentLocalization(localized)).toEqual({
      requestedLocale: 'zh-CN',
      databaseLocale: 'zh',
      sourceLanguage: 'en',
      localizationKind: 'partial',
      translatedFields: ['title', 'summary', 'content_data'],
      fallbackFields: ['body_html'],
    });
  });
});
