import { afterEach, describe, expect, it, vi } from 'vitest';
import { cachedJsonFetch } from './realtimeCache';

describe('server realtime transport', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('fetches absolute API URLs directly without browser globals', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ id: 'server-item' }],
    });
    vi.stubGlobal('fetch', fetchMock);
    const url = 'https://example.com/api/news';

    await expect(cachedJsonFetch(url, { cacheKey: 'server-news-test' })).resolves.toEqual([
      { id: 'server-item' },
    ]);
    expect(fetchMock.mock.calls[0][0]).toBe(url);
  });
});
