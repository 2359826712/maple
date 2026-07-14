import { useEffect, useRef } from 'react';
import {
  AUTO_LOGIN_ENABLED_KEY,
  clearAuthSession,
  readAuthSession,
  saveAuthSession,
  useAuthSession,
} from '@/hooks/useAuthSession';
import { mapleSqlApi } from '@/services/mapleSqlApi';
import {
  ACCOUNT_CACHE_OWNER_KEY,
  ACCOUNT_DATA_CHANGED_EVENT,
  clearAccountDataCache,
  collectAccountData,
  saveCurrentAccountData,
  syncAccountDataAfterLogin,
} from '@/services/accountDataSync';

const toSession = (response: Awaited<ReturnType<typeof mapleSqlApi.auth.refresh>>) => ({
  provider: 'Email',
  user: response.user.display_name || response.user.username || response.user.email,
  mode: 'signin',
  signedInAt: new Date().toISOString(),
  expiresAt: response.access_expires_at,
  autoLoginExpiresAt: response.auto_login_expires_at,
  accessToken: response.access_token,
  tenantId: response.tenant_id,
  userId: response.user.id,
  email: response.user.email,
  username: response.user.username,
  displayName: response.user.display_name,
  avatarUrl: response.user.avatar_url,
  permissions: response.permissions,
});

export default function AccountSessionBootstrap() {
  const { session } = useAuthSession();
  const lastSnapshot = useRef('');

  useEffect(() => {
    if (session?.userId || localStorage.getItem(AUTO_LOGIN_ENABLED_KEY) === 'true') return;
    if (localStorage.getItem(ACCOUNT_CACHE_OWNER_KEY)) clearAccountDataCache();
  }, [session?.userId]);

  useEffect(() => {
    if (readAuthSession() || localStorage.getItem(AUTO_LOGIN_ENABLED_KEY) !== 'true') return;
    let active = true;
    void mapleSqlApi.auth.refresh()
      .then(async (response) => {
        if (!active) return;
        saveAuthSession(toSession(response));
        await syncAccountDataAfterLogin(response.user.id);
        window.location.reload();
      })
      .catch(() => {
        localStorage.removeItem(AUTO_LOGIN_ENABLED_KEY);
        clearAccountDataCache();
        clearAuthSession();
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!session?.expiresAt || localStorage.getItem(AUTO_LOGIN_ENABLED_KEY) !== 'true') return;
    const refreshIn = Math.max(1_000, Date.parse(session.expiresAt) - Date.now() - 60_000);
    const timer = window.setTimeout(() => {
      void mapleSqlApi.auth.refresh()
        .then((response) => saveAuthSession(toSession(response)))
        .catch(() => {
          localStorage.removeItem(AUTO_LOGIN_ENABLED_KEY);
          clearAccountDataCache();
          clearAuthSession();
        });
    }, refreshIn);
    return () => window.clearTimeout(timer);
  }, [session?.expiresAt]);

  useEffect(() => {
    if (!session?.userId) return;
    let timer: number | undefined;
    let disposed = false;
    const persist = () => {
      if (localStorage.getItem(ACCOUNT_CACHE_OWNER_KEY) !== session.userId) return;
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        if (disposed) return;
        const snapshot = JSON.stringify(collectAccountData());
        if (snapshot === lastSnapshot.current) return;
        lastSnapshot.current = snapshot;
        void saveCurrentAccountData().catch(() => undefined);
      }, 750);
    };
    const interval = window.setInterval(persist, 5000);
    window.addEventListener(ACCOUNT_DATA_CHANGED_EVENT, persist);
    window.addEventListener('maplehub-routines-changed', persist);
    window.addEventListener('maplehub-event-goals-changed', persist);
    return () => {
      disposed = true;
      window.clearTimeout(timer);
      window.clearInterval(interval);
      window.removeEventListener(ACCOUNT_DATA_CHANGED_EVENT, persist);
      window.removeEventListener('maplehub-routines-changed', persist);
      window.removeEventListener('maplehub-event-goals-changed', persist);
    };
  }, [session?.userId]);

  return null;
}
