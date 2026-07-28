import { getGuideCardCopy } from '@/pages/guides/localizedGuides';
import {
  liveStorageKeys,
  type EventItem,
  type GuideItem,
} from '@/services/liveContent';
import type { WikiEntry } from '@/mocks/wiki';
import { isAvailableInVersion } from '@/domain/regionModel';

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

/**
 * Generate useful search suggestions without importing the complete resource
 * index. The full index remains reserved for the search route/dialog.
 */
export function getPopularSearchTerms(language: string, version: string, count = 5): string[] {
  const liveGuides = readLiveItems<GuideItem>(liveStorageKeys.guides);
  const liveEvents = readLiveItems<EventItem>(liveStorageKeys.events);
  const liveWiki = readLiveItems<WikiEntry>(liveStorageKeys.wiki);

  const suggestions: string[] = [];
  const wikiEntries = liveWiki.filter((item) => isAvailableInVersion(item.versions, version));
  const seenCategories = new Set<string>();

  for (const entry of wikiEntries) {
    if (suggestions.length >= count) break;
    if (seenCategories.has(entry.category)) continue;
    seenCategories.add(entry.category);
    const title = localizedWikiTitle(entry, language);
    if (title && title.length <= 40) suggestions.push(title);
  }

  for (const guide of liveGuides.slice(0, 2)) {
    if (suggestions.length >= count) break;
    const classLabel = getGuideCardCopy(guide, language).classLabel;
    if (classLabel && !suggestions.includes(classLabel)) suggestions.push(classLabel);
  }

  const events = liveEvents.filter((item) => isAvailableInVersion(item.regions, version));
  if (events.length > 0 && suggestions.length < count) {
    const eventName = events[0].name;
    if (eventName && !suggestions.includes(eventName)) suggestions.push(eventName);
  }

  return suggestions.slice(0, count);
}
