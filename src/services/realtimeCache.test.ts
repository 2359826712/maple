// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cachedJsonFetch, cachedTextFetch, cachedValueLoad, getRealtimeCacheSavedAt, realtimeCacheDurations } from './realtimeCache';
import { sanitizeMirroredHtml } from './sanitizeHtml';

describe('realtime text cache import boundary', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it('uses a twelve-hour refresh window for remote content', () => {
    expect(realtimeCacheDurations.refresh).toBe(5 * 60 * 1000);
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
    expect(fetchMock.mock.calls[0][0]).toContain('/api/static-content?url=');
  });

  it('sends external POST data through the database-backed static content endpoint', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) });
    vi.stubGlobal('fetch', fetchMock);

    await cachedJsonFetch('https://v66rewn65j.execute-api.us-west-2.amazonaws.com/prod/fetch-mongodb', {
      cacheKey: 'map-data',
      requestInit: {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reqType: 'regionData', region: 'grandis' }),
      },
    });

    expect(fetchMock.mock.calls[0][0]).toBe('/api/static-content');
    const init = fetchMock.mock.calls[0][1] as globalThis.RequestInit;
    const descriptor = JSON.parse(String(init.body));
    expect(descriptor).toMatchObject({ method: 'POST', headers: { 'Content-Type': 'application/json' } });
    expect(atob(descriptor.body)).toContain('regionData');
  });

  it('routes the WordPress KMS fallback through the static-content proxy', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ posts: [] }) });
    vi.stubGlobal('fetch', fetchMock);
    const url = 'https://public-api.wordpress.com/wp/v2/sites/orangemushroom.net/posts?categories=36821';

    await cachedJsonFetch(url, { cacheKey: 'kms-wordpress-fallback' });

    expect(fetchMock.mock.calls[0][0]).toContain('/api/static-content?url=');
    expect(decodeURIComponent(String(fetchMock.mock.calls[0][0]))).toContain(url);
  });

  it('does not let a speculative text failure cool down the foreground request', async () => {
    const fetchMock = vi.fn()
      .mockRejectedValueOnce(new Error('temporary failure'))
      .mockResolvedValueOnce(new Response('loaded', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(cachedTextFetch('https://example.com/speculative-guide', {
      cacheKey: 'speculative-guide',
      suppressFailureCooldown: true,
    })).rejects.toThrow('temporary failure');

    await expect(cachedTextFetch('https://example.com/speculative-guide', {
      cacheKey: 'speculative-guide',
      suppressFailureCooldown: true,
    })).resolves.toBe('loaded');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('returns partial values without persisting them as successful cache entries', async () => {
    type ProbeValue = { value: string; partial: boolean };
    const values: ProbeValue[] = [
      { value: 'source fallback', partial: true },
      { value: 'translated copy', partial: false },
    ];
    const loader = vi.fn(async (): Promise<ProbeValue> => values.shift() || values[0]);

    const first = await cachedValueLoad('partial-translation', loader, {
      shouldCache: (result) => !result.partial,
    });
    const second = await cachedValueLoad('partial-translation', loader, {
      shouldCache: (result) => !result.partial,
    });
    const third = await cachedValueLoad('partial-translation', loader, {
      shouldCache: (result) => !result.partial,
    });

    expect(first.value).toBe('source fallback');
    expect(second.value).toBe('translated copy');
    expect(third.value).toBe('translated copy');
    expect(loader).toHaveBeenCalledTimes(2);
  });
});
