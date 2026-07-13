import { describe, expect, it } from 'vitest';
import type { NewsItem } from '@/services/liveContent';
import { getNewsCopy } from './localizedNews';

const koreanNews: NewsItem = {
  id: 'kms-1',
  category: 'General',
  title: '닉네임 옥션',
  excerpt: '닉네임 옥션 안내',
  author: '메이플스토리',
  date: 'Jul 13, 2026',
  publishedAt: '2026-07-13T00:00:00.000Z',
  reads: 'Official',
  sourceUrl: 'https://maplestory.nexon.com/News/Notice/1',
  tag: 'primary',
  versions: ['kms'],
  image: '/news-fallback-kms.svg',
  sourceLanguage: 'ko',
};

describe('localized live news', () => {
  it('uses a backend-provided translation for the selected locale', () => {
    const copy = getNewsCopy({
      ...koreanNews,
      translations: {
        zh: { title: '角色名拍卖', excerpt: '角色名拍卖活动公告' },
      },
    }, 'zh-CN');

    expect(copy).toMatchObject({
      title: '角色名拍卖',
      excerpt: '角色名拍卖活动公告',
      sourceLanguage: 'ko',
      usesOriginalCopy: false,
    });
    expect(copy.date).toContain('2026');
  });

  it('keeps the official copy and exposes its language when a translation is unavailable', () => {
    expect(getNewsCopy(koreanNews, 'zh')).toMatchObject({
      title: '닉네임 옥션',
      excerpt: '닉네임 옥션 안내',
      sourceLanguage: 'ko',
      usesOriginalCopy: true,
    });
  });

  it('does not label source copy as a fallback when it matches the interface language', () => {
    expect(getNewsCopy(koreanNews, 'ko')).toMatchObject({
      title: '닉네임 옥션',
      usesOriginalCopy: false,
    });
  });
});
