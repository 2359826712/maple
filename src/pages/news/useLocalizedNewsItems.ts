import { useDeferredValue, useMemo } from 'react';
import type { NewsItem } from '@/services/liveContent';
import { getNewsCopy, normalizeNewsLanguage } from './localizedNews';
import { useDeepStableValue } from '@/hooks/useDeepStableValue';

export function useLocalizedNewsItems(items: NewsItem[], language: string) {
  const stableItems = useDeepStableValue(items);
  const targetLanguage = normalizeNewsLanguage(useDeferredValue(language));
  const itemsWithEditions = useMemo(
    () => stableItems.map((item) => ({ ...item, ...getNewsCopy(item, targetLanguage) })),
    [stableItems, targetLanguage],
  );

  return {
    items: itemsWithEditions,
    status: itemsWithEditions.some((item) => item.usesOriginalCopy) ? 'incomplete' as const : 'localized' as const,
  };
}
