// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
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

afterEach(cleanup);

describe('series resource details', () => {
  it('renders structured first-party facts instead of only the resource summary', async () => {
    const pathname = '/content/guides/welcome-to-maplestory-worlds-worlds-creator-center-welcome-to-msw';
    const requestPath = `${pathname}?series=maplestory-worlds`;
    window.history.replaceState({}, '', requestPath);

    render(
      <NextApplication
        language="en"
        pathname={pathname}
        requestPath={requestPath}
        server="gms"
        translation={translation}
      />,
    );

    expect(await screen.findByRole('heading', { name: 'Detailed content' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: '2. Basic concepts and LuaScript' })).toBeTruthy();
    expect(screen.getByText('Learn property synchronization and function execution control across client and server contexts.')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Practical steps' })).toBeTruthy();
  });

  it('matches a content record through a related official URL', async () => {
    const pathname = '/content/news/classic-world-closed-online-test-2-classic-world-test-2-campaign';
    const requestPath = `${pathname}?series=maplestory-classic`;
    window.history.replaceState({}, '', requestPath);

    render(
      <NextApplication
        language="en"
        pathname={pathname}
        requestPath={requestPath}
        server="gms"
        translation={translation}
      />,
    );

    expect(await screen.findByRole('heading', { name: 'Detailed content' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Key dates' })).toBeTruthy();
    expect(screen.getByText('Applications close Wednesday, July 29, 2026.')).toBeTruthy();
  });
});
