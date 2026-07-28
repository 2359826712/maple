// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import translation from '@/i18n/local/en/common';
import NextApplication from '@/next/NextApplication';
import { prefetchRouteForPath } from '@/router/config';
import { getVerifiedSeriesResources } from './verifiedContent';
import { hasResourceDetailExperience } from './resourceToolRegistry';

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

describe('series module routes', () => {
  afterEach(cleanup);

  beforeEach(() => {
    window.history.replaceState({}, '', '/wiki/en/GMS?series=maplestory-n');
    window.localStorage.setItem('maplehub-tool-favorites', JSON.stringify({ legacy: [] }));
  });

  it('renders a non-PC series module without falling into the application error boundary', async () => {
    await prefetchRouteForPath('/wiki/en/GMS');
    render(
      <NextApplication
        language="en"
        pathname="/wiki/en/GMS"
        requestPath="/wiki/en/GMS?series=maplestory-n"
        server="gms"
        translation={translation}
      />,
    );

    expect(await screen.findByRole('heading', { name: 'MapleStory N Wiki' }, { timeout: 10_000 })).toBeTruthy();
    await waitFor(() => {
      expect(screen.queryByText('MPStorys hit an unexpected error')).toBeNull();
    });
  }, 15_000);

  it('renders a functional Classic World readiness tool and persists progress', async () => {
    window.history.replaceState({}, '', '/tools/en/GMS?series=maplestory-classic');
    render(
      <NextApplication
        language="en"
        pathname="/tools/en/GMS"
        requestPath="/tools/en/GMS?series=maplestory-classic"
        server="gms"
        translation={translation}
      />,
    );

    expect(await screen.findByRole('heading', { name: 'Closed Online Test #2 readiness' }, { timeout: 10_000 })).toBeTruthy();
    expect(screen.getByText('Aug 12, 2026')).toBeTruthy();
    const task = screen.getByRole('checkbox', { name: 'Submitted a new Test #2 application' });
    fireEvent.click(task);
    expect(screen.getByText('1/5')).toBeTruthy();
    expect(window.localStorage.getItem('mpstorys-series-tools:maplestory-classic')).toContain('true');
  }, 15_000);

  it('shows the categorized Tools and Favorites menu for non-PC series', async () => {
    window.history.replaceState({}, '', '/tools/en/GMS?series=maplestory-n');
    render(
      <NextApplication
        language="en"
        pathname="/tools/en/GMS"
        requestPath="/tools/en/GMS?series=maplestory-n"
        server="gms"
        translation={translation}
      />,
    );

    expect(await screen.findByRole('heading', { name: 'MapleStory N Tools' }, { timeout: 10_000 })).toBeTruthy();
    const toolsButton = screen.getAllByRole('button', { name: 'Tools' })
      .find((button) => button.getAttribute('aria-haspopup') === 'menu');
    expect(toolsButton).toBeTruthy();
    fireEvent.focus(toolsButton!);

    const toolOption = screen.getByRole('button', { name: 'MapleHub Star Force Calculator' });
    const optionRow = toolOption.parentElement;
    expect(optionRow).toBeTruthy();
    fireEvent.click(within(optionRow!).getByRole('button', { name: 'Add to favorites' }));
    fireEvent.click(screen.getByRole('button', { name: 'Favorites' }));

    expect(screen.getByRole('button', { name: 'MapleHub Star Force Calculator' })).toBeTruthy();
    expect(window.localStorage.getItem('mpstorys-series-tool-favorites:maplestory-n'))
      .toContain('n-maplehub-star-force-calculator');
  }, 15_000);

  it('keeps a usable workspace entry in the Tools menu when a series has no indexed calculators', async () => {
    window.history.replaceState({}, '', '/tools/en/GMS?series=maplestory-worlds');
    render(
      <NextApplication
        language="en"
        pathname="/tools/en/GMS"
        requestPath="/tools/en/GMS?series=maplestory-worlds"
        server="gms"
        translation={translation}
      />,
    );

    expect(await screen.findByRole('heading', { name: 'MapleStory Worlds Tools' }, { timeout: 10_000 })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'MapleStory Worlds Checklist' })).toBeTruthy();
  }, 15_000);

  it('renders source-backed Classic World wiki facts instead of a placeholder card only', async () => {
    window.history.replaceState({}, '', '/wiki/en/GMS?series=maplestory-classic');
    render(
      <NextApplication
        language="en"
        pathname="/wiki/en/GMS"
        requestPath="/wiki/en/GMS?series=maplestory-classic"
        server="gms"
        translation={translation}
      />,
    );

    expect(await screen.findByRole('heading', { name: 'Classic World reference' }, { timeout: 10_000 })).toBeTruthy();
    expect(screen.getByText('3rd Job Advancement')).toBeTruthy();
    expect(screen.getByText('Orbis and El Nath')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Application and access' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Platforms and controls' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Test #2 content' })).toBeTruthy();
  });

  it('expands the Classic World schedule into a complete preparation brief', async () => {
    window.history.replaceState({}, '', '/upcoming/en/GMS?series=maplestory-classic');
    render(
      <NextApplication
        language="en"
        pathname="/upcoming/en/GMS"
        requestPath="/upcoming/en/GMS?series=maplestory-classic"
        server="gms"
        translation={translation}
      />,
    );

    expect(await screen.findByRole('heading', { name: 'Official Test #2 schedule' }, { timeout: 10_000 })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'What the announced schedule includes' })).toBeTruthy();
    expect(screen.getByText(/Every player must submit a new Test #2 application/)).toBeTruthy();
    expect(screen.getByText(/Characters and progress are wiped after the test/)).toBeTruthy();
  });

  it('shows the official article artwork on resource cards', async () => {
    window.history.replaceState({}, '', '/events?series=maplestory-classic');
    render(
      <NextApplication
        language="en"
        pathname="/events"
        requestPath="/events?series=maplestory-classic"
        server="gms"
        translation={translation}
      />,
    );

    const articleHeading = await screen.findByRole('heading', {
      name: 'Sign Up for Global MapleStory Classic World Closed Online Test #2',
    }, { timeout: 10_000 });
    const articleCard = articleHeading.closest('article');
    expect(articleCard).toBeTruthy();
    expect(within(articleCard as HTMLElement).getByRole('img').getAttribute('src'))
      .toBe('https://g.nexonstatic.com/media/u1wjqi0x/540x304-maplestory-classic-world-closed-online-test-2.png');
  });

  it('redirects an unavailable series ranking route to that series news', async () => {
    window.history.replaceState({}, '', '/rankings/en/GMS?series=maplestory-classic');
    render(
      <NextApplication
        language="en"
        pathname="/rankings/en/GMS"
        requestPath="/rankings/en/GMS?series=maplestory-classic"
        server="gms"
        translation={translation}
      />,
    );

    expect(await screen.findByRole('heading', { name: 'MapleStory Classic World Updates' }, { timeout: 10_000 })).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'Rankings' })).toBeNull();
  }, 15_000);

  it('renders concrete module content for every other supported series', async () => {
    const cases = [
      ['maplestory-n', '/wiki/en/GMS', 'MapleStory N documentation map', 'MapleStory N Wiki', 'Web and economy services'],
      ['maplestory-worlds', '/wiki/en/GMS', 'Creator Center reference', 'MapleStory Worlds Wiki', 'API and debugging'],
      ['maplestory-idle', '/wiki/en/GMS', 'Idle RPG system index', 'MapleStory: Idle RPG Wiki', 'Group and seasonal content'],
    ];

    for (const [series, pathname, heading, pageHeading, expandedHeading] of cases) {
      window.history.replaceState({}, '', `${pathname}?series=${series}`);
      const view = render(
        <NextApplication
          language="en"
          pathname={pathname}
          requestPath={`${pathname}?series=${series}`}
          server="gms"
          translation={translation}
        />,
      );
      expect(await screen.findByRole('heading', { level: 1, name: pageHeading }, { timeout: 10_000 })).toBeTruthy();
      expect(await screen.findByRole('heading', { name: heading })).toBeTruthy();
      expect(screen.getByRole('heading', { name: expandedHeading })).toBeTruthy();
      view.unmount();
    }
  });

  it('shows the expanded MapleStory M guide library as separate readable records', async () => {
    const guides = getVerifiedSeriesResources('maplestory-m', 'guides')
      .filter((resource) => resource.contentId);
    expect(guides).toHaveLength(7);

    window.history.replaceState({}, '', '/guides/en/GMS?series=maplestory-m');
    render(
      <NextApplication
        language="en"
        pathname="/guides/en/GMS"
        requestPath="/guides/en/GMS?series=maplestory-m"
        server="gms"
        translation={translation}
      />,
    );

    expect(await screen.findByText('Showing 7 of 7 verified records', {}, { timeout: 10_000 })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'MapleStory M Maple Guide' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'MapleStory M Basic UI Guide' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'MapleStory M Scrolls Guide' })).toBeTruthy();
  }, 15_000);

  it('provides equally readable guide libraries for Classic, Worlds, and Idle', async () => {
    const cases = [
      {
        series: 'maplestory-classic',
        expectedCount: 6,
        expectedHeading: 'MapleStory Classic Beginner\'s First Steps',
      },
      {
        series: 'maplestory-worlds',
        expectedCount: 12,
        expectedHeading: 'MapleStory Worlds Basic Creation Guide',
      },
      {
        series: 'maplestory-idle',
        expectedCount: 6,
        expectedHeading: 'MapleStory: Idle RPG Official Gameplay FAQ',
      },
    ];

    for (const { series, expectedCount, expectedHeading } of cases) {
      const guides = getVerifiedSeriesResources(series, 'guides')
        .filter((resource) => resource.contentId);
      expect(guides).toHaveLength(expectedCount);

      window.history.replaceState({}, '', `/guides/en/GMS?series=${series}`);
      const view = render(
        <NextApplication
          language="en"
          pathname="/guides/en/GMS"
          requestPath={`/guides/en/GMS?series=${series}`}
          server="gms"
          translation={translation}
        />,
      );

      expect(await screen.findByText(
        `Showing ${expectedCount} of ${expectedCount} verified records`,
        {},
        { timeout: 10_000 },
      )).toBeTruthy();
      expect(screen.getByRole('heading', { name: expectedHeading })).toBeTruthy();
      view.unmount();
    }
  }, 30_000);

  it('keeps Wiki pages on their independent reference layer instead of duplicating guides', async () => {
    const cases = [
      ['maplestory-classic', 'Classic World reference'],
      ['maplestory-m', 'MapleStory M system reference'],
      ['maplestory-n', 'MapleStory N documentation map'],
      ['maplestory-worlds', 'Creator Center reference'],
      ['maplestory-idle', 'Idle RPG system index'],
    ] as const;

    for (const [series, expectedHeading] of cases) {
      const wikiArticles = getVerifiedSeriesResources(series, 'wiki')
        .filter((resource) => resource.contentId);
      expect(wikiArticles).toHaveLength(0);

      window.history.replaceState({}, '', `/wiki/en/GMS?series=${series}`);
      const view = render(
        <NextApplication
          language="en"
          pathname="/wiki/en/GMS"
          requestPath={`/wiki/en/GMS?series=${series}`}
          server="gms"
          translation={translation}
        />,
      );

      expect(await screen.findByRole('heading', { name: expectedHeading }, { timeout: 10_000 })).toBeTruthy();
      view.unmount();
    }
  }, 30_000);

  it('keeps readable records scoped to their intended series modules', () => {
    const expectedModules = [
      ['maplestory-classic', 'upcoming', 0],
      ['maplestory-classic', 'events', 1],
      ['maplestory-m', 'news', 9],
      ['maplestory-m', 'events', 6],
      ['maplestory-idle', 'news', 0],
      ['maplestory-idle', 'events', 6],
    ] as const;

    expectedModules.forEach(([seriesId, module, expectedCount]) => {
      expect(getVerifiedSeriesResources(seriesId, module)
        .filter((resource) => resource.contentId)).toHaveLength(expectedCount);
    });
  });

  it('paginates the complete readable archive without presenting metadata indexes as articles', async () => {
    const resources = getVerifiedSeriesResources('maplestory-n', 'events')
      .filter((resource) => resource.contentId || hasResourceDetailExperience(resource));
    expect(resources.length).toBeGreaterThan(12);
    window.history.replaceState({}, '', '/events/en/GMS?series=maplestory-n');
    render(
      <NextApplication
        language="en"
        pathname="/events/en/GMS"
        requestPath="/events/en/GMS?series=maplestory-n"
        server="gms"
        translation={translation}
      />,
    );

    expect(await screen.findByText(`Showing 18 of ${resources.length} verified records`, {}, { timeout: 10_000 })).toBeTruthy();
    expect(screen.getByText('Events records').nextElementSibling?.textContent)
      .toBe(String(resources.length));
    expect(screen.getByRole('searchbox', { name: 'Search this module' })).toBeTruthy();
    expect(screen.getByRole('heading', { level: 2, name: 'MapleStory N Events' })).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'V Tracker mission reference' })).toBeNull();
    const archiveButtons = screen.getAllByRole('button', { name: 'Show 18 more' });
    fireEvent.click(archiveButtons[archiveButtons.length - 1]);
    expect(await screen.findByText(`Showing 36 of ${resources.length} verified records`)).toBeTruthy();
  });

  it('renders readable and usable workspaces when a series module has no on-site articles', async () => {
    const cases = [
      {
        series: 'maplestory-n',
        pathname: '/rankings/en/GMS',
        heading: 'Ranking progress planner',
      },
      {
        series: 'maplestory-worlds',
        pathname: '/shop/en/GMS',
        heading: 'Purchase budget planner',
      },
    ];

    for (const item of cases) {
      window.history.replaceState({}, '', `${item.pathname}?series=${item.series}`);
      const view = render(
        <NextApplication
          language="en"
          pathname={item.pathname}
          requestPath={`${item.pathname}?series=${item.series}`}
          server="gms"
          translation={translation}
        />,
      );

      expect(await screen.findByRole('heading', { name: item.heading }, { timeout: 10_000 })).toBeTruthy();
      expect(screen.queryByRole('link', { name: 'View details on MPStorys' })).toBeNull();
      view.unmount();
    }
  }, 30_000);

  it('renders MapleStory M updates from indexed records without a fixed editorial briefing', async () => {
    window.history.replaceState({}, '', '/updates?series=maplestory-m');
    render(
      <NextApplication
        language="en"
        pathname="/updates"
        requestPath="/updates?series=maplestory-m"
        server="gms"
        translation={translation}
      />,
    );

    expect(await screen.findByRole('heading', {
      name: 'Latest MapleStory M updates',
    }, { timeout: 10_000 })).toBeTruthy();
    expect(screen.getByText('Showing 9 of 9 verified records')).toBeTruthy();
    expect(screen.getAllByRole('link', { name: 'Check official source' }).length).toBeGreaterThan(0);
    expect(screen.queryByRole('link', { name: 'Read on MPStorys' })).toBeNull();
    expect(screen.queryByRole('heading', { name: 'Current MapleStory M briefing' })).toBeNull();
    expect(screen.queryByRole('heading', { name: 'Events and limited sales' })).toBeNull();
  });

  it('hydrates a series archive with the same translations rendered by SSR', async () => {
    const resource = getVerifiedSeriesResources('maplestory-m', 'news')
      .find((item) => item.contentId);
    expect(resource?.contentId).toBeTruthy();
    window.history.replaceState({}, '', '/updates/zh/GMS?series=maplestory-m');
    render(
      <NextApplication
        language="zh"
        pathname="/updates/zh/GMS"
        requestPath="/updates/zh/GMS?series=maplestory-m"
        server="gms"
        translation={translation}
        initialSeriesTranslations={{
          [resource!.contentId!]: {
            slug: resource!.contentId!,
            content_id: 'content-uuid',
            locale: 'zh',
            title: '服务器渲染的中文标题',
            summary: '服务器渲染的中文摘要',
            body_html: '',
            source_revision: 'sha256:revision',
            provider: 'local',
            model: 'model',
            glossary_version: '1',
            quality_checks: {},
            review_status: 'approved',
            updated_at: '2026-07-27T00:00:00Z',
          },
        }}
      />,
    );

    expect(screen.getByRole('heading', { name: '服务器渲染的中文标题' })).toBeTruthy();
    expect(screen.getByText('服务器渲染的中文摘要')).toBeTruthy();
  });

  it('calculates series shop budgets directly on the module page', async () => {
    window.history.replaceState({}, '', '/shop/en/GMS?series=maplestory-idle');
    render(
      <NextApplication
        language="en"
        pathname="/shop/en/GMS"
        requestPath="/shop/en/GMS?series=maplestory-idle"
        server="gms"
        translation={translation}
      />,
    );

    expect(await screen.findByRole('heading', { name: 'Purchase budget planner' }, { timeout: 10_000 })).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Total budget'), { target: { value: '100' } });
    fireEvent.change(screen.getByLabelText('Planned spending'), { target: { value: '125' } });
    expect(screen.getByText('Over budget by')).toBeTruthy();
    expect(screen.getByText('25')).toBeTruthy();
  }, 15_000);

  it('keeps newly indexed community resources inside MPStorys', async () => {
    window.history.replaceState({}, '', '/community/en/GMS?series=maplestory-classic');
    render(
      <NextApplication
        language="en"
        pathname="/community/en/GMS"
        requestPath="/community/en/GMS?series=maplestory-classic"
        server="gms"
        translation={translation}
      />,
    );

    expect(await screen.findByRole('heading', {
      level: 1,
      name: 'MapleStory Classic World Community',
    }, { timeout: 10_000 })).toBeTruthy();
    const preview = screen.getByRole('tabpanel');
    expect(within(preview).getByRole('heading', { name: 'r/MSClassicWorld' })).toBeTruthy();
    expect(within(preview).getByRole('link', { name: /View details on MPStorys/ }).getAttribute('href'))
      .toBe('/series/maplestory-classic/community/r-msclassicworld-classic-world-subreddit');
  });

  it('lets visitors choose a community and preview it instead of redirecting automatically', async () => {
    window.history.replaceState({}, '', '/community/en/GMS');
    await prefetchRouteForPath('/community/en/GMS');
    render(
      <NextApplication
        language="en"
        pathname="/community/en/GMS"
        requestPath="/community/en/GMS"
        server="gms"
        translation={translation}
      />,
    );

    expect(await screen.findByRole('heading', {
      level: 1,
      name: 'Choose your MapleStory community',
    }, { timeout: 10_000 })).toBeTruthy();
    expect(screen.getAllByRole('tab')).toHaveLength(5);
    fireEvent.click(screen.getByRole('tab', { name: /r\/MapleStory/ }));

    const preview = screen.getByRole('tabpanel');
    expect(within(preview).getByRole('heading', { name: 'r/MapleStory' })).toBeTruthy();
    expect(within(preview).getByText('Player-run community')).toBeTruthy();
    expect(within(preview).getByText('New player questions')).toBeTruthy();
    expect(within(preview).getByText(/pinned New Players & General Questions thread/)).toBeTruthy();
    expect(within(preview).getByText('Verified content snapshot')).toBeTruthy();
    expect(within(preview).getByText('[Megathread] New Players & General Questions Thread')).toBeTruthy();
    expect(within(preview).getByText('Verified external destination')).toBeTruthy();
    expect(within(preview).getByText(/Exact link checked on 2026-07-25/)).toBeTruthy();
    expect(within(preview).getByRole('link', { name: /Visit selected community/ }).getAttribute('href'))
      .toBe('https://www.reddit.com/r/Maplestory/');

    const verifiedDestinations = [
      ['MapleStory Forums', 'https://forums.maplestory.nexon.net/categories'],
      ['MapleStory on X', 'https://x.com/MapleStory'],
      ['MapleStory YouTube', 'https://www.youtube.com/@MapleStory'],
      ['Official MapleStory Discord', 'https://discord.com/invite/maplestory'],
    ];
    for (const [name, href] of verifiedDestinations) {
      fireEvent.click(screen.getByRole('tab', { name: new RegExp(name) }));
      expect(within(preview).getByRole('link', { name: /Visit selected community/ }).getAttribute('href'))
        .toBe(href);
    }
    expect(window.location.pathname).toBe('/community/en/GMS');
  });
});
