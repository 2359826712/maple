import { useEffect, useMemo, useState } from 'react';
import type { NewsItem } from '@/services/liveContent';
import { BrowserTranslationError, prepareBrowserTranslation, translateText } from '@/services/browserTranslation';
import { getNewsCopy, normalizeNewsLanguage } from './localizedNews';

type TranslationStatus = 'idle' | 'translating' | 'translated' | 'needs-action' | 'unavailable';

type BrowserCopy = {
  title: string;
  excerpt: string;
};

export function useLocalizedNewsItems(items: NewsItem[], language: string) {
  const targetLanguage = normalizeNewsLanguage(language);
  const [browserCopies, setBrowserCopies] = useState<Record<string, BrowserCopy>>({});
  const [status, setStatus] = useState<TranslationStatus>('idle');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const pending = items
      .map((item) => ({ item, copy: getNewsCopy(item, targetLanguage) }))
      .filter(({ copy }) => copy.usesOriginalCopy);

    if (pending.length === 0) {
      setStatus('translated');
      return () => controller.abort();
    }

    setBrowserCopies({});
    setStatus('translating');
    void (async () => {
      try {
        for (const { item, copy } of pending) {
          const [title, excerpt] = await Promise.all([
            translateText(item.title, copy.sourceLanguage, targetLanguage, controller.signal),
            translateText(item.excerpt, copy.sourceLanguage, targetLanguage, controller.signal),
          ]);
          if (controller.signal.aborted) return;
          setBrowserCopies((current) => ({ ...current, [item.id]: { title, excerpt } }));
        }
        setStatus('translated');
      } catch (error) {
        if (controller.signal.aborted) return;
        setStatus(error instanceof BrowserTranslationError && error.code === 'needs-user-activation'
          ? 'needs-action'
          : 'unavailable');
      }
    })();

    return () => controller.abort();
  }, [attempt, items, targetLanguage]);

  const localizedItems = useMemo(() => items.map((item) => {
    const copy = getNewsCopy(item, targetLanguage);
    const browserCopy = browserCopies[item.id];
    return {
      ...item,
      ...copy,
      ...(browserCopy || {}),
      usesOriginalCopy: browserCopy ? false : copy.usesOriginalCopy,
    };
  }), [browserCopies, items, targetLanguage]);

  const retry = () => {
    const sourceLanguage = items
      .map((item) => getNewsCopy(item, targetLanguage))
      .find((copy) => copy.usesOriginalCopy)?.sourceLanguage;
    if (!sourceLanguage) return;
    void prepareBrowserTranslation(sourceLanguage, targetLanguage)
      .catch(() => undefined)
      .finally(() => setAttempt((value) => value + 1));
  };

  return {
    items: localizedItems,
    status,
    retry,
  };
}
