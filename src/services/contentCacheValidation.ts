import type { EventItem, NewsItem } from './liveContent';

const isContentRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isContentString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

export const isRenderableNewsItem = (value: unknown): value is NewsItem => {
  if (!isContentRecord(value)) return false;
  return ['id', 'title', 'excerpt', 'author', 'date', 'publishedAt', 'reads', 'sourceUrl', 'tag', 'image']
    .every((key) => isContentString(value[key]))
    && ['Patch Notes', 'Event', 'General', 'Cash Shop'].includes(String(value.category))
    && Array.isArray(value.versions)
    && value.versions.length > 0
    && value.versions.every(isContentString);
};

export const isRenderableEventItem = (value: unknown): value is EventItem => {
  if (!isContentRecord(value)) return false;
  return ['id', 'name', 'windowStart', 'windowEnd', 'rarity', 'icon', 'image', 'sourceUrl', 'sourceLabel', 'lastVerified']
    .every((key) => isContentString(value[key]))
    && Array.isArray(value.rewards)
    && value.rewards.every(isContentString)
    && Array.isArray(value.regions)
    && value.regions.length > 0
    && value.regions.every(isContentString);
};
