import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchPublishedSeriesTranslations } from './publishedSeriesContent';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('published series translations', () => {
  it('does not request translations for English content', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchPublishedSeriesTranslations(['news-1'], 'en')).resolves.toEqual({});
    expect(fetchMock).not.toHaveBeenCalled();
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
});
