import type { WikiEntry } from '@/services/liveContent';
import type { SupportedLanguage } from '@/i18n/languageRouting';

export type PublishedWikiTranslation = {
  title: string;
  summary: string;
  body_html: string;
  source_revision: string | null;
};

export const applyPublishedWikiTranslation = (
  entry: WikiEntry,
  language: SupportedLanguage,
  translation: PublishedWikiTranslation,
): WikiEntry => {
  const bodyHtml = translation.body_html.trim();
  const bodyText = bodyHtml
    ? bodyHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    : entry.content;
  const chinese = language === 'zh' || language === 'zh-Hant';

  return {
    ...entry,
    title: translation.title,
    description: translation.summary || entry.description,
    content: bodyText,
    htmlContent: bodyHtml || entry.htmlContent,
    contentLanguage: language,
    titleZh: chinese ? translation.title : entry.titleZh,
    descriptionZh: chinese ? translation.summary || entry.descriptionZh : entry.descriptionZh,
    contentZh: chinese ? bodyText : entry.contentZh,
    htmlContentZh: chinese && bodyHtml ? bodyHtml : entry.htmlContentZh,
  };
};
