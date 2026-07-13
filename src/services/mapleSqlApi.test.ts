// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { mapleSqlApi } from './mapleSqlApi';

describe('Maple SQL API response normalization', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('normalizes an empty notification response to an array', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('null', {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })));

    await expect(mapleSqlApi.notifications.list()).resolves.toEqual([]);
  });
});
