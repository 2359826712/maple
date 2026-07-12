import { getGuideCardCopy } from '@/pages/guides/localizedGuides';
import { getNewsCategoryLabel, getNewsCopy } from '@/pages/news/localizedNews';
import {
  liveStorageKeys,
  type EventItem,
  type GuideItem,
  type NewsItem,
  type ToolResourceItem,
} from '@/services/liveContent';
import type { WikiEntry } from '@/mocks/wiki';
import { bosses } from '@/mocks/bosses';
import { isAvailableInVersion } from '@/domain/regionModel';
import { getBossChecklistRules } from '@/domain/bossChecklistRules';
import type { GameVersion } from '@/domain/regionModel';

export type SearchSection = 'news' | 'guides' | 'events' | 'tools' | 'wiki' | 'maps' | 'bosses';

export type SiteSearchResult = {
  id: string;
  title: string;
  excerpt: string;
  href: string;
  section: SearchSection;
  icon: string;
  score: number;
};

type SearchableResult = SiteSearchResult & {
  haystack: string;
};

const staticRoutes = [
  { id: 'route-news', href: '/news', section: 'news' as const, icon: 'ri-newspaper-line', titles: ['News', '资讯', 'ニュース', '資訊'] },
  { id: 'route-guides', href: '/guides', section: 'guides' as const, icon: 'ri-book-open-line', titles: ['Guides', '攻略', 'ガイド', '攻略'] },
  { id: 'route-events', href: '/events', section: 'events' as const, icon: 'ri-calendar-event-line', titles: ['Events', '活动', 'イベント', '活動'] },
  { id: 'route-checklist', href: '/checklist', section: 'tools' as const, icon: 'ri-checkbox-circle-line', titles: ['Daily Boss Checklist', '每日 Boss 清单', 'デイリーボスチェックリスト', '每日 Boss 清單'] },
  { id: 'route-tools', href: '/mapler-house', section: 'tools' as const, icon: 'ri-tools-line', titles: ['Mapler House Tools', 'Mapler House 工具', 'Mapler House ツール', 'Mapler House 工具'] },
  { id: 'route-wiki', href: '/wiki', section: 'wiki' as const, icon: 'ri-book-2-line', titles: ['MapleStory Wiki', '冒险岛百科', 'メイプルストーリーWiki', '楓之谷百科'] },
  { id: 'route-maps', href: '/maps', section: 'maps' as const, icon: 'ri-map-2-line', titles: ['World Maps', '世界地图', 'ワールドマップ', '世界地圖'] },
  { id: 'route-rankings', href: '/rankings', section: 'tools' as const, icon: 'ri-bar-chart-grouped-line', titles: ['Rankings', '排行榜', 'ランキング', '排行榜'] },
] as const;

const languageIndex = (language: string) => {
  if (language === 'zh-Hant') return 3;
  if (language.startsWith('zh')) return 1;
  if (language.startsWith('ja')) return 2;
  return 0;
};

const normalize = (value: string) => value.toLowerCase().replace(/\s+/g, ' ').trim();

const readLiveItems = <T,>(key: string): T[] => {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
};

const localizedWikiTitle = (entry: WikiEntry, language: string) =>
  language.startsWith('zh') ? entry.titleZh || entry.title : entry.title;

const localizedWikiDescription = (entry: WikiEntry, language: string) =>
  language.startsWith('zh') ? entry.descriptionZh || entry.description : entry.description;

const scoreResult = (result: SearchableResult, query: string, tokens: string[]) => {
  const title = normalize(result.title);
  const haystack = normalize(result.haystack);
  let score = 0;

  if (title === query) score += 80;
  if (title.includes(query)) score += 45;
  if (haystack.includes(query)) score += 25;

  tokens.forEach((token) => {
    if (title.includes(token)) score += 12;
    if (haystack.includes(token)) score += 5;
  });

  return score;
};

