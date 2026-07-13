import { useEffect, useMemo, useState } from 'react';
import type { OfficialArticleDocument, NewsContentLanguage } from '@/services/liveContent';
import {
  BrowserTranslationError,
  prepareBrowserTranslation,
  translateHtml,
  translateText,
} from '@/services/browserTranslation';
import { normalizeNewsLanguage } from '@/pages/news/localizedNews';

type TranslationStatus = 'original' | 'translating' | 'translated' | 'needs-action' | 'unavailable';

export function useTranslatedOfficialDocument(
  article: OfficialArticleDocument | null,
  sourceLanguage: NewsContentLanguage,
  language: string,
) {
  const targetLanguage = normalizeNewsLanguage(language);
  const [translated, setTranslated] = useState<OfficialArticleDocument | null>(null);
  const [status, setStatus] = useState<TranslationStatus>('original');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setTranslated(null);
    if (!article || sourceLanguage === targetLanguage) {
      setStatus('original');
      return () => controller.abort();
    }

    setStatus('translating');
    void (async () => {
      try {
        const html = article.html
          ? await translateHtml(article.html, sourceLanguage, targetLanguage, controller.signal)
          : '';
        const text = html
          ? article.text
          : await translateText(article.text, sourceLanguage, targetLanguage, controller.signal);
        if (controller.signal.aborted) return;
        setTranslated({ ...article, html, text });
        setStatus('translated');
      } catch (error) {
        if (controller.signal.aborted) return;
        setStatus(error instanceof BrowserTranslationError && error.code === 'needs-user-activation'
          ? 'needs-action'
          : 'unavailable');
      }
    })();

    return () => controller.abort();
  }, [article, attempt, sourceLanguage, targetLanguage]);

  return useMemo(() => ({
    article: translated || article,
    status,
    retry: () => {
      void prepareBrowserTranslation(sourceLanguage, targetLanguage)
        .catch(() => undefined)
        .finally(() => setAttempt((value) => value + 1));
    },
  }), [article, sourceLanguage, status, targetLanguage, translated]);
}
