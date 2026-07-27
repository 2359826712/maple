// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import translation from '@/i18n/local/en/common';
import NextApplication from '@/next/NextApplication';
import { createRoutePageProps } from '@/next/routeData';
import SeriesResourceDetailPage from './SeriesResourceDetailPage';

vi.mock('@/services/mapleSqlApi', () => ({
  mapleSqlApi: {
    auth: {
      me: vi.fn().mockResolvedValue(null),
      refresh: vi.fn().mockResolvedValue(null),
    },
    notifications: {
      list: vi.fn().mockResolvedValue([]),
    },
  },
}));

afterEach(cleanup);

describe('series resource details', () => {
  it('renders a complete researched article for a summary-only indexed news item', async () => {
    const slug = 'jul-11-2026-china-shengquchina-gets-a-launch-date-cms-cl-classic-china-niameowdb-news-2026-07-11-cms-launch-date-august-';
    const pathname = `/series/maplestory-classic/news/${slug}/en/GMS`;
    window.history.replaceState({}, '', pathname);
    const routeProps = await createRoutePageProps(pathname);
    expect(routeProps?.initialSeriesResourceDetail?.hasStructuredContent).toBe(true);

    render(
      <NextApplication
        {...routeProps!}
        translation={translation}
        initialRouteElement={(
          <SeriesResourceDetailPage
            initialContentModule="news"
            initialDetail={routeProps!.initialSeriesResourceDetail}
            initialSeriesId="maplestory-classic"
            initialSlug={slug}
          />
        )}
      />,
    );

    expect(await screen.findByRole('heading', { name: 'Key takeaway' })).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'Overview' })).toBeNull();
    expect(screen.getByRole('heading', { name: 'Launch date and server status' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Trading and the Free Market' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'What this means for Global MapleStory Classic' })).toBeTruthy();
    expect(screen.getByText(/different operators, test schedules, and service rules/)).toBeTruthy();
  });

  it('renders structured first-party facts instead of only the resource summary', async () => {
    const pathname = '/series/maplestory-worlds/guides/welcome-to-maplestory-worlds-worlds-creator-center-welcome-to-msw/en/GMS';
    const requestPath = pathname;
    window.history.replaceState({}, '', requestPath);
    const routeProps = await createRoutePageProps(requestPath);
    expect(routeProps?.initialSeriesResourceDetail).toBeTruthy();

    render(
      <NextApplication
        {...routeProps!}
        translation={translation}
        initialRouteElement={(
          <SeriesResourceDetailPage
            initialContentModule="guides"
            initialDetail={routeProps!.initialSeriesResourceDetail}
            initialSeriesId="maplestory-worlds"
            initialSlug="welcome-to-maplestory-worlds-worlds-creator-center-welcome-to-msw"
          />
        )}
      />,
    );

    expect(await screen.findByRole('heading', { name: 'Detailed content' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: '2. Basic concepts and LuaScript' })).toBeTruthy();
    expect(screen.getByText('Learn property synchronization and function execution control across client and server contexts.')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Practical steps' })).toBeTruthy();
  });

  it('matches a content record through a related official URL', async () => {
    const pathname = '/series/maplestory-classic/news/classic-world-closed-online-test-2-classic-world-test-2-campaign/en/GMS';
    const requestPath = pathname;
    window.history.replaceState({}, '', requestPath);
    const routeProps = await createRoutePageProps(requestPath);
    expect(routeProps?.initialSeriesResourceDetail).toBeTruthy();

    render(
      <NextApplication
        {...routeProps!}
        translation={translation}
        initialRouteElement={(
          <SeriesResourceDetailPage
            initialContentModule="news"
            initialDetail={routeProps!.initialSeriesResourceDetail}
            initialSeriesId="maplestory-classic"
            initialSlug="classic-world-closed-online-test-2-classic-world-test-2-campaign"
          />
        )}
      />,
    );

    expect(await screen.findByRole('heading', { name: 'Detailed content' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Key dates' })).toBeTruthy();
    expect(screen.getByText('Applications close Wednesday, July 29, 2026.')).toBeTruthy();
    expect(screen.getByRole('img', { name: 'Classic World Closed Online Test #2' }).getAttribute('src'))
      .toBe('https://g.nexonstatic.com/mscw/static/classic-world-closed-online-test2/share_fb.jpg');
  });

  it('renders community resources on this site before offering the original source', async () => {
    const pathname = '/series/maplestory-classic/community/r-msclassicworld-classic-world-subreddit/en/GMS';
    const requestPath = pathname;
    window.history.replaceState({}, '', requestPath);
    const routeProps = await createRoutePageProps(requestPath);
    expect(routeProps?.initialSeriesResourceDetail?.resource?.resourceId).toBe('classic-world-subreddit');

    render(
      <NextApplication
        {...routeProps!}
        translation={translation}
        initialRouteElement={(
          <SeriesResourceDetailPage
            initialContentModule="community"
            initialDetail={routeProps!.initialSeriesResourceDetail}
            initialSeriesId="maplestory-classic"
            initialSlug="r-msclassicworld-classic-world-subreddit"
          />
        )}
      />,
    );

    expect(await screen.findByRole('heading', { level: 1, name: 'r/MSClassicWorld' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Verified resource information' })).toBeTruthy();
    expect(screen.getAllByRole('link', { name: /Reddit/ }).some(
      (link) => link.getAttribute('href') === 'https://www.reddit.com/r/MSClassicWorld',
    )).toBe(true);
  });

  it('renders the complete scroll cost calculator on site instead of metadata only', async () => {
    const slug = 'classic-world-60-scroll-cost-simulator-classicworld-scroll-cost-simulator';
    const pathname = `/series/maplestory-classic/tools/${slug}/en/GMS`;
    window.history.replaceState({}, '', pathname);
    const routeProps = await createRoutePageProps(pathname);
    expect(routeProps?.initialSeriesResourceDetail?.resource?.resourceId)
      .toBe('classicworld-scroll-cost-simulator');

    render(
      <NextApplication
        {...routeProps!}
        translation={translation}
        initialRouteElement={(
          <SeriesResourceDetailPage
            initialContentModule="tools"
            initialDetail={routeProps!.initialSeriesResourceDetail}
            initialSeriesId="maplestory-classic"
            initialSlug={slug}
          />
        )}
      />,
    );

    expect(await screen.findByRole('heading', { name: '60% scroll attempt cost calculator' })).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Upgrade slots'), { target: { value: '2' } });
    fireEvent.click(screen.getByRole('button', { name: 'Calculate costs' }));

    const resultTable = screen.getByRole('table');
    expect(within(resultTable).getAllByRole('row')).toHaveLength(3);
    expect(within(resultTable).getByText('84%')).toBeTruthy();
    expect(within(resultTable).getByText('33 million')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Calculation method' })).toBeTruthy();
  });

  it('provides interactive detail workspaces for MapleStory M, N, and Idle resources', async () => {
    const cases = [
      {
        seriesId: 'maplestory-m',
        slug: 'maplestory-m-powder-cost-calculator-m-community-powder-cost-calculator',
        heading: 'MapleStory M Powder Cost Calculator planning worksheet',
        field: 'Materials required',
      },
      {
        seriesId: 'maplestory-n',
        slug: 'maplehub-cube-cost-calculator-n-maplehub-cube-cost-calculator',
        heading: 'MapleHub Cube Cost Calculator probability planner',
        field: 'Chance per attempt (%)',
      },
      {
        seriesId: 'maplestory-idle',
        slug: 'idle-rpg-companion-summoning-chance-calculator-idle-wiki-companion-summon-calculator',
        heading: 'Idle RPG Companion Summoning Chance Calculator probability planner',
        field: 'Chance per attempt (%)',
      },
    ];

    for (const item of cases) {
      const pathname = `/series/${item.seriesId}/tools/${item.slug}/en/GMS`;
      window.history.replaceState({}, '', pathname);
      const routeProps = await createRoutePageProps(pathname);
      const view = render(
        <NextApplication
          {...routeProps!}
          translation={translation}
          initialRouteElement={(
            <SeriesResourceDetailPage
              initialContentModule="tools"
              initialDetail={routeProps!.initialSeriesResourceDetail}
              initialSeriesId={item.seriesId}
              initialSlug={item.slug}
            />
          )}
        />,
      );

      expect(await screen.findByRole('heading', { name: item.heading })).toBeTruthy();
      expect(screen.getByLabelText(item.field)).toBeTruthy();
      view.unmount();
    }
  });

  it('renders the complete official API reference guide for MapleStory Worlds', async () => {
    const slug = 'maplestory-worlds-api-reference-worlds-official-api-reference';
    const pathname = `/series/maplestory-worlds/guides/${slug}/en/GMS`;
    window.history.replaceState({}, '', pathname);
    const routeProps = await createRoutePageProps(pathname);

    render(
      <NextApplication
        {...routeProps!}
        translation={translation}
        initialRouteElement={(
          <SeriesResourceDetailPage
            initialContentModule="guides"
            initialDetail={routeProps!.initialSeriesResourceDetail}
            initialSeriesId="maplestory-worlds"
            initialSlug={slug}
          />
        )}
      />,
    );

    expect(await screen.findByRole('heading', { name: 'Detailed content' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Reference families' })).toBeTruthy();
    expect(screen.getByText(/LIA identifies informational log messages/)).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Practical steps' })).toBeTruthy();
  });

  it('renders indexed resource facts without replacing them with a usage-and-redirect guide', async () => {
    const slug = 'maplestory-m-star-force-rate-table-m-star-force-rate-table';
    const pathname = `/series/maplestory-m/wiki/${slug}/en/GMS`;
    window.history.replaceState({}, '', pathname);
    const routeProps = await createRoutePageProps(pathname);

    render(
      <NextApplication
        {...routeProps!}
        translation={translation}
        initialRouteElement={(
          <SeriesResourceDetailPage
            initialContentModule="wiki"
            initialDetail={routeProps!.initialSeriesResourceDetail}
            initialSeriesId="maplestory-m"
            initialSlug={slug}
          />
        )}
      />,
    );

    expect(await screen.findByRole('heading', { name: 'Verified resource information' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'What this official resource covers' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Availability' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Verification record' })).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'Recommended workflow' })).toBeNull();
  });
});
