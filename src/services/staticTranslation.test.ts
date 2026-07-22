// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { translateStaticText, translateStaticTextsWithStatus } from './staticTranslation';

describe('static translation', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it('keeps large HTML as source content without calling a realtime provider', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const longText = 'A long guide sentence with useful details. '.repeat(5_000);
    const output = await translateStaticText(
      `<article><h1>Guide title</h1><p>${longText}</p><code>doNotTranslate()</code></article>`,
      'zh',
      { sourceLanguage: 'en', format: 'html' },
    );

    expect(fetchMock).not.toHaveBeenCalled();
    expect(output).toContain('<article>');
    expect(output).toContain('<h1>Guide title</h1>');
    expect(output).toContain('<code>doNotTranslate()</code>');
    expect(output).toContain('A long guide sentence');
  });

  it('returns the same source document without making a request', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const source = '<article><p>Unique completed document cache source.</p></article>';

    const first = await translateStaticText(source, 'zh', { sourceLanguage: 'en', format: 'html' });
    const second = await translateStaticText(source, 'zh', { sourceLanguage: 'en', format: 'html' });

    expect(second).toBe(first);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('marks source fallback indexes unavailable without calling the old endpoint', async () => {
    const fetchMock = vi.fn();
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
      translations: ['Cached title', 'New source excerpt'],
      unavailableIndexes: [0, 1],
    });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(second).toEqual(first);
  });
});
