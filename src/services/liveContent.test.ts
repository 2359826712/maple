// @vitest-environment jsdom

import { describe, expect, it, vi } from 'vitest';
import {
  extractOfficialArticleImage,
  getPrefetchedOfficialArticleDocument,
  getNewsFallbackImage,
  getRegionalContentImage,
  normalizeEventFeed,
  normalizeOrangeMushroomKmsCoverage,
  normalizeTmsBulletins,
  officialArticleHref,
  fetchOfficialArticleDocument,
  fetchLiveGuideContent,
  parseJmsListing,
  parseKmsListing,
  parseMseaListing,
  parseGrandisSectionPage,
  validateHydratedWikiEntry,
  wikiEntryFromMirrorRecord,
} from './liveContent';
import type { WikiMirrorPageRecord } from './mapleSqlApi';
import type { WikiEntry } from '@/mocks/wiki';

describe('official regional news adapters', () => {
  it('uses distinct branded fallbacks for regional servers', () => {
    expect(new Set([
      getNewsFallbackImage('jms'),
      getNewsFallbackImage('tms'),
      getNewsFallbackImage('msea'),
    ]).size).toBe(3);
    expect(getRegionalContentImage(getNewsFallbackImage('gms'), 'jms')).toBe(getNewsFallbackImage('jms'));
  });

  it('prefers real article artwork over generic social and tracking images', () => {
    const image = extractOfficialArticleImage(`
      <meta property="og:image" content="http://media.example.com/facebook/maplestory.png">
      <main>
        <img width="1" height="1" src="https://tracker.example.com/pixel.png">
        <img data-src="/uploads/summer-event.webp" alt="Summer event">
      </main>
    `, 'https://maplestory.example.com/news/123');

    expect(image).toBe('https://maplestory.example.com/uploads/summer-event.webp');
  });

  it('imports KMS notices and events', () => {
    const items = parseKmsListing(`
      <ul><li>
        <p><a href="/News/Notice/All/149495"><em><img src="notice.png" alt="[공지]"></em><span>운영정책 안내</span></a></p>
        <div class="heart_date">2026.07.09</div>
      </li></ul>
    `, 'General');

    expect(items[0]).toMatchObject({
      title: '운영정책 안내',
      versions: ['kms'],
      sourceUrl: 'https://maplestory.nexon.com/News/Notice/All/149495',
    });
  });

  it('keeps KMS news and event coverage available when the Nexon listing proxy fails', () => {
    const items = normalizeOrangeMushroomKmsCoverage([{ posts: [
      {
        ID: 82441,
        title: 'KMS ver. 1.2.416 &#8211; Ruler of Covenants',
        URL: 'http://orangemushroom.net/2026/07/05/kms-ver-1-2-416/',
        date: '2026-07-05T09:48:29-04:00',
        excerpt: '<p>The newest Korean MapleStory update.</p>',
        featured_image: 'https://orangemushroom.wordpress.com/update.png',
        author: { name: 'Max' },
        categories: { KMS: {} },
      },
      {
        ID: 82117,
        title: 'KMS ver. 1.2.415 &#8211; Maple Attack: Event Boss',
        URL: 'https://orangemushroom.net/2026/05/20/kms-ver-1-2-415/',
        date: '2026-05-20T11:47:51-04:00',
        excerpt: '<p>Event coverage.</p>',
        categories: { KMS: {} },
      },
    ] }]);

    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({
      title: 'KMS ver. 1.2.416 – Ruler of Covenants',
      category: 'Patch Notes',
      sourceLanguage: 'en',
      versions: ['kms'],
    });
    expect(items[1]).toMatchObject({ category: 'Event', versions: ['kms'] });
  });

  it('builds an internal route for official articles', () => {
    const href = officialArticleHref('https://www.maplesea.com/news/view/example/', 'Example', 'msea', '/static/example.webp');
    const url = new URL(href, 'https://maplehub.test');
    expect(url.pathname).toBe('/source');
    expect(url.searchParams.get('url')).toBe('https://www.maplesea.com/news/view/example/');
    expect(url.searchParams.get('server')).toBe('msea');
    expect(url.searchParams.get('image')).toBe('/static/example.webp');
  });

  it('loads Orange Mushroom fallback articles through the WordPress content API', async () => {
    window.localStorage.clear();
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify([{
      content: { rendered: '<article><h2>KMS update</h2><p>Verified article body.</p></article>' },
    }]), { status: 200, headers: { 'Content-Type': 'application/json' } }));

    try {
      const article = await fetchOfficialArticleDocument(
        'https://orangemushroom.net/2026/07/04/kms-ver-1-2-416-maplestory-overdrive/',
        'kms',
      );

      expect(article.html).toContain('Verified article body.');
      expect(getPrefetchedOfficialArticleDocument(article.sourceUrl, 'kms')).toEqual(article);
      expect(String(fetchMock.mock.calls[0]?.[0])).toContain('/static-content?url=');
    } finally {
      fetchMock.mockRestore();
    }
  });

  it('imports MapleStorySEA listing rows as in-site news cards', () => {
    const items = parseMseaListing(`
      <ul><li class="title_links">[08.07] :
        <a href="https://www.maplesea.com/events/view/v252_Sunday_Jul/"><img src="/images/sunday.jpg">July Sunday Maple Benefits</a>
      </li></ul>
    `, 'Event');

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      title: 'July Sunday Maple Benefits',
      category: 'Event',
      versions: ['msea'],
      sourceUrl: 'https://www.maplesea.com/events/view/v252_Sunday_Jul/',
      image: 'https://www.maplesea.com/images/sunday.jpg',
    });
  });

  it('imports JMS notice table rows with their official article URL', () => {
    const items = parseJmsListing(`
      <table class="notice-list"><tr>
        <td class="category"><p class="event">イベント</p></td>
        <td class="ttl"><p><a href="/notice/view/?alias=abc&amp;id=event"><img data-src="/images/sunday.png">サンデーメイプル</a></p></td>
        <td class="date">2026.07.08</td><td class="view">20662</td>
      </tr></table>
    `);

    expect(items[0]).toMatchObject({
      title: 'サンデーメイプル',
      category: 'Event',
      versions: ['jms'],
      sourceUrl: 'https://maplestory.nexon.co.jp/notice/view/?alias=abc&id=event',
      image: 'https://maplestory.nexon.co.jp/images/sunday.png',
    });
  });

  it('attaches reviewed locale copies to current JMS notices', () => {
    const items = parseJmsListing(`
      <table class="notice-list"><tr>
        <td class="category"><p class="event">イベント</p></td>
        <td class="ttl"><p><a href="/notice/view/?alias=23be945847fd412cb1bc778856c2478a&amp;id=all">スペシャルサンデーメイプル</a></p></td>
        <td class="date">2026.07.08</td><td class="view">20662</td>
      </tr></table>
    `);

    expect(items[0].translations?.zh).toEqual({
      title: '特别周日冒险岛',
      excerpt: '特别周日冒险岛',
    });
    expect(items[0].translations?.ko?.title).toBe('스페셜 선데이 메이플');
  });

  it('imports the safe JMS markdown mirror when the official site blocks the backend client', () => {
    const items = parseJmsListing(`
      | カテゴリ | 件名 | 日付 | 表示回数 |
      | --- | --- | --- | --- |
      | イベント | [スペシャルサンデー](https://maplestory.nexon.co.jp/notice/view/?alias=abc&id=all) | 2026.07.08 | 20688 |
    `);

    expect(items[0]).toMatchObject({ title: 'スペシャルサンデー', category: 'Event', versions: ['jms'] });
  });

  it('normalizes TMS bulletin API records', () => {
    const items = normalizeTmsBulletins([{
      bullentinId: '82054', bullentinCatId: '72', startDate: '2026/07/08',
      title: '潘朵拉箱子', urlLink: null,
    }]);

    expect(items[0]).toMatchObject({
      title: '潘朵拉箱子',
      category: 'Event',
      versions: ['tms'],
      sourceUrl: 'https://maplestory.beanfun.com/bulletin?bid=82054',
    });
  });

  it('keeps a real TMS thumbnail and upgrades it to HTTPS', () => {
    const items = normalizeTmsBulletins([{
      bullentinId: '82055', bullentinCatId: '72', startDate: '2026/07/09',
      title: '夏日活動', urlLink: null, thumbnail: 'http://maplestory.beanfun.com/images/summer.jpg',
    }]);

    expect(items[0].image).toBe('https://maplestory.beanfun.com/images/summer.jpg');
  });
});

