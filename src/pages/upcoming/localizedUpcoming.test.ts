// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { UpcomingUpdateArticle, UpcomingUpdateFeed } from '@/services/upcomingUpdates';
import { localizeUpcomingArticle, localizeUpcomingFeed } from './localizedUpcoming';

const mocks = vi.hoisted(() => ({
  translateTexts: vi.fn(),
  translateText: vi.fn(),
}));

vi.mock('@/services/staticTranslation', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/staticTranslation')>();
  return {
    ...actual,
    translateStaticTexts: mocks.translateTexts,
    translateStaticText: mocks.translateText,
  };
});

const post = {
  id: 'orange-mushroom-1',
  title: 'Test update',
  excerpt: 'A complete test-server update.',
  publishedAt: '2026-07-12T00:00:00.000Z',
  sourceUrl: 'https://orangemushroom.net/test/',
  image: '',
  author: 'Max',
  tags: ['KMST'],
  status: 'kmst' as const,
};

describe('localized upcoming content', () => {
  beforeEach(() => {
    mocks.translateTexts.mockReset();
    mocks.translateText.mockReset();
  });

  it('translates feed cards and complete article HTML', async () => {
    const feed: UpcomingUpdateFeed = {
      items: [post],
      total: 1,
      sourceSyncedAt: '2026-07-12T00:00:00.000Z',
    };
    const article: UpcomingUpdateArticle = { ...post, contentHtml: '<h2>Overview</h2><p>Full body</p>' };
    mocks.translateTexts
      .mockResolvedValueOnce(['测试更新', '完整的测试服更新。', '测试服'])
      .mockResolvedValueOnce(['测试更新', '完整的测试服更新。', '测试服']);
    mocks.translateText.mockResolvedValue('<h2>概览</h2><p>完整正文</p>');

    await expect(localizeUpcomingFeed(feed, 'zh-CN')).resolves.toEqual(expect.objectContaining({
      items: [expect.objectContaining({ title: '测试更新', excerpt: '完整的测试服更新。', tags: ['测试服'] })],
    }));
    await expect(localizeUpcomingArticle(article, 'zh-CN')).resolves.toEqual(expect.objectContaining({
      title: '测试更新',
      contentHtml: '<h2>概览</h2><p>完整正文</p>',
    }));
  });

  it('keeps the complete original article when translation is unavailable', async () => {
    const article: UpcomingUpdateArticle = { ...post, contentHtml: '<h2>Overview</h2><p>Full body</p>' };
    mocks.translateTexts.mockRejectedValue(new Error('translation unavailable'));
    mocks.translateText.mockRejectedValue(new Error('translation unavailable'));

    await expect(localizeUpcomingArticle(article, 'zh-CN')).resolves.toEqual(article);
  });
});
