// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cachedJsonFetch, cachedTextFetch, getRealtimeCacheSavedAt, realtimeCacheDurations } from './realtimeCache';
import { sanitizeMirroredHtml } from './sanitizeHtml';

describe('realtime text cache import boundary', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it('uses a twelve-hour refresh window for remote content', () => {
    expect(realtimeCacheDurations.refresh).toBe(12 * 60 * 60 * 1000);
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
});
