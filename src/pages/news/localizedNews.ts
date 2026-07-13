import type { NewsContentLanguage, NewsItem, NewsTranslation } from '@/services/liveContent';

type NewsCopy = {
  title: string;
  excerpt: string;
  date: string;
  sourceLanguage: NewsContentLanguage;
  usesOriginalCopy: boolean;
};

type ArticleCopy = {
  lead: string;
  sections: string[];
  takeaway: string;
};

const categoryLabels: Record<string, Record<string, string>> = {
  'Patch Notes': {
    zh: '更新公告',
    'zh-Hant': '更新公告',
    ja: 'アップデート情報',
    ko: '업데이트 공지',
  },
  Event: {
    zh: '活动',
    'zh-Hant': '活動',
    ja: 'イベント',
    ko: '이벤트',
  },
  General: {
    zh: '综合公告',
    'zh-Hant': '綜合公告',
    ja: '一般告知',
    ko: '일반 공지',
  },
  'Cash Shop': {
    zh: '商城',
    'zh-Hant': '商城',
    ja: '課金',
    ko: '캐시샵',
  },
};

export const normalizeNewsLanguage = (language: string): NewsContentLanguage => {
  const normalized = language.toLowerCase();
  if (normalized.startsWith('zh-hant') || normalized.startsWith('zh-tw') || normalized.startsWith('zh-hk')) return 'zh-Hant';
  if (normalized.startsWith('zh')) return 'zh';
  if (normalized.startsWith('ja')) return 'ja';
  if (normalized.startsWith('ko')) return 'ko';
  return 'en';
};

const validTranslation = (value: NewsTranslation | undefined): value is NewsTranslation =>
  Boolean(value?.title?.trim() && value?.excerpt?.trim());

const sourceLanguagesByVersion: Record<string, NewsContentLanguage> = {
  gms: 'en',
  kms: 'ko',
  msea: 'en',
  jms: 'ja',
  tms: 'zh-Hant',
};

export const getNewsSourceLanguageForVersion = (version: string): NewsContentLanguage =>
  sourceLanguagesByVersion[version] || 'en';

export const getNewsSourceLanguage = (news: NewsItem): NewsContentLanguage =>
  news.sourceLanguage || getNewsSourceLanguageForVersion(news.versions[0] || 'gms');

export const newsSourceLanguageTranslationKey: Record<NewsContentLanguage, string> = {
  en: 'news_source_language_en',
  zh: 'news_source_language_zh',
  'zh-Hant': 'news_source_language_zh_hant',
  ja: 'news_source_language_ja',
  ko: 'news_source_language_ko',
};

export const formatNewsDate = (publishedAt: string, language: string, fallback = '') => {
  const date = new Date(publishedAt);
  if (Number.isNaN(date.getTime())) return fallback;

  return new Intl.DateTimeFormat(normalizeNewsLanguage(language), {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(date);
};

export function getNewsCopy(news: NewsItem, language: string): NewsCopy {
  const requestedLanguage = normalizeNewsLanguage(language);
  const sourceLanguage = getNewsSourceLanguage(news);
  const translation = news.translations?.[requestedLanguage];
  const localized = requestedLanguage !== sourceLanguage && validTranslation(translation);

  return {
    title: localized ? translation.title.trim() : news.title,
    excerpt: localized ? translation.excerpt.trim() : news.excerpt,
    date: formatNewsDate(news.publishedAt, requestedLanguage, news.date),
    sourceLanguage,
    usesOriginalCopy: requestedLanguage !== sourceLanguage && !localized,
  };
}

export function getNewsArticleCopy(_id: string, _language: string, fallback: ArticleCopy): ArticleCopy {
  return fallback;
}

export function getNewsCategoryLabel(category: string, language: string): string {
  return categoryLabels[category]?.[normalizeNewsLanguage(language)] ?? category;
}
