import type { NextApiRequest, NextApiResponse } from 'next';
import { describe, expect, it, vi } from 'vitest';
import rss from './rss.next';

describe('RSS API route', () => {
  it('serves the MPStorys RSS document as XML', () => {
    const setHeader = vi.fn();
    const send = vi.fn();
    const status = vi.fn(() => ({ send }));

    rss({} as NextApiRequest, { setHeader, status } as unknown as NextApiResponse);

    expect(setHeader).toHaveBeenCalledWith(
      'Content-Type',
      'application/rss+xml; charset=utf-8',
    );
    expect(setHeader).toHaveBeenCalledWith(
      'Cache-Control',
      'public, s-maxage=3600, stale-while-revalidate=86400',
    );
    expect(status).toHaveBeenCalledWith(200);
    expect(send).toHaveBeenCalledWith(expect.stringContaining('<rss version="2.0"'));
  });
});
