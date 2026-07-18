// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import translation from '@/i18n/local/en/common';
import NextApplication from '@/next/NextApplication';

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
  beforeEach(() => {
    window.history.replaceState({}, '', '/wiki/en/GMS?series=maplestory-n');
    window.localStorage.setItem('maplehub-tool-favorites', JSON.stringify({ legacy: [] }));
  });

  it('renders a non-PC series module without falling into the application error boundary', async () => {
    render(
      <NextApplication
        language="en"
        pathname="/wiki/en/GMS"
        requestPath="/wiki/en/GMS?series=maplestory-n"
        server="gms"
        translation={translation}
      />,
    );

    expect(await screen.findByRole('heading', { name: 'Wiki' })).toBeTruthy();
    await waitFor(() => {
      expect(screen.queryByText('MPStorys hit an unexpected error')).toBeNull();
    });
  });

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

    expect(await screen.findByRole('heading', { name: 'Closed Online Test #2 readiness' })).toBeTruthy();
    expect(screen.getByText('Aug 12, 2026')).toBeTruthy();
    const task = screen.getByRole('checkbox', { name: 'Submitted a new Test #2 application' });
    fireEvent.click(task);
    expect(screen.getByText('1/5')).toBeTruthy();
    expect(window.localStorage.getItem('mpstorys-series-tools:maplestory-classic')).toContain('true');
  });

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

    expect(await screen.findByRole('heading', { name: 'Classic World reference' })).toBeTruthy();
    expect(screen.getByText('3rd Job Advancement')).toBeTruthy();
    expect(screen.getByText('Orbis and El Nath')).toBeTruthy();
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

    expect(await screen.findByRole('heading', { name: 'News' })).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'Rankings' })).toBeNull();
  });

  it('renders concrete module content for every other supported series', async () => {
    const cases = [
      ['maplestory-m', '/guides/en/GMS', 'Official beginner guide index'],
      ['maplestory-n', '/events/en/GMS', 'V Tracker mission reference'],
      ['maplestory-worlds', '/wiki/en/GMS', 'Creator Center reference'],
      ['maplestory-idle', '/wiki/en/GMS', 'Idle RPG system index'],
    ];

    for (const [series, pathname, heading] of cases) {
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
      expect(await screen.findByRole('heading', { name: heading })).toBeTruthy();
      view.unmount();
    }
  });
});
