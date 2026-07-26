import { describe, expect, it } from 'vitest';
import type { WikiEntry } from './liveContent';
import { applyPublishedWikiTranslation } from './wikiTranslation';

describe('applyPublishedWikiTranslation', () => {
  it('replaces the current Wiki presentation with a published native localization', () => {
    const entry = {
      title: 'Adele',
      description: 'English summary',
      content: 'English body',
      htmlContent: '<p>English body</p>',
      contentLanguage: 'en',
      titleZh: '',
      descriptionZh: '',
      contentZh: '',
      htmlContentZh: '',
    } as WikiEntry;

    const localized = applyPublishedWikiTranslation(entry, 'zh', {
      title: '阿黛尔',
      summary: '阿黛尔是高等翼人职业。',
      body_html: '<p>她使用调谐器与以太剑作战。</p>',
      source_revision: 'sha256:test',
    });

    expect(localized).toMatchObject({
      title: '阿黛尔',
      description: '阿黛尔是高等翼人职业。',
      content: '她使用调谐器与以太剑作战。',
      htmlContent: '<p>她使用调谐器与以太剑作战。</p>',
      contentLanguage: 'zh',
      titleZh: '阿黛尔',
    });
  });
});
