import { useEffect, useMemo, useState } from 'react';
import type { WikiEntry } from '@/services/liveContent';
import {
  BrowserTranslationError,
  prepareBrowserTranslation,
  translateHtml,
  translateText,
  type TranslationLanguage,
} from '@/services/browserTranslation';
import { normalizeNewsLanguage } from '@/pages/news/localizedNews';

type TranslationStatus = 'original' | 'translating' | 'translated' | 'needs-action' | 'unavailable';

type TranslatedEntry = {
  title: string;
  htmlContent?: string;
  textContent: string;
};

const distinct = (translated: string | undefined, original: string | undefined) =>
  Boolean(translated?.trim() && translated.trim() !== original?.trim());

export function useTranslatedWikiEntry(entry: WikiEntry | null, language: string, preferredTitle?: string) {
  const targetLanguage = normalizeNewsLanguage(language) as TranslationLanguage;
  const [translated, setTranslated] = useState<TranslatedEntry | null>(null);
  const [status, setStatus] = useState<TranslationStatus>('original');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setTranslated(null);

    if (!entry || targetLanguage === 'en') {
      setStatus('original');
      return () => controller.abort();
    }

    const providedChinese = targetLanguage === 'zh' || targetLanguage === 'zh-Hant';
    const providedTitle = providedChinese && distinct(entry.titleZh, entry.title) ? entry.titleZh : undefined;
    const providedHtml = providedChinese && distinct(entry.htmlContentZh, entry.htmlContent) ? entry.htmlContentZh : undefined;
    const providedText = providedChinese && distinct(entry.contentZh, entry.content) ? entry.contentZh : undefined;

    if (providedTitle && (providedHtml || providedText)) {
      setTranslated({
        title: preferredTitle || providedTitle,
        htmlContent: providedHtml,
        textContent: providedText || entry.content,
      });
      setStatus('translated');
      return () => controller.abort();
    }

    setStatus('translating');
    void (async () => {
      try {
        const translatedTitle = preferredTitle || await translateText(entry.title, 'en', targetLanguage, controller.signal);
        const translatedHtml = entry.htmlContent
          ? await translateHtml(entry.htmlContent, 'en', targetLanguage, controller.signal)
          : undefined;
        const translatedContent = translatedHtml
          ? entry.content
          : await translateText(entry.content, 'en', targetLanguage, controller.signal);
        if (controller.signal.aborted) return;
        setTranslated({ title: translatedTitle, htmlContent: translatedHtml, textContent: translatedContent });
        setStatus('translated');
      } catch (error) {
        if (controller.signal.aborted) return;
        setStatus(error instanceof BrowserTranslationError && error.code === 'needs-user-activation'
          ? 'needs-action'
          : 'unavailable');
      }
    })();

    return () => controller.abort();
  }, [attempt, entry, preferredTitle, targetLanguage]);

  return useMemo(() => ({
    title: translated?.title || preferredTitle || entry?.title || '',
    htmlContent: translated?.htmlContent || entry?.htmlContent,
    textContent: translated?.textContent || entry?.content || '',
    status,
    retry: () => {
      void prepareBrowserTranslation('en', targetLanguage)
        .catch(() => undefined)
        .finally(() => setAttempt((value) => value + 1));
    },
  }), [entry, preferredTitle, status, targetLanguage, translated]);
}
