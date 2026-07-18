import { useDeferredValue, useEffect, useState } from 'react';
import type {
  UpcomingUpdateArticle,
  UpcomingUpdateFeed,
  UpcomingUpdatePost,
} from '@/services/upcomingUpdates';
import {
  normalizeStaticContentLanguage,
  translateStaticText,
  translateStaticTexts,
} from '@/services/staticTranslation';

const localizePostCopies = (
  posts: UpcomingUpdatePost[],
  translations: string[],
) => {
  let offset = 0;
  return posts.map((post) => {
    const title = translations[offset++] || post.title;
    const excerpt = translations[offset++] || post.excerpt;
    const tags = post.tags.map((tag) => translations[offset++] || tag);
    return { ...post, title, excerpt, tags };
  });
};

export async function localizeUpcomingFeed(
  feed: UpcomingUpdateFeed,
  language: string,
): Promise<UpcomingUpdateFeed> {
  const targetLanguage = normalizeStaticContentLanguage(language);
  if (targetLanguage === 'en' || feed.items.length === 0) return feed;
  if (feed.localizedLanguage === targetLanguage) return feed;

  const texts = feed.items.flatMap((post) => [post.title, post.excerpt, ...post.tags]);
  const translations = await translateStaticTexts(texts, targetLanguage, { sourceLanguage: 'en' })
    .catch(() => texts);
  const localizedItems = localizePostCopies(feed.items, translations);
  const translated = translations.some((value, index) => value !== texts[index]);
  return {
    ...feed,
    ...(translated ? { localizedLanguage: targetLanguage } : {}),
    items: localizedItems.map((item) => ({
      ...item,
      ...(translated ? { localizedLanguage: targetLanguage } : {}),
    })),
  };
}

export async function localizeUpcomingArticle(
  article: UpcomingUpdateArticle,
  language: string,
): Promise<UpcomingUpdateArticle> {
  const targetLanguage = normalizeStaticContentLanguage(language);
  if (targetLanguage === 'en') return article;
  if (article.localizedLanguage === targetLanguage) return article;

  const headerTexts = [article.title, article.excerpt, ...article.tags];
  const translatedHeader = await translateStaticTexts(headerTexts, targetLanguage, { sourceLanguage: 'en' })
    .catch(() => headerTexts);
  const [localizedPost] = localizePostCopies([article], translatedHeader);
  const contentHtml = await translateStaticText(article.contentHtml, targetLanguage, {
    sourceLanguage: 'en',
    format: 'html',
  }).catch(() => article.contentHtml);

  const translated = translatedHeader.some((value, index) => value !== headerTexts[index])
    || contentHtml !== article.contentHtml;
  return {
    ...article,
    ...localizedPost,
    contentHtml,
    ...(translated ? { localizedLanguage: targetLanguage } : {}),
  };
}

export function useLocalizedUpcomingFeed(feed: UpcomingUpdateFeed | null, language: string) {
  const [localizedFeed, setLocalizedFeed] = useState(feed);
  const deferredLanguage = useDeferredValue(language);

  useEffect(() => {
    let cancelled = false;
    setLocalizedFeed((current) => {
      const sameFeed = current && feed && current.items.length === feed.items.length
        && current.items.every((item, index) => item.id === feed.items[index]?.id);
      return sameFeed ? current : feed;
    });
    if (!feed) return () => { cancelled = true; };

    void localizeUpcomingFeed(feed, deferredLanguage).then((nextFeed) => {
      if (!cancelled) setLocalizedFeed(nextFeed);
    });
    return () => { cancelled = true; };
  }, [deferredLanguage, feed]);

  return localizedFeed;
}

export function useLocalizedUpcomingArticle(article: UpcomingUpdateArticle | null, language: string) {
  const [localizedArticle, setLocalizedArticle] = useState(article);
  const deferredLanguage = useDeferredValue(language);

  useEffect(() => {
    let cancelled = false;
    setLocalizedArticle((current) => current?.id === article?.id ? current : article);
    if (!article) return () => { cancelled = true; };

    void localizeUpcomingArticle(article, deferredLanguage).then((nextArticle) => {
      if (!cancelled) setLocalizedArticle(nextArticle);
    });
    return () => { cancelled = true; };
  }, [article, deferredLanguage]);

  return localizedArticle;
}