export function getSiteSearchResults(query: string, language: string, version: string): SiteSearchResult[] {
  const normalizedQuery = normalize(query);
  const tokens = normalizedQuery.split(' ').filter((token) => token.length > 1);
  if (!normalizedQuery || tokens.length === 0) return [];

  const liveNews = readLiveItems<NewsItem>(liveStorageKeys.news);
  const liveGuides = readLiveItems<GuideItem>(liveStorageKeys.guides);
  const liveEvents = readLiveItems<EventItem>(liveStorageKeys.events);
  const liveTools = readLiveItems<ToolResourceItem>(liveStorageKeys.tools);
  const liveWiki = readLiveItems<WikiEntry>(liveStorageKeys.wiki);

  const records: SearchableResult[] = [
    ...staticRoutes.map((route) => ({
      id: route.id,
      title: route.titles[languageIndex(language)],
      excerpt: route.href,
      href: route.href,
      section: route.section,
      icon: route.icon,
      score: 0,
      haystack: [...route.titles, route.href, route.section].join(' '),
    })),
    ...liveNews
      .filter((item) => isAvailableInVersion(item.versions, version))
      .map((item) => {
        const copy = getNewsCopy(item, language);
        const category = getNewsCategoryLabel(item.category, language);
        return {
          id: item.id,
          title: copy.title,
          excerpt: copy.excerpt,
          href: '/news',
          section: 'news' as const,
          icon: 'ri-newspaper-line',
          score: 0,
          haystack: [copy.title, copy.excerpt, category, item.author, item.sourceUrl].join(' '),
        };
      }),
    ...liveGuides
      .filter((item) => isAvailableInVersion(item.versions, version))
      .map((item) => {
        const copy = getGuideCardCopy(item, language);
        return {
          id: item.id,
          title: copy.title,
          excerpt: `${copy.classLabel} · ${copy.difficulty} · ${copy.length}`,
          href: `/guides/${encodeURIComponent(item.id)}`,
          section: 'guides' as const,
          icon: 'ri-book-open-line',
          score: 0,
          haystack: [copy.title, copy.classLabel, copy.difficulty, item.author, item.sourceUrl || ''].join(' '),
        };
      }),
    ...liveEvents
      .filter((item) => isAvailableInVersion(item.regions, version))
      .map((item) => ({
        id: item.id,
        title: item.name,
        excerpt: `${item.windowStart} – ${item.windowEnd} · ${item.rewards.join(' · ')}`,
        href: '/events',
        section: 'events' as const,
        icon: item.icon,
        score: 0,
        haystack: [item.name, item.windowStart, item.windowEnd, ...item.rewards, item.rarity].join(' '),
      })),
    ...liveWiki
      .filter((item) => isAvailableInVersion(item.versions, version))
      .map((item) => {
        const title = localizedWikiTitle(item, language);
        const description = localizedWikiDescription(item, language);
        return {
          id: item.id,
          title,
          excerpt: description,
          href: `/wiki?q=${encodeURIComponent(title)}`,
          section: 'wiki' as const,
          icon: item.icon,
          score: 0,
          haystack: [title, description, item.category, ...item.tags, ...item.tagsZh].join(' '),
        };
      }),
    ...liveTools
      .map((item) => ({
        id: item.id,
        title: item.name,
        excerpt: `${item.category} · ${item.desc}`,
        href: item.href,
        section: 'tools' as const,
        icon: item.icon.startsWith('ri-') ? item.icon : 'ri-tools-line',
        score: 0,
        haystack: [item.name, item.desc, item.category, item.sourceLabel, item.href].join(' '),
      })),
    // Static boss data — always indexed regardless of localStorage state
    ...bosses.filter((boss) => isAvailableInVersion(boss.regions, version)).map((boss) => {
      const periods = [...new Set(getBossChecklistRules(boss, version as GameVersion).map((rule) => rule.period))];
      return {
        id: `boss-${boss.id}`,
        title: boss.name,
        excerpt: `Lv.${boss.level} · ${boss.difficulty.join(' / ')} · ${periods.join(' / ')}`,
        href: `/wiki/boss/${boss.id}`,
        section: 'bosses' as const,
        icon: 'ri-skull-2-line',
        score: 0,
        haystack: [boss.name, boss.nameZh, boss.difficulty.join(' '), periods.join(' '), `Lv${boss.level}`, `min${boss.minLevel}`].join(' '),
      };
    }),
  ];

  return records
    .map((result) => ({ ...result, score: scoreResult(result, normalizedQuery, tokens) }))
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
    .slice(0, 24)
    .map(({ haystack: _haystack, ...result }) => result);
}

/**
 * Generate popular search suggestions from actual indexed data.
 * Picks diverse terms across wiki, guides, and events so every suggestion
 * is guaranteed to produce results when searched.
 */
export function getPopularSearchTerms(
  language: string,
  version: string,
  count = 5,
): string[] {
  const liveGuides = readLiveItems<GuideItem>(liveStorageKeys.guides);
  const liveEvents = readLiveItems<EventItem>(liveStorageKeys.events);
  const liveWiki = readLiveItems<WikiEntry>(liveStorageKeys.wiki);

  const suggestions: string[] = [];

  // Wiki: pick popular entries from different categories
  const wikiEntries = liveWiki.filter((item) => isAvailableInVersion(item.versions, version));
  const seenCategories = new Set<string>();
  for (const entry of wikiEntries) {
    if (suggestions.length >= count) break;
    if (seenCategories.has(entry.category)) continue;
    seenCategories.add(entry.category);
    const title = localizedWikiTitle(entry, language);
    if (title && title.length <= 40) {
      suggestions.push(title);
    }
  }

  // Guides: add 1-2 class/strategy names
  const guides = liveGuides.filter((item) => isAvailableInVersion(item.versions, version));
  for (const guide of guides.slice(0, 2)) {
    if (suggestions.length >= count) break;
    const copy = getGuideCardCopy(guide, language);
    if (copy.classLabel && !suggestions.includes(copy.classLabel)) {
      suggestions.push(copy.classLabel);
    }
  }

  // Events: add 1 event name if available
  const events = liveEvents.filter((item) => isAvailableInVersion(item.regions, version));
  if (events.length > 0 && suggestions.length < count) {
    const eventName = events[0].name;
    if (eventName && !suggestions.includes(eventName)) {
      suggestions.push(eventName);
    }
  }

  return suggestions.slice(0, count);
}