describe('Grandis class landing import', () => {
  it.each([
    ['boss-pre-quests', 'boss-matchmaking-pre-quests'],
    ['upgrading-and-enhancing-equipment', 'upgrading-enhancing-equipment'],
  ])('loads a cached legacy %s URL from its current source path', async (legacySlug, currentSlug) => {
    window.localStorage.clear();
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(`
      <main id="main-content"><h1>Updated guide</h1><p>Current article body.</p></main>
    `, { status: 200 }));

    try {
      const guide = await fetchLiveGuideContent({
        id: `grandis-content-${legacySlug}`,
        title: 'Updated guide',
        class: 'Content',
        guideSection: 'Content',
        difficulty: 'Intermediate',
        length: 'Live',
        upvotes: 0,
        author: 'Grandis Library',
        versions: ['gms'],
        image: '/grandis.png',
        excerpt: 'Updated guide.',
        sourceLabel: 'Grandis Library',
        sourceUrl: `https://grandislibrary.com/content/${legacySlug}`,
      });

      expect(guide.sourceUrl).toBe(`https://grandislibrary.com/content/${currentSlug}`);
      expect(guide.contentText).toContain('Current article body.');
      expect(decodeURIComponent(String(fetchMock.mock.calls[0]?.[0]))).toContain(`/content/${currentSlug}`);
    } finally {
      fetchMock.mockRestore();
    }
  });

  it('replaces upstream swiper markup with grouped h2 + container sections (GL layout)', () => {
    const page = parseGrandisSectionPage(`
      <main id="main-content">
        <h2>Explorers</h2>
        <div class="ClassSwipers__ClassContainer-sc-1llxi2t-0 upstream-layout">
          <p class="ClassSwipers__FilterTitle">Hero</p>
          <p class="ClassSwipers__FilterTitle">Paladin</p>
        </div>
      </main>
    `, 'classes', 'https://www.grandislibrary.com/classes');

    const doc = new DOMParser().parseFromString(page.html, 'text/html');
    const heading = doc.querySelector('.grandis-class-group-heading');
    const container = doc.querySelector('.grandis-class-group-container');
    const cards = Array.from(container?.querySelectorAll(':scope > a') || []);

    expect(page.html).not.toContain('ClassSwipers__');
    expect(heading?.textContent).toBe('Explorers');
    expect(container?.className).toBe('grandis-class-group-container');
    expect(cards).toHaveLength(2);
    expect(cards.map((card) => card.getAttribute('aria-label'))).toEqual(['Hero', 'Paladin']);
    expect(cards.every((card) => card.querySelectorAll('img').length === 1)).toBe(true);
    expect(cards.every((card) => card.querySelectorAll('span').length === 0)).toBe(true);
  });

  it('adds truthful GMS/source metadata to imported guide cards', () => {
    const syncedAt = '2026-07-12T08:00:00.000Z';
    const page = parseGrandisSectionPage(`
      <main id="main-content">
        <h1>Content</h1>
        <div class="card">
          <a href="/content/progression-guide"><span class="card-title">Progression Guide</span></a>
        </div>
      </main>
    `, 'content', 'https://grandislibrary.com/content', syncedAt);
    const doc = new DOMParser().parseFromString(page.html, 'text/html');
    const link = doc.querySelector('a[href="/guides/grandis-content-progression-guide"]');

    expect(page.sourceSyncedAt).toBe(syncedAt);
    expect(doc.querySelector('h1')).toBeNull();
    expect(link?.getAttribute('data-guide-region')).toBe('gms');
    expect(link?.getAttribute('data-guide-source-synced-at')).toBe(syncedAt);
    expect(doc.querySelector('.maplehub-guide-card-meta')?.textContent).toContain('GMS');
  });

  it('restores local destinations for upstream cards that rely on client-side click handlers', () => {
    const page = parseGrandisSectionPage(`
      <main id="main-content">
        <div class="card">
          <a><img alt="Progression Guide"></a>
          <div class="card-body"><a><div class="card-title">Progression Guide</div></a></div>
        </div>
      </main>
    `, 'content', 'https://grandislibrary.com/content', '2026-07-12T08:00:00.000Z');
    const doc = new DOMParser().parseFromString(page.html, 'text/html');
    const links = Array.from(doc.querySelectorAll('a'));

    expect(links).toHaveLength(2);
    expect(links.every((link) => link.getAttribute('href') === '/guides/grandis-content-progression-guide')).toBe(true);
  });
});

