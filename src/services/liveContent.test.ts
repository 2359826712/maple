// @vitest-environment jsdom

import { describe, expect, it, vi } from 'vitest';
import {
  extractOfficialArticleImage,
  getNewsFallbackImage,
  getRegionalContentImage,
  normalizeEventFeed,
  normalizeTmsBulletins,
  officialArticleHref,
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

  it('builds an internal route for official articles', () => {
    const href = officialArticleHref('https://www.maplesea.com/news/view/example/', 'Example', 'msea');
    const url = new URL(href, 'https://maplehub.test');
    expect(url.pathname).toBe('/source');
    expect(url.searchParams.get('url')).toBe('https://www.maplesea.com/news/view/example/');
    expect(url.searchParams.get('server')).toBe('msea');
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
