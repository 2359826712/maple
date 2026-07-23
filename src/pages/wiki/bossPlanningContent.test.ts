import { describe, expect, it } from 'vitest';
import { bosses } from '@/mocks/bosses';
import { createRoutePageProps } from '@/next/routeData';
import { getBossPlanningContent } from './bossPlanningContent';

const text = (language: 'en' | 'zh' | 'zh-Hant' | 'ja' | 'ko') => {
  const boss = bosses.find((item) => item.id === 'zakum');
  if (!boss) throw new Error('Zakum fixture is missing');
  const content = getBossPlanningContent(boss, language);
  return {
    boss,
    content,
    plainText: [
      content.title,
      content.introduction,
      content.noticeTitle,
      content.noticeBody,
      ...content.sections.flatMap((section) => [
        section.title,
        ...section.paragraphs,
        ...(section.bullets || []),
      ]),
      content.faqTitle,
      ...content.faq.flatMap((item) => [item.question, item.answer]),
    ].join(' '),
  };
};

describe('boss planning content', () => {
  it('adds substantial source-aware planning copy without exposing placeholder combat facts', () => {
    const { boss, content, plainText } = text('en');

    expect(content.sections).toHaveLength(5);
    expect(content.faq).toHaveLength(6);
    expect(plainText.length).toBeGreaterThan(6_000);
    expect(plainText).toContain(`Lv.${boss.minLevel}`);
    expect(plainText).toContain(boss.difficulty.join(', '));
    expect(plainText).toContain('trustworthy dated source');
    expect(plainText).not.toContain('2,500,000');
    expect(plainText).not.toContain('recommended BP of');
  });

  it.each(['zh', 'zh-Hant', 'ja', 'ko'] as const)(
    'provides market-appropriate %s copy instead of falling back to English',
    (language) => {
      const { content, plainText } = text(language);

      expect(content.sections).toHaveLength(5);
      expect(content.faq).toHaveLength(6);
      expect(plainText.length).toBeGreaterThan(1_400);
      expect(content.title).not.toContain('How to prepare');
      expect(plainText).toContain('GMS');
    },
  );

  it('places the localized planning copy in the server-rendered metadata payload', async () => {
    const props = await createRoutePageProps('/wiki/boss/Zakum/zh/GMS');

    expect(props?.routeHeadBoss?.title).toContain('不依赖未经验证数值');
    expect(props?.routeHeadBoss?.description).toContain('Global MapleStory');
    expect(props?.routeHeadBoss?.articleBody.length).toBeGreaterThan(1_400);
    expect(props?.routeHeadBoss?.articleBody).toContain('Zakum GMS 规划摘要');
  });
});
