import { describe, expect, it, vi } from 'vitest';
import { CrawlHttpClient, parseRobots, robotsAllows } from './http.mjs';

describe('crawler HTTP policy', () => {
  it('honors wildcard and end-anchored robots rules without collapsing them to root', () => {
    const rules = parseRobots(`
      User-agent: *
      Allow: /
      Disallow: /*?*q=*
      Disallow: /private$
    `);
    expect(robotsAllows(rules, new URL('https://example.com/news'))).toBe(true);
    expect(robotsAllows(rules, new URL('https://example.com/news?q=test'))).toBe(false);
    expect(robotsAllows(rules, new URL('https://example.com/private'))).toBe(false);
    expect(robotsAllows(rules, new URL('https://example.com/private/child'))).toBe(true);
  });

  it('passes public read POST options and keeps request bodies in distinct cache slots', async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(new Response('User-agent: *\nAllow: /', { status: 200 }))
      .mockResolvedValueOnce(new Response('{"ok":true}', { status: 200, headers: { 'content-type': 'application/json' } }));
    const state = { urls: {} };
    const client = new CrawlHttpClient(
      { rate_limit: { requests: 20, per_seconds: 1 } },
      state,
      { fetchImpl, now: () => new Date('2026-07-18T12:00:00Z') },
    );
    const response = await client.fetch('https://example.com/api', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: '{"page":1}',
    });
    expect(response.status).toBe(200);
    expect(fetchImpl.mock.calls[1][1]).toMatchObject({ method: 'POST', body: '{"page":1}' });
    expect(Object.keys(state.urls)[0]).toMatch(/^POST:/);
  });
});
