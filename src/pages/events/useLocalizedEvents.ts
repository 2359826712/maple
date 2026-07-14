import { useDeferredValue, useEffect, useState } from 'react';
import type { EventItem } from '@/services/liveContent';
import { normalizeStaticContentLanguage, translateStaticTexts } from '@/services/staticTranslation';
import { useDeepStableValue } from '@/hooks/useDeepStableValue';

export function useLocalizedEvents(items: EventItem[], language: string) {
  const stableItems = useDeepStableValue(items);
  const targetLanguage = normalizeStaticContentLanguage(useDeferredValue(language));
  const [localizedItems, setLocalizedItems] = useState(stableItems);

  useEffect(() => {
    let cancelled = false;
    if (targetLanguage === 'en' || stableItems.length === 0) return () => { cancelled = true; };
    setLocalizedItems((current) => current.length === stableItems.length
      && current.every((item, index) => item.id === stableItems[index]?.id)
      ? current
      : stableItems);

    const texts = stableItems.flatMap((item) => [item.name, ...item.rewards]);
    void translateStaticTexts(texts, targetLanguage)
      .then((translations) => {
        if (cancelled) return;
        let offset = 0;
        setLocalizedItems(stableItems.map((item) => {
          const name = translations[offset] || item.name;
          offset += 1;
          const rewards = item.rewards.map((reward) => translations[offset++] || reward);
          return { ...item, name, rewards };
        }));
      })
      .catch(() => {
        if (!cancelled) setLocalizedItems(stableItems);
      });
    return () => { cancelled = true; };
  }, [stableItems, targetLanguage]);

  return targetLanguage === 'en' ? items : localizedItems;
}
