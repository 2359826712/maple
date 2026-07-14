import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import type { NewsItem } from '@/services/liveContent';
import { getNewsCopy, normalizeNewsLanguage } from './localizedNews';
import { translateStaticTexts } from '@/services/staticTranslation';
import { useDeepStableValue } from '@/hooks/useDeepStableValue';

type TranslationStatus = 'translated' | 'translating' | 'unavailable';

export function useLocalizedNewsItems(items: NewsItem[], language: string) {
  const stableItems = useDeepStableValue(items);
  const targetLanguage = normalizeNewsLanguage(useDeferredValue(language));
  const localizedItems = useMemo(
    () => stableItems.map((item) => ({ ...item, ...getNewsCopy(item, targetLanguage) })),
    [stableItems, targetLanguage],
  );
  const [translatedItems, setTranslatedItems] = useState(localizedItems);
  const [retryKey, setRetryKey] = useState(0);
  const [status, setStatus] = useState<TranslationStatus>(() => localizedItems.some((item) => item.usesOriginalCopy)
    ? 'unavailable'
    : 'translated');

  useEffect(() => {
    let cancelled = false;
    let retryTimer: number | undefined;
    const missingIndexes = localizedItems.flatMap((item, index) => item.usesOriginalCopy ? [index] : []);
    if (missingIndexes.length === 0) {
      setStatus('translated');
      return () => { cancelled = true; };
    }

    setTranslatedItems((current) => current.length === localizedItems.length
      && current.every((item, index) => item.id === localizedItems[index]?.id)
      ? current
      : localizedItems);
    setStatus('translating');
    const texts = missingIndexes.flatMap((index) => [stableItems[index].title, stableItems[index].excerpt]);
    void translateStaticTexts(texts, targetLanguage)
      .then((translations) => {
        if (cancelled) return;
        const next = [...localizedItems];
        missingIndexes.forEach((itemIndex, translationIndex) => {
          next[itemIndex] = {
            ...next[itemIndex],
            title: translations[translationIndex * 2] || next[itemIndex].title,
            excerpt: translations[translationIndex * 2 + 1] || next[itemIndex].excerpt,
            usesOriginalCopy: false,
          };
        });
        setTranslatedItems(next);
        setStatus('translated');
      })
      .catch(() => {
        if (!cancelled) {
          setStatus('unavailable');
          retryTimer = window.setTimeout(() => setRetryKey((value) => value + 1), 12_000);
        }
      });
    return () => {
      cancelled = true;
      if (retryTimer !== undefined) window.clearTimeout(retryTimer);
    };
  }, [localizedItems, retryKey, stableItems, targetLanguage]);

  return {
    items: localizedItems.some((item) => item.usesOriginalCopy) ? translatedItems : localizedItems,
    status,
  };
}
