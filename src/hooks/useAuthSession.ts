import { useCallback, useEffect, useState } from 'react';
import { telemetry } from '@/services/telemetry';

export const AUTH_SESSION_KEY = 'maplehub-auth-session';

export interface AuthSession {
  provider: string;
  user: string;
  mode: string;
  signedInAt: string;
  accessToken?: string;
  tenantId?: string;
  userId?: string;
  email?: string;
  username?: string;
  displayName?: string;
  avatarUrl?: string;
}

export const readAuthSession = (): AuthSession | null => {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(AUTH_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed.user === 'string' ? (parsed as AuthSession) : null;
  } catch {
    return null;
  }
};

export function saveAuthSession(session: AuthSession) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
  window.dispatchEvent(new StorageEvent('storage', { key: AUTH_SESSION_KEY }));
}

export function clearAuthSession() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(AUTH_SESSION_KEY);
  window.dispatchEvent(new StorageEvent('storage', { key: AUTH_SESSION_KEY }));
}

export function getAccessToken() {
  return readAuthSession()?.accessToken || null;
}

export function useAuthSession() {
  const [session, setSession] = useState<AuthSession | null>(() => readAuthSession());

  const refresh = useCallback(() => {
    setSession(readAuthSession());
  }, []);

  useEffect(() => {
    telemetry.setAuthMode(session ? 'signed-in' : 'guest');
  }, [session]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === AUTH_SESSION_KEY) refresh();
    };

    window.addEventListener('storage', onStorage);
    window.addEventListener('focus', refresh);

    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('focus', refresh);
    };
  }, [refresh]);

  return {
    session,
    isSignedIn: !!session,
    accessToken: session?.accessToken || null,
    userId: session?.userId || null,
    tenantId: session?.tenantId || null,
    displayName: session?.displayName || session?.user || null,
    refresh,
  };
}

export function getLoginHref() {
  if (typeof window === 'undefined') return '/auth/login';
  return `/auth/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`;
}
