// @vitest-environment jsdom

import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  AUTH_SESSION_KEY,
  AUTO_LOGIN_ENABLED_KEY,
  clearAuthSession,
  readAuthSession,
  saveAuthSession,
  type AuthSession,
  useAuthSession,
} from './useAuthSession';

const session = (expiresAt: string): AuthSession => ({
  provider: 'Email',
  user: 'Mapler',
  mode: 'signin',
  signedInAt: '2026-07-13T00:00:00.000Z',
  expiresAt,
  accessToken: 'access-token',
  userId: 'user-1',
});

describe('auth session storage', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    document.body.innerHTML = '';
  });

  it('keeps access tokens in session storage instead of persistent local storage', () => {
    saveAuthSession(session(new Date(Date.now() + 60_000).toISOString()));

    expect(sessionStorage.getItem(AUTH_SESSION_KEY)).toContain('access-token');
    expect(localStorage.getItem(AUTH_SESSION_KEY)).toBeNull();
    expect(readAuthSession()?.userId).toBe('user-1');
  });

  it('rejects expired access sessions', () => {
    sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session(new Date(Date.now() - 1_000).toISOString())));

    expect(readAuthSession()).toBeNull();
    expect(sessionStorage.getItem(AUTH_SESSION_KEY)).toBeNull();
  });

  it('clears both current and legacy session locations', () => {
    sessionStorage.setItem(AUTH_SESSION_KEY, '{}');
    localStorage.setItem(AUTH_SESSION_KEY, '{}');

    clearAuthSession();

    expect(sessionStorage.getItem(AUTH_SESSION_KEY)).toBeNull();
    expect(localStorage.getItem(AUTH_SESSION_KEY)).toBeNull();
  });

  it('restores a valid browser session immediately after static hydration', async () => {
    document.body.innerHTML = '<div id="root" data-ssg-route="/account"></div>';
    sessionStorage.setItem(
      AUTH_SESSION_KEY,
      JSON.stringify(session(new Date(Date.now() + 60_000).toISOString())),
    );

    const { result } = renderHook(() => useAuthSession());

    await waitFor(() => expect(result.current.isSignedIn).toBe(true));
    expect(result.current.isSessionResolved).toBe(true);
    expect(result.current.userId).toBe('user-1');
  });

  it('resolves a static guest without exposing an authenticated transition', async () => {
    document.body.innerHTML = '<div id="root" data-ssg-route="/account"></div>';

    const { result } = renderHook(() => useAuthSession());

    await waitFor(() => expect(result.current.isSessionResolved).toBe(true));
    expect(result.current.isSignedIn).toBe(false);
  });

  it('stays unresolved while persistent auto-login is being restored', async () => {
    document.body.innerHTML = '<div id="root" data-ssg-route="/account"></div>';
    localStorage.setItem(AUTO_LOGIN_ENABLED_KEY, 'true');

    const { result } = renderHook(() => useAuthSession());

    await waitFor(() => expect(result.current.isSessionResolved).toBe(false));

    act(() => {
      localStorage.removeItem(AUTO_LOGIN_ENABLED_KEY);
      clearAuthSession();
    });

    await waitFor(() => expect(result.current.isSessionResolved).toBe(true));
    expect(result.current.isSignedIn).toBe(false);
  });
});