const validEvent = {
  id: 'gms-summer-2026',
  title: 'Summer Event',
  windowStart: '2026-07-12T00:00:00.000Z',
  windowEnd: '2026-08-01T00:00:00.000Z',
  regions: ['gms'],
  rewards: ['Event Ring'],
  source: 'MapleStory',
  sourceUrl: 'https://www.nexon.com/maplestory/news/events/1',
  lastVerified: '2026-07-11T00:00:00.000Z',
};

describe('live event import boundary', () => {
  it('accepts a canonical event feed envelope', () => {
    const imageUrl = 'https://example.com/summer-event.jpg';
    const items = normalizeEventFeed({ items: [{ ...validEvent, imageUrl }] }, Date.parse('2026-07-11T00:00:00.000Z'));
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      id: validEvent.id,
      name: validEvent.title,
      regions: ['gms'],
      rewards: ['Event Ring'],
      image: imageUrl,
    });
  });

  it('rejects records with fabricated or missing event windows', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const items = normalizeEventFeed([
      { ...validEvent, id: 'missing-end', windowEnd: undefined },
      { ...validEvent, id: 'backwards', windowEnd: '2026-07-01T00:00:00.000Z' },
    ], Date.parse('2026-07-11T00:00:00.000Z'));
    expect(items).toEqual([]);
    expect(warn).toHaveBeenCalledTimes(2);
    warn.mockRestore();
  });

  it('omits expired records without changing valid future records', () => {
    const items = normalizeEventFeed([
      { ...validEvent, id: 'expired', windowStart: '2026-07-01T00:00:00.000Z', windowEnd: '2026-07-10T00:00:00.000Z' },
      validEvent,
    ], Date.parse('2026-07-11T00:00:00.000Z'));
    expect(items.map((item) => item.id)).toEqual([validEvent.id]);
  });
});

