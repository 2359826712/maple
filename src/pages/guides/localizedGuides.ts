import { useDeferredValue, useEffect, useState } from 'react';
import type { GuideItem } from '@/services/liveContent';
import { normalizeStaticContentLanguage, translateStaticText, translateStaticTexts } from '@/services/staticTranslation';
import { useDeepStableValue } from '@/hooks/useDeepStableValue';

type GuideCardCopy = {
  title: string;
  classLabel: string;
  difficulty: string;
  length: string;
};

type GuideDetailCopy = {
  title: string;
  classLabel: string;
  difficulty: string;
  readTime: string;
  summary: string;
  toc: Array<{ id: string; title: string }>;
  sections: Array<{
    id: string;
    title: string;
    content: Array<{
      type: string;
      text?: string;
      variant?: string;
      items?: string[];
      style?: string;
      headers?: string[];
      rows?: string[][];
    }>;
  }>;
};

export const guideLocale = (language: string) => {
  if (language.startsWith('zh-Hant')) return 'zh-Hant';
  if (language.startsWith('zh')) return 'zh';
  if (language.startsWith('ja')) return 'ja';
  if (language.startsWith('ko')) return 'ko';
  return 'en';
};

export const getGuideCardCopy = <T extends { title: string; class: string; difficulty: string; length: string }>(
  guide: T,
  _language: string,
): GuideCardCopy => {
  const localized = (guide as T & { localizedCopy?: GuideCardCopy }).localizedCopy;
  return localized || {
    title: guide.title,
    classLabel: guide.class,
    difficulty: guide.difficulty,
    length: guide.length,
  };
};

export const getGuideDetailCopy = <T extends GuideDetailCopy>(guide: T, _language: string): T => guide;

export async function localizeGuideItem(guide: GuideItem, language: string, includeContent = true): Promise<GuideItem> {
  const targetLanguage = normalizeStaticContentLanguage(language);
  if (targetLanguage === 'en') return { ...guide, localizedLanguage: 'en', localizedCopy: undefined };
  const cardTexts = [guide.title, guide.class, guide.difficulty, guide.length, guide.excerpt || ''];
  const translatedCard = await translateStaticTexts(cardTexts, targetLanguage, { sourceLanguage: 'en' })
    .catch(() => cardTexts);
  const originalContent = guide.contentHtml || guide.contentText || '';
  const translatedContent = includeContent && originalContent
    ? await translateStaticText(originalContent, targetLanguage, {
        sourceLanguage: 'en',
        format: guide.contentHtml ? 'html' : 'text',
      }).catch(() => originalContent)
    : '';
  return {
    ...guide,
    localizedLanguage: targetLanguage,
    localizedCopy: {
      title: translatedCard[0] || guide.title,
      classLabel: translatedCard[1] || guide.class,
      difficulty: translatedCard[2] || guide.difficulty,
      length: translatedCard[3] || guide.length,
      excerpt: translatedCard[4] || guide.excerpt,
    },
    excerpt: translatedCard[4] || guide.excerpt,
    contentHtml: guide.contentHtml ? translatedContent || guide.contentHtml : guide.contentHtml,
    contentText: !guide.contentHtml && guide.contentText ? translatedContent || guide.contentText : guide.contentText,
  };
}

export async function localizeGuideItems(items: GuideItem[], language: string) {
  const targetLanguage = normalizeStaticContentLanguage(language);
  if (targetLanguage === 'en' || items.length === 0) return items;
  if (items.every((item) => item.localizedLanguage === targetLanguage)) return items;
  const texts = items.flatMap((guide) => [guide.title, guide.class, guide.difficulty, guide.length, guide.excerpt || '']);
  const translations = await translateStaticTexts(texts, targetLanguage, { sourceLanguage: 'en' })
    .catch(() => texts);
  return items.map((guide, index) => ({
    ...guide,
    localizedLanguage: targetLanguage,
    localizedCopy: {
      title: translations[index * 5] || guide.title,
      classLabel: translations[index * 5 + 1] || guide.class,
      difficulty: translations[index * 5 + 2] || guide.difficulty,
      length: translations[index * 5 + 3] || guide.length,
      excerpt: translations[index * 5 + 4] || guide.excerpt,
    },
    excerpt: translations[index * 5 + 4] || guide.excerpt,
  }));
}

export function useLocalizedGuideItems(items: GuideItem[], language: string) {
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
    void localizeGuideItems(stableItems, targetLanguage).then((items) => {
      if (!cancelled) setLocalizedItems(items);
    }).catch(() => {
      if (!cancelled) setLocalizedItems(stableItems);
    });
    return () => { cancelled = true; };
  }, [stableItems, targetLanguage]);

  return targetLanguage === 'en' ? items : localizedItems;
}
