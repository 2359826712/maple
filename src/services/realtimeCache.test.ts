// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cachedTextFetch, getRealtimeCacheSavedAt } from './realtimeCache';
import { sanitizeMirroredHtml } from './sanitizeHtml';

describe('realtime text cache import boundary', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it('transforms remote HTML before returning or persisting it', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => '<main><p>Safe</p><script>alert(1)</script></main>',
    });
    vi.stubGlobal('fetch', fetchMock);

    const output = await cachedTextFetch('https://example.com/guide', {
      cacheKey: 'sanitized-guide',
      freshMs: 60_000,
      transform: sanitizeMirroredHtml,
    });
    expect(output).toContain('<p>Safe</p>');
    expect(output).not.toContain('<script');

    const cacheValues = Object.keys(window.localStorage)
      .filter((key) => key.startsWith('maplehub-realtime-cache:'))
      .map((key) => window.localStorage.getItem(key) || '');
    expect(cacheValues).toHaveLength(1);
    expect(cacheValues[0]).not.toContain('<script');
    expect(getRealtimeCacheSavedAt('sanitized-guide')).toEqual(expect.any(Number));

    const cachedOutput = await cachedTextFetch('https://example.com/guide', {
      cacheKey: 'sanitized-guide',
      freshMs: 60_000,
      transform: sanitizeMirroredHtml,
    });
    expect(cachedOutput).toBe(output);
    expect(fetchMock).toHaveBeenCalledOnce();
  });
});
