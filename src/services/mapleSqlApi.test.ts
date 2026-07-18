// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { mapleSqlApi } from './mapleSqlApi';

describe('Maple SQL API response normalization', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    sessionStorage.clear();
  });

  it('normalizes an empty notification response to an array', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('null', {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })));

    await expect(mapleSqlApi.notifications.list()).resolves.toEqual([]);
  });

  it('submits website feedback without requiring an account', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: 'feedback-1' }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    }));
    vi.stubGlobal('fetch', fetchMock);

    await mapleSqlApi.feedback.create({
      category: 'bug',
      subject: 'Broken link',
      details: 'The guide link does not open.',
    });

    const init = fetchMock.mock.calls[0]?.[1] as { body?: unknown; headers?: unknown };
    expect(new Headers(init.headers as never).has('Authorization')).toBe(false);
    expect(JSON.parse(String(init.body))).toMatchObject({
      tenant_key: 'default',
      category: 'bug',
      subject: 'Broken link',
    });
  });

  it('authenticates feedback administration updates', async () => {
    sessionStorage.setItem('maplehub-auth-session', JSON.stringify({
      user: 'Admin',
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
      accessToken: 'admin-token',
    }));
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: 'feedback-1' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }));
    vi.stubGlobal('fetch', fetchMock);

    await mapleSqlApi.feedback.update('feedback-1', { status: 'resolved', admin_note: 'Fixed' });

    const init = fetchMock.mock.calls[0]?.[1] as { headers?: unknown; method?: string };
    expect(init.method).toBe('PATCH');
    expect(new Headers(init.headers as never).get('Authorization')).toBe('Bearer admin-token');
  });
});
