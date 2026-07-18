// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { translateStaticText, translateStaticTextsWithStatus } from './staticTranslation';

describe('static translation', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it('translates large HTML in bounded text batches while preserving markup', async () => {
    const requests: Array<{ texts: string[]; format: string }> = [];
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async (_url: string, init: globalThis.RequestInit) => {
      const request = JSON.parse(String(init.body)) as { texts: string[]; format: string };
      requests.push(request);
      return {
        ok: true,
        json: async () => ({
          translations: request.texts.map((text) => `译文：${text}`),
          cached: false,
        }),
      };
    }));

    const longText = 'A long guide sentence with useful details. '.repeat(5_000);
    const output = await translateStaticText(
      `<article><h1>Guide title</h1><p>${longText}</p><code>doNotTranslate()</code></article>`,
      'zh',
      { sourceLanguage: 'en', format: 'html' },
    );

    expect(requests.length).toBeGreaterThan(1);
    requests.forEach((request) => {
      expect(request.format).toBe('text');
      expect(request.texts.length).toBeLessThanOrEqual(40);
      expect(new TextEncoder().encode(request.texts.join('')).byteLength).toBeLessThanOrEqual(95 * 1024);
    });
    expect(output).toContain('<article>');
    expect(output).toContain('<h1>译文：Guide title</h1>');
    expect(output).toContain('<code>doNotTranslate()</code>');
    expect(output).toContain('译文：A long guide sentence');
  });

  it('reuses the completed static document without parsing or requesting it again', async () => {
    const fetchMock = vi.fn().mockImplementation(async (_url: string, init: globalThis.RequestInit) => {
      const request = JSON.parse(String(init.body)) as { texts: string[] };
      return {
        ok: true,
        json: async () => ({ translations: request.texts.map(() => '缓存译文'), cached: false }),
      };
    });
    vi.stubGlobal('fetch', fetchMock);
    const source = '<article><p>Unique completed document cache source.</p></article>';

    const first = await translateStaticText(source, 'zh', { sourceLanguage: 'en', format: 'html' });
    const second = await translateStaticText(source, 'zh', { sourceLanguage: 'en', format: 'html' });

    expect(second).toBe(first);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('caches complete translations returned by the same-origin endpoint', async () => {
    const fetchMock = vi.fn().mockImplementation(async () => ({
      ok: true,
      json: async () => ({ translations: ['已缓存标题', '已补全摘要'], cached: false }),
    }));
    vi.stubGlobal('fetch', fetchMock);

    const first = await translateStaticTextsWithStatus(
      ['Cached title', 'New source excerpt'],
      'zh',
      { sourceLanguage: 'en' },
    );
    const second = await translateStaticTextsWithStatus(
      ['Cached title', 'New source excerpt'],
      'zh',
      { sourceLanguage: 'en' },
    );

    expect(first).toEqual({
      translations: ['已缓存标题', '已补全摘要'],
      unavailableIndexes: [],
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(second).toEqual(first);
  });
});
