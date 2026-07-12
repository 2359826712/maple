// @vitest-environment jsdom

import { describe, expect, it, vi } from 'vitest';
import {
  normalizeEventFeed,
  parseGrandisSectionPage,
  validateHydratedWikiEntry,
  wikiEntryFromMirrorRecord,
} from './liveContent';
import type { WikiMirrorPageRecord } from './mapleSqlApi';
import type { WikiEntry } from '@/mocks/wiki';

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
    const items = normalizeEventFeed({ items: [validEvent] }, Date.parse('2026-07-11T00:00:00.000Z'));
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      id: validEvent.id,
      name: validEvent.title,
      regions: ['gms'],
      rewards: ['Event Ring'],
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
