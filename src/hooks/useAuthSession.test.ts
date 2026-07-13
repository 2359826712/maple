// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from 'vitest';
import {
  AUTH_SESSION_KEY,
  clearAuthSession,
  readAuthSession,
  saveAuthSession,
  type AuthSession,
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
});

