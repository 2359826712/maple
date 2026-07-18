import { useDeferredValue, useEffect, useState } from 'react';
import { useDeepStableValue } from '@/hooks/useDeepStableValue';
import type { ToolResourceItem } from '@/services/liveContent';
import { normalizeStaticContentLanguage, translateStaticTexts } from '@/services/staticTranslation';

export async function localizeToolResources(items: ToolResourceItem[], language: string) {
  const targetLanguage = normalizeStaticContentLanguage(language);
  if (targetLanguage === 'en' || items.length === 0) return items;
  if (items.every((item) => item.localizedLanguage === targetLanguage)) return items;
  const texts = items.flatMap((item) => [item.name, item.desc, item.category]);
  const translations = await translateStaticTexts(texts, targetLanguage, { sourceLanguage: 'en' })
    .catch(() => texts);
  return items.map((item, index) => ({
    ...item,
    name: translations[index * 3] || item.name,
    desc: translations[index * 3 + 1] || item.desc,
    category: translations[index * 3 + 2] || item.category,
    localizedLanguage: targetLanguage,
  }));
}

export function useLocalizedToolResources(items: ToolResourceItem[], language: string) {
  const stableItems = useDeepStableValue(items);
  const targetLanguage = normalizeStaticContentLanguage(useDeferredValue(language));
  const [localizedItems, setLocalizedItems] = useState(stableItems);

  useEffect(() => {
    let cancelled = false;
    setLocalizedItems((current) => current.length === stableItems.length
      && current.every((item, index) => item.id === stableItems[index]?.id)
      ? current
      : stableItems);
    if (targetLanguage === 'en' || stableItems.length === 0) return () => { cancelled = true; };

    void localizeToolResources(stableItems, targetLanguage)
      .then((items) => {
        if (!cancelled) setLocalizedItems(items);
      })
      .catch(() => {
        if (!cancelled) setLocalizedItems(stableItems);
      });
    return () => { cancelled = true; };
  }, [stableItems, targetLanguage]);

  return targetLanguage === 'en' ? stableItems : localizedItems;
}
