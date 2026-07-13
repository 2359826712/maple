import { useCallback, useEffect, useState } from 'react';
import { telemetry } from '@/services/telemetry';

export const AUTH_SESSION_KEY = 'maplehub-auth-session';
export const AUTH_SESSION_CHANGED_EVENT = 'maplehub-auth-session-changed';
export const REMEMBERED_ACCOUNT_KEY = 'maplehub-remembered-account';
export const AUTO_LOGIN_ENABLED_KEY = 'maplehub-auto-login-enabled';
export const AUTO_LOGIN_DAYS = 7;

export interface AuthSession {
  provider: string;
  user: string;
  mode: string;
  signedInAt: string;
  expiresAt: string;
  autoLoginExpiresAt?: string;
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
    const raw = window.sessionStorage.getItem(AUTH_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.user !== 'string' || !Number.isFinite(Date.parse(parsed.expiresAt))) return null;
    if (Date.parse(parsed.expiresAt) <= Date.now()) {
      window.sessionStorage.removeItem(AUTH_SESSION_KEY);
      return null;
    }
    return parsed as AuthSession;
  } catch {
    return null;
  }
};

export function saveAuthSession(session: AuthSession) {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(AUTH_SESSION_KEY);
  window.sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
  window.dispatchEvent(new CustomEvent(AUTH_SESSION_CHANGED_EVENT));
}

export function clearAuthSession() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(AUTH_SESSION_KEY);
  window.sessionStorage.removeItem(AUTH_SESSION_KEY);
  window.dispatchEvent(new CustomEvent(AUTH_SESSION_CHANGED_EVENT));
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
    if (!session?.expiresAt) return undefined;
    const expiresIn = Math.max(0, Date.parse(session.expiresAt) - Date.now());
    const timer = window.setTimeout(refresh, expiresIn + 25);
    return () => window.clearTimeout(timer);
  }, [refresh, session?.expiresAt]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === AUTH_SESSION_KEY) refresh();
    };

    window.addEventListener('storage', onStorage);
    window.addEventListener(AUTH_SESSION_CHANGED_EVENT, refresh);
    window.addEventListener('focus', refresh);

    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(AUTH_SESSION_CHANGED_EVENT, refresh);
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
