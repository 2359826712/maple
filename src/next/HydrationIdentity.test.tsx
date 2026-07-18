// @vitest-environment node

import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import translation from '@/i18n/local/en/common';
import { prefetchRouteForPath } from '@/router/config';
import NextApplication from './NextApplication';
import GuidesNextRoute from '@/pages/guides/[...route].next';
import NewsNextRoute from '@/pages/news/[...route].next';
import CatchAllNextRoute from '@/pages/[[...route]].next';
import type { GuideItem } from '@/services/liveContent';
import { ensureServerDom } from '@/services/serverDom';

describe('Next application initial SSR', () => {
  it('renders a preloaded route without a pending Suspense fallback', async () => {
    await prefetchRouteForPath('/');

    const serverHtml = renderToString(
      <NextApplication
        language="en"
        pathname="/en/GMS"
        requestPath="/en/GMS"
        server="gms"
        translation={translation}
      />,
    );

    expect(serverHtml).toContain('Choose your MapleStory');
    expect(serverHtml).toContain('MapleStory Classic World');
    expect(serverHtml).not.toContain('Loading page');
  });

  it('keeps the guide route parameter when rendering the initial Next route', () => {
    ensureServerDom();
    const guide: GuideItem = {
      id: 'grandis-content-boss-pre-quests',
      title: 'Boss Matchmaking and Pre-quests',
      class: 'Content',
      guideSection: 'Content',
      difficulty: 'Intermediate',
      length: 'Live',
      upvotes: 0,
      author: 'Grandis Library',
      versions: ['gms'],
      image: '/grandis.png',
      excerpt: 'Current Grandis Library guide.',
      sourceLabel: 'Grandis Library',
      sourceUrl: 'https://grandislibrary.com/content/boss-matchmaking-pre-quests',
      contentHtml: '<h2>Boss preparation</h2><p>Visible guide body.</p>',
      contentText: 'Boss preparation Visible guide body.',
      localizedLanguage: 'en',
    };
    const serverHtml = renderToString(
      <GuidesNextRoute
        language="en"
        pathname="/guides/grandis-content-boss-pre-quests/en/GMS"
        requestPath="/guides/grandis-content-boss-pre-quests/en/GMS"
        server="gms"
        translation={translation}
        initialGuide={guide}
        initialGuides={[guide]}
      />,
    );

    expect(serverHtml).toContain('Boss Matchmaking and Pre-quests');
    expect(serverHtml).toContain('Visible guide body.');
    expect(serverHtml).not.toContain('No guides yet for Grandis Library');
  });

  it('renders the selected series module as the initial route', () => {
    const serverHtml = renderToString(
      <NewsNextRoute
        language="en"
        pathname="/news/en/GMS"
        requestPath="/news/en/GMS?series=maplestory-worlds"
        server="gms"
        translation={translation}
      />,
    );

    expect(serverHtml).toContain('MapleStory Worlds');
    expect(serverHtml).toContain('Open Market Store Process Abuse Sanction Post - June 2026');
    expect(serverHtml).not.toContain('Loading page');
  });

  it('renders indexed content instead of the catch-all home route', () => {
    const pathname = '/content/news/classic-world-closed-online-test-2-classic-world-test-2-campaign/en/GMS';
    const serverHtml = renderToString(
      <CatchAllNextRoute
        language="en"
        pathname={pathname}
        requestPath={`${pathname}?series=maplestory-classic`}
        requestTitle="Classic World Closed Online Test #2"
        server="gms"
        translation={translation}
      />,
    );

    expect(serverHtml).toContain('Key dates');
    expect(serverHtml).toContain('Applications close Wednesday, July 29, 2026.');
    expect(serverHtml).not.toContain('Loading page');
  });
});
