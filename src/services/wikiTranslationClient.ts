import type { SupportedLanguage } from '@/i18n/languageRouting';
import type { PublishedWikiTranslation } from './wikiTranslation';

export const fetchPublishedWikiTranslationFromApi = async (
  title: string,
  locale: SupportedLanguage,
) => {
  if (locale === 'en' || typeof window === 'undefined') return null;
  try {
    const response = await fetch(
      `/api/wiki-translations?title=${encodeURIComponent(title)}&locale=${encodeURIComponent(locale)}`,
      { headers: { accept: 'application/json' } },
    );
    if (!response.ok) return null;
    return (await response.json()) as PublishedWikiTranslation;
  } catch {
    return null;
  }
};
