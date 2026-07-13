import type { NewsItem } from '@/services/liveContent';

type NewsCopy = {
  title: string;
  excerpt: string;
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

const normalizeLanguage = (language: string) => {
  if (language.startsWith('zh-Hant')) return 'zh-Hant';
  if (language.startsWith('zh')) return 'zh';
  if (language.startsWith('ja')) return 'ja';
  if (language.startsWith('ko')) return 'ko';
  return 'en';
};

export function getNewsCopy(news: NewsItem, _language: string): NewsCopy {
  return {
    title: news.title,
    excerpt: news.excerpt,
  };
}

export function getNewsArticleCopy(_id: string, _language: string, fallback: ArticleCopy): ArticleCopy {
  return fallback;
}

export function getNewsCategoryLabel(category: string, language: string): string {
  return categoryLabels[category]?.[normalizeLanguage(language)] ?? category;
}
