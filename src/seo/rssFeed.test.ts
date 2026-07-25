import { describe, expect, it } from 'vitest';
import { buildRssFeedXml, getRssFeedItems } from './rssFeed';

describe('MPStorys RSS feed', () => {
  it('renders a public RSS feed with canonical MPStorys item links', () => {
    const items = getRssFeedItems();
    const xml = buildRssFeedXml(items);

    expect(items.length).toBeGreaterThan(0);
    expect(items.length).toBeLessThanOrEqual(50);
    expect(xml).toContain('<rss version="2.0"');
    expect(xml).toContain('<atom:link href="https://mpstorys.com/rss.xml" rel="self" type="application/rss+xml" />');
    expect(xml).toContain('<title>MPStorys Updates</title>');
    expect(xml).toContain('<link>https://mpstorys.com</link>');
    expect(xml).toContain('<item>');
    expect(xml).toContain('https://mpstorys.com/series/');
    expect(xml).not.toContain('https://mpstorys.com/content/');
    expect(xml).not.toContain('<body_text>');
    expect(xml).not.toContain('<body_markdown>');
  });

  it('keeps removed or redirected records out of the feed', () => {
    const items = getRssFeedItems();

    expect(items.every((item) => item.status !== 'removed' && item.status !== 'redirected')).toBe(true);
  });
});
