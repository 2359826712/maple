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
  it('builds a Chinese editorial edition for a known-issues notice instead of translating it literally', () => {
    const copy = getNewsCopy({
      ...koreanNews,
      id: 'gms-known-issues',
      title: 'v.269 Known Issues',
      excerpt: "Here you'll find a list of known and resolved issues from the v.269 - Ride the Lightning update.",
      sourceLanguage: 'en',
      versions: ['gms'],
    }, 'zh');

    expect(copy).toMatchObject({
      title: 'v269 已知问题汇总',
      localizedCategory: '问题追踪',
      actionLabel: '阅读中文整理',
      localizationKind: 'editorial',
      usesOriginalCopy: false,
    });
    expect(copy.excerpt).toContain('官方确认');
    expect(copy.excerpt).toContain('处理进度');
  });

  it('reframes completed maintenance around the player-visible result', () => {
    const copy = getNewsCopy({
      ...koreanNews,
      id: 'gms-maintenance',
      title: '[Completed]Scheduled Minor Patch Maintenance - July 9, 2026',
      excerpt: 'The maintenance has been completed and we have extended Cash Shop items in your inventory for 5 hours.',
      publishedAt: '2026-07-07T00:00:00.000Z',
      sourceLanguage: 'en',
      versions: ['gms'],
    }, 'zh');

    expect(copy).toMatchObject({
      title: '2026年7月9日小型维护已完成：商城道具期限补偿5小时',
      localizedCategory: '维护公告',
      actionLabel: '查看维护说明',
      localizationKind: 'editorial',
    });
    expect(copy.excerpt).toContain('正常登录游戏');
  });

  it('localizes recurring GMS cash shop updates without relying on the translation provider', () => {
    const copy = getNewsCopy({
      ...koreanNews,
      id: 'gms-cash-shop-july-15',
      title: 'Cash Shop Update for July 15',
      excerpt: 'Lightning Surprise Style Box and more!',
      category: 'Cash Shop',
      publishedAt: '2026-07-15T00:00:00.000Z',
      sourceLanguage: 'en',
      versions: ['gms'],
    }, 'zh');

    expect(copy).toMatchObject({
      title: '2026年7月15日现金商城更新',
      localizedCategory: '商城更新',
      localizationKind: 'editorial',
      usesOriginalCopy: false,
    });
    expect(copy.excerpt).toContain('风格箱');
  });

  it('provides a reviewed Chinese title for current GMS announcements', () => {
    const copy = getNewsCopy({
      ...koreanNews,
      id: 'gms-kinesis-demo',
      title: 'Try the Kinesis Demo!',
      excerpt: 'Play the new Kinesis demo.',
      sourceLanguage: 'en',
      versions: ['gms'],
    }, 'zh');

    expect(copy).toMatchObject({
      title: '体验Kinesis演示版！',
      localizationKind: 'editorial',
      usesOriginalCopy: false,
    });
  });

  it('prefers a reviewed backend edition over built-in editorial rules', () => {
    const copy = getNewsCopy({
      ...koreanNews,
      title: 'v.269 Known Issues',
      sourceLanguage: 'en',
      versions: ['gms'],
      localizedEditions: {
        zh: {
          title: '编辑部定制标题',
          summary: '结合本地玩家语境重新整理的摘要。',
          categoryLabel: '版本追踪',
          actionLabel: '查看本地版',
          editorialStatus: 'reviewed',
        },
      },
    }, 'zh');

    expect(copy).toMatchObject({
      title: '编辑部定制标题',
      excerpt: '结合本地玩家语境重新整理的摘要。',
      localizedCategory: '版本追踪',
      localizationKind: 'editorial',
    });
  });

  it('does not publish a draft edition to players', () => {
    const copy = getNewsCopy({
      ...koreanNews,
      localizedEditions: {
        zh: {
          title: '尚未审核的标题',
          summary: '尚未审核的摘要。',
          categoryLabel: '草稿',
          actionLabel: '查看草稿',
          editorialStatus: 'draft',
        },
      },
    }, 'zh');

    expect(copy).toMatchObject({
      title: '닉네임 옥션',
      localizationKind: 'original-fallback',
      usesOriginalCopy: true,
    });
  });

  it.each([
    {
      server: 'kms',
      sourceLanguage: 'en' as const,
      title: 'KMST ver. 1.2.203 – 3rd Hexa Skill Core!',
      excerpt: 'The test server added the new 3rd Hexa skill cores.',
      category: 'Patch Notes' as const,
      expectedTitle: 'KMST 1.2.203：第三枚HEXA技能核心上线测试',
      expectedCategory: '测试服更新',
    },
    {
      server: 'jms',
      sourceLanguage: 'ja' as const,
      title: 'スペシャルサンデーメイプル',
      excerpt: 'スペシャルサンデーメイプル',
      category: 'Event' as const,
      expectedTitle: '特别周日冒险岛',
      expectedCategory: '日服活动',
    },
    {
      server: 'tms',
      sourceLanguage: 'zh-Hant' as const,
      title: '【黃金蘋果】燃燒之戒',
      excerpt: '【黃金蘋果】燃燒之戒',
      category: 'Event' as const,
      expectedTitle: '【黄金苹果】燃烧之戒登场',
      expectedCategory: '台服活动',
    },
    {
      server: 'msea',
      sourceLanguage: 'en' as const,
      title: '[Weapon] TRIPLE Miracle Time',
      excerpt: '[Weapon] TRIPLE Miracle Time',
      category: 'Event' as const,
      expectedTitle: '【武器】三倍奇迹时间',
      expectedCategory: '东南亚服活动',
    },
  ])('provides a reviewed Chinese edition for $server content', ({
    server,
    sourceLanguage,
    title,
    excerpt,
    category,
    expectedTitle,
    expectedCategory,
  }) => {
    const copy = getNewsCopy({
      ...koreanNews,
      id: `${server}-regional`,
      title,
      excerpt,
      category,
      versions: [server],
      sourceLanguage,
    }, 'zh');

    expect(copy).toMatchObject({
      title: expectedTitle,
      localizedCategory: expectedCategory,
      localizationKind: 'editorial',
      usesOriginalCopy: false,
    });
  });

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

  it('treats a copied source payload as missing localization', () => {
    const copy = getNewsCopy({
      ...koreanNews,
      translations: {
        zh: { title: koreanNews.title, excerpt: koreanNews.excerpt },
      },
    }, 'zh');

    expect(copy).toMatchObject({
      title: koreanNews.title,
      localizationKind: 'original-fallback',
      usesOriginalCopy: true,
    });
  });

  it('keeps the official copy and exposes its language when a translation is unavailable', () => {
    expect(getNewsCopy(koreanNews, 'zh')).toMatchObject({
      title: '닉네임 옥션',
      excerpt: '닉네임 옥션 안내',
      sourceLanguage: 'ko',
      usesOriginalCopy: true,
      localizationKind: 'original-fallback',
    });
  });

  it('does not label source copy as a fallback when it matches the interface language', () => {
    expect(getNewsCopy(koreanNews, 'ko')).toMatchObject({
      title: '닉네임 옥션',
      usesOriginalCopy: false,
      localizationKind: 'source',
    });
  });
});
