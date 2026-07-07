import { useCallback, useEffect, useState } from 'react';

export const AUTH_SESSION_KEY = 'maplehub-auth-session';

export interface AuthSession {
  provider: string;
  user: string;
  mode: string;
  signedInAt: string;
}

const readAuthSession = (): AuthSession | null => {
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

export function useAuthSession() {
  const [session, setSession] = useState<AuthSession | null>(() => readAuthSession());

  const refresh = useCallback(() => {
    setSession(readAuthSession());
  }, []);

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
    refresh,
  };
}

export function getLoginHref() {
  if (typeof window === 'undefined') return '/auth/login';
  return `/auth/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`;
}
