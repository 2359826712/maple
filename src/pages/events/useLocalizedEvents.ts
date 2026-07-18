import { useDeferredValue, useEffect, useState } from 'react';
import type { EventItem } from '@/services/liveContent';
import { normalizeStaticContentLanguage, translateStaticTexts } from '@/services/staticTranslation';
import { useDeepStableValue } from '@/hooks/useDeepStableValue';

export async function localizeEvents(items: EventItem[], language: string, sourceLanguage?: string) {
  const targetLanguage = normalizeStaticContentLanguage(language);
  const source = sourceLanguage ? normalizeStaticContentLanguage(sourceLanguage) : undefined;
  if ((source && targetLanguage === source) || (!source && targetLanguage === 'en') || items.length === 0) return items;
  if (items.every((item) => item.localizedLanguage === targetLanguage)) return items;
  const texts = items.flatMap((item) => [item.name, ...item.rewards]);
  const translations = await translateStaticTexts(texts, targetLanguage, { sourceLanguage: source }).catch(() => texts);
  let offset = 0;
  return items.map((item) => {
    const name = translations[offset++] || item.name;
    const rewards = item.rewards.map((reward) => translations[offset++] || reward);
    return { ...item, name, rewards, localizedLanguage: targetLanguage };
  });
}

export function useLocalizedEvents(items: EventItem[], language: string, sourceLanguage?: string) {
  const stableItems = useDeepStableValue(items);
  const targetLanguage = normalizeStaticContentLanguage(useDeferredValue(language));
  const source = sourceLanguage ? normalizeStaticContentLanguage(sourceLanguage) : undefined;
  const [localizedItems, setLocalizedItems] = useState(stableItems);

  useEffect(() => {
    let cancelled = false;
    if ((source && targetLanguage === source) || (!source && targetLanguage === 'en') || stableItems.length === 0) {
      return () => { cancelled = true; };
    }
    setLocalizedItems((current) => current.length === stableItems.length
      && current.every((item, index) => item.id === stableItems[index]?.id)
      ? current
      : stableItems);

    void localizeEvents(stableItems, targetLanguage, source)
      .then((items) => {
        if (!cancelled) setLocalizedItems(items);
      })
      .catch(() => {
        if (!cancelled) setLocalizedItems(stableItems);
      });
    return () => { cancelled = true; };
  }, [source, stableItems, targetLanguage]);

  return (source && targetLanguage === source) || (!source && targetLanguage === 'en') ? items : localizedItems;
}
