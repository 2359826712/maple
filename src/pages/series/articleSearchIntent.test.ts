import { describe, expect, it } from 'vitest';
import {
  getArticleSearchIntentProfile,
  hasArticleSearchIntentProfile,
  IDLE_SUMMER_COUPON_URL,
} from './articleSearchIntent';
import {
  getVerifiedSeriesResources,
  getVerifiedSeriesResourceSlug,
} from './verifiedContent';

describe('article search-intent content', () => {
  it('assigns First Adversary demand to the source-backed article', () => {
    const target = { contentId: 'maplestory-europe-gms-official-news-2026-01-14-34997' };
    const profile = getArticleSearchIntentProfile(target, 'en');

    expect(hasArticleSearchIntentProfile(target)).toBe(true);
    expect(profile?.title).toContain('MapleStory First Adversary');
    expect(profile?.keywords).toContain('maplestory first adversary');
    expect(profile?.sections).toHaveLength(4);
    expect(profile?.description).toContain('not on every server landing page');
  });

  it('localizes Classic beta intent in the article rather than the landing profile', () => {
    const profile = getArticleSearchIntentProfile(
      { contentId: 'classic-world-closed-online-test-2-registration' },
      'zh',
    );

    expect(profile?.title).toContain('MapleStory Classic beta');
    expect(profile?.description).toContain('服务器落地页');
    expect(profile?.keywords).toEqual(expect.arrayContaining([
      'maplestory classic beta',
      'maplestory beta sign up',
    ]));
  });

  it('marks the official Idle coupon article as expired in market-native copy', () => {
    const simplified = getArticleSearchIntentProfile({ sourceUrl: IDLE_SUMMER_COUPON_URL }, 'zh');
    const traditional = getArticleSearchIntentProfile({ sourceUrl: IDLE_SUMMER_COUPON_URL }, 'zh-Hant');

    expect(simplified?.description).toContain('2026 年 7 月 1 日过期');
    expect(traditional?.title).toContain('楓之谷放置冒險記序號');
    expect(traditional?.keywords).toContain('楓之谷放置冒險記序號');
  });

  it('does not create article content for unrelated or unsupported trend queries', () => {
    expect(getArticleSearchIntentProfile({ contentId: 'chronostory' }, 'en')).toBeUndefined();
    expect(getArticleSearchIntentProfile({ sourceUrl: 'https://example.com/plasma-heart' }, 'en')).toBeUndefined();
  });

  it('surfaces only source-backed trend articles as independently addressable pages', () => {
    const resources = [
      ...getVerifiedSeriesResources('maplestory-pc', 'events'),
      ...getVerifiedSeriesResources('maplestory-classic', 'news'),
      ...getVerifiedSeriesResources('maplestory-idle', 'news'),
    ].filter((resource) => (
      resource.contentId?.includes('34997')
      || resource.contentId?.includes('classic-world-closed-online-test-2')
      || resource.sourceUrl === IDLE_SUMMER_COUPON_URL
    ));

    expect(resources).toHaveLength(3);
    expect(resources.map(getVerifiedSeriesResourceSlug)).toEqual(expect.arrayContaining([
      expect.stringContaining('undying-purpose-event'),
      expect.stringContaining('sign-up-for-global-maplestory-classic-world'),
      expect.stringContaining('summertime-surprise-coupon-gift'),
    ]));
  });
});
