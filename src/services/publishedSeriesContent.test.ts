import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  fetchLocalizedSeriesContentBySlug,
  fetchPublishedSeriesTranslations,
} from './publishedSeriesContent';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('published series translations', () => {
  it('can request English because the source content may use another language', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ translations: {} }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchPublishedSeriesTranslations(['news-1'], 'en')).resolves.toEqual({});
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/content-translations?locale=en&slugs=news-1',
      { headers: { Accept: 'application/json' } },
    );
  });

  it('reads approved translations from the website API by stable content id', async () => {
    const translation = {
      slug: 'news-1',
      content_id: 'content-uuid',
      locale: 'zh',
      title: '中文标题',
      summary: '中文摘要',
      body_html: '',
      source_revision: 'sha256:revision',
      provider: 'local_model',
      model: 'maplestory-qwen2.5-7b-q4_k_m',
      glossary_version: '1',
      quality_checks: { status: 'passed' },
      review_status: 'approved',
      updated_at: '2026-07-25T00:00:00Z',
    };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ translations: { 'news-1': translation } }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchPublishedSeriesTranslations(['news-1', 'news-1'], 'zh-CN'))
      .resolves.toEqual({ 'news-1': translation });
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/content-translations?locale=zh&slugs=news-1',
      { headers: { Accept: 'application/json' } },
    );
  });

  it('falls back to source content when the translation API is unavailable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
    await expect(fetchPublishedSeriesTranslations(['news-1'], 'ja')).resolves.toEqual({});
  });

  it('reads a field-level localized content projection by stable slug', async () => {
    const content = {
      content_id: 'content-uuid',
      requested_locale: 'zh-CN',
      database_locale: 'zh',
      source_language: 'en',
      localization_kind: 'partial',
      localizationKind: 'partial',
      title: '中文标题',
      summary: '中文摘要',
      body_html: '<p>Source body</p>',
      content_data: {},
      translated_fields: ['title', 'summary'],
      fallback_fields: ['body_html'],
      translatedFields: ['title', 'summary'],
      fallbackFields: ['body_html'],
    };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ content }),
    }));

    await expect(fetchLocalizedSeriesContentBySlug('news-1', 'zh-CN')).resolves.toEqual(content);
    expect(fetch).toHaveBeenCalledWith(
      '/api/content-translations?locale=zh&slug=news-1',
      { headers: { Accept: 'application/json' } },
    );
  });
});
