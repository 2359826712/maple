import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import type { OfficialArticleDocument, NewsContentLanguage } from '@/services/liveContent';
import { normalizeNewsLanguage } from '@/pages/news/localizedNews';
import { translateStaticText } from '@/services/staticTranslation';

type TranslationStatus = 'original' | 'translated' | 'translating' | 'unavailable';

export function useTranslatedOfficialDocument(
  article: OfficialArticleDocument | null,
  sourceLanguage: NewsContentLanguage,
  language: string,
) {
  const targetLanguage = normalizeNewsLanguage(useDeferredValue(language));

  const initial = useMemo(() => ({
    article,
    status: (article?.contentLanguage === targetLanguage
      ? 'translated'
      : article && sourceLanguage !== targetLanguage ? 'unavailable' : 'original') as TranslationStatus,
  }), [article, sourceLanguage, targetLanguage]);
  const [result, setResult] = useState(initial);

  useEffect(() => {
    let cancelled = false;
    if (!article || sourceLanguage === targetLanguage || article.contentLanguage === targetLanguage) {
      setResult(initial);
      return () => { cancelled = true; };
    }

    setResult((current) => ({
      article: current.article?.sourceUrl === article.sourceUrl ? current.article : article,
      status: 'translating',
    }));
    const usesHtml = Boolean(article.html.trim());
    const source = usesHtml ? article.html : article.text;
    void translateStaticText(source, targetLanguage, {
      sourceLanguage,
      format: usesHtml ? 'html' : 'text',
    }).then((translated) => {
      if (cancelled) return;
      setResult({
        article: {
          ...article,
          html: usesHtml ? translated : '',
          text: usesHtml ? article.text : translated,
        },
        status: 'translated',
      });
    }).catch(() => {
      if (!cancelled) setResult({ article, status: 'unavailable' });
    });
    return () => { cancelled = true; };
  }, [article, initial, sourceLanguage, targetLanguage]);

  return result;
}