const mirrorRecord: WikiMirrorPageRecord = {
  id: 'mirror-1',
  source_key: 'mswiki',
  source_page_id: 1,
  namespace: 0,
  title: 'Zakum',
  slug: 'zakum',
  category: 'bosses',
  source_url: 'https://maplestorywiki.net/w/Zakum',
  extract: 'Zakum is a boss.',
  content_text: 'Zakum is a boss.',
  content_html: '<p>Safe</p><script>alert(1)</script><a href="javascript:alert(2)">bad</a>',
  word_count: 5,
  tags: ['Bosses'],
  created_at: '2026-07-10T00:00:00.000Z',
  updated_at: '2026-07-11T00:00:00.000Z',
};

describe('wiki import boundary', () => {
  it('validates and sanitizes mirror HTML before exposing it to UI state', () => {
    const entry = wikiEntryFromMirrorRecord(mirrorRecord);
    expect(entry?.htmlContent).toContain('<p>Safe</p>');
    expect(entry?.htmlContent).not.toMatch(/script|javascript:/i);
  });

  it('rejects mirror records without canonical HTTPS provenance', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    expect(wikiEntryFromMirrorRecord({ ...mirrorRecord, source_url: 'http://example.com/wiki/Zakum' })).toBeNull();
    expect(warn).toHaveBeenCalledOnce();
    warn.mockRestore();
  });

  it('rejects blank hydrated content and sanitizes valid live API content', () => {
    const baseEntry: WikiEntry = {
      id: 'mswiki-wiki-1',
      category: 'bosses',
      title: 'Zakum',
      titleZh: 'Zakum',
      icon: 'ri-skull-line',
      tags: ['Bosses'],
      tagsZh: ['Bosses'],
      versions: ['all'],
      description: 'Boss entry',
      descriptionZh: 'Boss entry',
      content: 'Boss entry',
      contentZh: 'Boss entry',
      htmlContent: '<strong>Boss entry</strong><img src="data:text/html,boom">',
      sources: [{ label: 'MapleStory Wiki', href: 'https://maplestorywiki.net/w/Zakum' }],
    };
    expect(validateHydratedWikiEntry(baseEntry)?.htmlContent).toBe('<strong>Boss entry</strong><img>');

    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    expect(validateHydratedWikiEntry({ ...baseEntry, htmlContent: '' })).toBeNull();
    warn.mockRestore();
  });
});
