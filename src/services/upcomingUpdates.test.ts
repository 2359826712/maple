// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  fetchUpcomingUpdateArticle,
  fetchUpcomingUpdates,
  normalizeOrangeMushroomArticle,
  normalizeOrangeMushroomFeed,
} from './upcomingUpdates';

describe('Orange Mushroom KMST feed', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('normalizes WordPress posts into safe in-site previews', () => {
    const items = normalizeOrangeMushroomFeed({
      posts: [{
        ID: 83613,
        title: 'KMST ver. 1.2.203 &#8211; 3rd Hexa Skill Core!',
        URL: 'http://orangemushroom.net/example/',
        date: '2026-07-12T08:50:25+08:00',
        excerpt: '<p>New skills &amp; balance changes. [&hellip;]</p>',
        featured_image: 'https://orangemushroom.wordpress.com/image.png',
        author: { name: 'Max' },
        tags: { '6th job': {}, boss: {}, warrior: {}, mage: {}, extra: {} },
      }],
    });

    expect(items).toEqual([expect.objectContaining({
      id: 'orange-mushroom-83613',
      title: 'KMST ver. 1.2.203 – 3rd Hexa Skill Core!',
      excerpt: 'New skills & balance changes.',
      sourceUrl: 'https://orangemushroom.net/example/',
      author: 'Max',
      status: 'kmst',
      tags: ['6th job', 'boss', 'warrior', 'mage'],
    })]);
  });

  it('loads KMST posts through the public WordPress feed', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        found: 1,
        posts: [{
          ID: 1,
          title: 'Test update',
          URL: 'https://orangemushroom.net/test-update/',
          date: '2026-07-12T00:00:00Z',
          excerpt: '<p>Test-server changes.</p>',
        }],
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const feed = await fetchUpcomingUpdates();
    const requestUrl = String(fetchMock.mock.calls[0]?.[0]);

    expect(requestUrl).toContain('public-api.wordpress.com');
    expect(requestUrl).toContain('category=KMST');
    expect(feed.total).toBe(1);
    expect(feed.items[0]?.title).toBe('Test update');
    expect(feed.sourceSyncedAt).toEqual(expect.any(String));
  });

  it('sanitizes complete articles for in-site reading', () => {
    const article = normalizeOrangeMushroomArticle({
      ID: 83613,
      title: 'Full update',
      URL: 'http://orangemushroom.net/full-update/',
      date: '2026-07-12T00:00:00Z',
      excerpt: '<p>Preview</p>',
      content: '<h1 id="overview" style="position:fixed">Overview</h1><script>alert(1)</script><p>Safe body</p><a href="http://orangemushroom.net/source">Source</a>',
    });

    expect(article?.contentHtml).toContain('Safe body');
    expect(article?.contentHtml).toContain('https://orangemushroom.net/source');
    expect(article?.contentHtml).toContain('target="_blank"');
    expect(article?.contentHtml).not.toContain('<script');
    expect(article?.contentHtml).not.toContain('position:fixed');
  });

  it('loads a complete post by its internal feed id', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        ID: 83613,
        title: 'Full update',
        URL: 'https://orangemushroom.net/full-update/',
        date: '2026-07-12T00:00:00Z',
        excerpt: '<p>Preview</p>',
        content: '<h1>Overview</h1><p>Full article content.</p>',
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const article = await fetchUpcomingUpdateArticle('orange-mushroom-83613');

    expect(String(fetchMock.mock.calls[0]?.[0])).toContain('/posts/83613');
    expect(article.contentHtml).toContain('Full article content.');
  });

  it('rejects invalid internal post ids without making a request', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchUpcomingUpdateArticle('https://example.com')).rejects.toThrow('Invalid KMST post id');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
