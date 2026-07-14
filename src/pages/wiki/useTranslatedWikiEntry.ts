import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import type { WikiEntry } from '@/services/liveContent';
import { normalizeNewsLanguage } from '@/pages/news/localizedNews';
import { translateStaticText } from '@/services/staticTranslation';

type TranslationStatus = 'original' | 'translated' | 'unavailable';

const distinct = (translated: string | undefined, original: string | undefined) =>
  Boolean(translated?.trim() && translated.trim() !== original?.trim());

export function useTranslatedWikiEntry(entry: WikiEntry | null, language: string, preferredTitle?: string) {
  const targetLanguage = normalizeNewsLanguage(useDeferredValue(language));
  const initial = useMemo(() => {
    if (!entry) {
      return { title: '', htmlContent: undefined, textContent: '', status: 'original' as TranslationStatus };
    }

    const providedChinese = targetLanguage === 'zh' || targetLanguage === 'zh-Hant';
    const providedTitle = providedChinese && distinct(entry.titleZh, entry.title) ? entry.titleZh : undefined;
    const providedHtml = providedChinese && distinct(entry.htmlContentZh, entry.htmlContent) ? entry.htmlContentZh : undefined;
    const providedText = providedChinese && distinct(entry.contentZh, entry.content) ? entry.contentZh : undefined;
    const hasStaticTranslation = Boolean(providedTitle && (providedHtml || providedText));
    const status: TranslationStatus = targetLanguage === 'en'
      ? 'original'
      : hasStaticTranslation ? 'translated' : 'unavailable';

    return {
      title: preferredTitle || providedTitle || entry.title,
      htmlContent: providedHtml || entry.htmlContent,
      textContent: providedText || entry.content,
      status,
    };
  }, [entry, preferredTitle, targetLanguage]);
  const [result, setResult] = useState(initial);

  useEffect(() => {
    let cancelled = false;
    if (!entry || initial.status !== 'unavailable') {
      setResult(initial);
      return () => { cancelled = true; };
    }

    const htmlSource = entry.htmlContent?.trim();
    void (async () => {
      const title = await translateStaticText(entry.title, targetLanguage, { sourceLanguage: 'en' })
        .catch(() => entry.title);
      const originalContent = htmlSource || entry.content;
      const content = await translateStaticText(originalContent, targetLanguage, {
        sourceLanguage: 'en',
        format: htmlSource ? 'html' : 'text',
      }).catch(() => originalContent);
      return { title, content };
    })().then(({ title, content }) => {
      if (cancelled) return;
      setResult({
        title: preferredTitle || title,
        htmlContent: htmlSource ? content : undefined,
        textContent: htmlSource ? entry.content : content,
        status: title !== entry.title || content !== (htmlSource || entry.content) ? 'translated' : 'unavailable',
      });
    }).catch(() => {
      if (!cancelled) setResult(initial);
    });
    return () => { cancelled = true; };
  }, [entry, initial, preferredTitle, targetLanguage]);

  return result;
}
