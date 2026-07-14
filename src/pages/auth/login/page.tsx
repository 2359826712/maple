import { FormEvent, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Navbar from '@/pages/home/components/Navbar';
import Footer from '@/pages/home/components/Footer';
import NotificationDrawer from '@/pages/home/components/NotificationDrawer';
import {
  AUTO_LOGIN_DAYS,
  AUTO_LOGIN_ENABLED_KEY,
  REMEMBERED_ACCOUNT_KEY,
  saveAuthSession,
  useAuthSession,
} from '@/hooks/useAuthSession';
import { mapleSqlApi, MapleApiError, type AuthResponse } from '@/services/mapleSqlApi';
import { syncAccountDataAfterLogin } from '@/services/accountDataSync';
import GoogleSignInButton from './GoogleSignInButton';

type AuthMode = 'signin' | 'signup';

const deriveUsername = (email: string) => {
  const localPart = email.split('@')[0] || 'mapler';
  return localPart.toLowerCase().replace(/[^a-z0-9_]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 30) || 'mapler';
};

export default function LoginPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [notifOpen, setNotifOpen] = useState(false);
  const [mode, setMode] = useState<AuthMode>('signin');
  const rememberedEmail = typeof window === 'undefined' ? '' : localStorage.getItem(REMEMBERED_ACCOUNT_KEY) || '';
  const [email, setEmail] = useState(rememberedEmail);
  const [password, setPassword] = useState('');
  const [rememberAccount, setRememberAccount] = useState(Boolean(rememberedEmail));
  const [autoLogin, setAutoLogin] = useState(false);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { isSignedIn, displayName } = useAuthSession();

  const saveSession = async (provider: 'Email' | 'Google', response: AuthResponse) => {
    const userLabel = response.user.display_name || response.user.username || response.user.email;
    saveAuthSession({
      provider,
      user: userLabel,
      mode,
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
    if (rememberAccount) localStorage.setItem(REMEMBERED_ACCOUNT_KEY, response.user.email.trim().toLowerCase());
    else localStorage.removeItem(REMEMBERED_ACCOUNT_KEY);
    if (autoLogin) localStorage.setItem(AUTO_LOGIN_ENABLED_KEY, 'true');
    else localStorage.removeItem(AUTO_LOGIN_ENABLED_KEY);

    try {
      await syncAccountDataAfterLogin(response.user.id);
    } catch {
      setMessage(t('auth_sync_failed'));
      return false;
    }

    setPassword('');
    setMessage(t('auth_success', { provider: provider === 'Email' ? 'Maple SQL' : provider }));
    const requestedNext = searchParams.get('next');
    const next = requestedNext?.startsWith('/') && !requestedNext.startsWith('//')
      ? requestedNext
      : '/account';
    window.setTimeout(() => {
      window.location.assign(next);
    }, 300);
    return true;
  };

  const signInWithGoogle = (credential: string) => {
    setSubmitting(true);
    setMessage('');
    void mapleSqlApi.auth.google({ credential, auto_login: autoLogin })
      .then((response) => saveSession('Google', response))
      .catch((error) => {
        setMessage(error instanceof MapleApiError ? error.message : t('auth_google_failed'));
      })
      .finally(() => setSubmitting(false));
  };

  const showGoogleUnavailable = () => {
    setMessage(t('auth_google_unavailable'));
  };

  const submitEmail = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim() || !password.trim()) {
      setMessage(t('auth_missing_fields'));
      return;
    }

    setSubmitting(true);
    setMessage('');
    const normalizedEmail = email.trim().toLowerCase();

    void (async () => {
      try {
        const response = mode === 'signin'
          ? await mapleSqlApi.auth.login({
              email: normalizedEmail,
              password,
              auto_login: autoLogin,
            })
          : await mapleSqlApi.auth.signup({
              email: normalizedEmail,
              username: deriveUsername(normalizedEmail),
              display_name: deriveUsername(normalizedEmail),
              password,
              auto_login: autoLogin,
            });
        await saveSession('Email', response);
      } catch (error) {
        setMessage(error instanceof MapleApiError ? error.message : 'Unable to sign in right now.');
      } finally {
        setSubmitting(false);
      }
    })();
  };

  return (
    <div className="min-h-screen bg-background-50">
      <Navbar onOpenNotifications={() => setNotifOpen(true)} unread={0} />
      <NotificationDrawer open={notifOpen} onClose={() => setNotifOpen(false)} />

      <main id="main-content" tabIndex={-1} className="pt-24 md:pt-28 pb-12">
        <section className="w-full px-4 md:px-8">
          <div className="max-w-md mx-auto">
            <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-foreground-600 hover:text-primary-700 mb-5">
              <i className="ri-arrow-left-line"></i>
              {t('auth_back_home')}
            </Link>

            <div className="rounded-lg border border-background-200 bg-background-50 shadow-sm overflow-hidden">
              <div className="px-6 py-7 border-b border-background-200 bg-background-100">
                <div className="w-12 h-12 rounded-md bg-primary-500 text-background-50 flex items-center justify-center mb-5">
                  <i className="ri-leaf-fill text-2xl"></i>
                </div>
                <h1 className="font-heading text-2xl font-semibold text-foreground-950">{t('auth_title')}</h1>
                <p className="mt-2 text-sm leading-relaxed text-foreground-600">{t('auth_desc')}</p>
              </div>

              <div className="p-6">
                {isSignedIn ? (
                  <div className="rounded-lg border border-primary-200 bg-primary-50 p-5 text-center">
                    <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-500 text-xl text-white">
                      <i className="ri-check-line" aria-hidden="true" />
                    </span>
                    <h2 className="mt-3 font-heading text-lg font-semibold text-foreground-950">
                      {t('auth_already_signed_in', { name: displayName })}
                    </h2>
                    <p className="mt-1 text-sm text-foreground-600">{t('auth_already_signed_in_desc')}</p>
                    <Link
                      to="/account"
                      className="mt-4 inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary-600 px-5 text-sm font-semibold text-white hover:bg-primary-700"
                    >
                      <i className="ri-user-settings-line" aria-hidden="true" />
                      {t('auth_open_account')}
                    </Link>
                  </div>
                ) : (<>
                <GoogleSignInButton
                  disabled={submitting}
                  onCredential={signInWithGoogle}
                  onUnavailable={showGoogleUnavailable}
                />

                <div className="flex items-center gap-3 my-5">
                  <div className="flex-1 h-px bg-background-200" />
                  <span className="text-xs text-foreground-500">{t('auth_or_email')}</span>
                  <div className="flex-1 h-px bg-background-200" />
                </div>

                <div className="grid grid-cols-2 gap-1 rounded-md bg-background-100 p-1 mb-5">
                  <button
                    type="button"
                    onClick={() => { setMode('signin'); setMessage(''); }}
                    className={`h-10 rounded-md text-sm font-semibold cursor-pointer ${
                      mode === 'signin' ? 'bg-background-50 text-primary-700 shadow-sm' : 'text-foreground-600 hover:text-foreground-950'
                    }`}
                  >
                    {t('auth_sign_in')}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setMode('signup'); setMessage(''); }}
                    className={`h-10 rounded-md text-sm font-semibold cursor-pointer ${
                      mode === 'signup' ? 'bg-background-50 text-primary-700 shadow-sm' : 'text-foreground-600 hover:text-foreground-950'
                    }`}
                  >
                    {t('auth_sign_up')}
                  </button>
                </div>

                <form onSubmit={submitEmail} className="space-y-4">
                  <label className="block">
                    <span className="text-xs font-semibold text-foreground-700">{t('auth_email')}</span>
                    <input
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      type="email"
                      autoComplete="email"
                      placeholder="mapler@example.com"
                      className="mt-1 w-full h-11 rounded-md border border-background-300 bg-background-50 px-3 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10"
                    />
                  </label>

                  <label className="block">
                    <span className="text-xs font-semibold text-foreground-700">{t('auth_password')}</span>
                    <input
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      type="password"
                      autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                      placeholder="********"
                      className="mt-1 w-full h-11 rounded-md border border-background-300 bg-background-50 px-3 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10"
                    />
                  </label>

                  <div className="space-y-3 text-xs">
                    <label className="flex min-h-11 items-center gap-3 rounded-md border border-background-200 px-3 text-foreground-700">
                      <input
                        type="checkbox"
                        checked={rememberAccount}
                        onChange={(event) => setRememberAccount(event.target.checked)}
                        className="h-4 w-4 rounded border-background-300 accent-primary-600"
                      />
                      <span>{t('auth_remember_account')}</span>
                    </label>
                    <label className="flex min-h-14 items-start gap-3 rounded-md border border-background-200 px-3 py-2.5 text-foreground-700">
                      <input
                        type="checkbox"
                        checked={autoLogin}
                        onChange={(event) => setAutoLogin(event.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border-background-300 accent-primary-600"
                      />
                      <span>
                        <span className="block font-semibold">{t('auth_auto_login', { days: AUTO_LOGIN_DAYS })}</span>
                        <span className="mt-0.5 block leading-5 text-foreground-500">{t('auth_auto_login_desc', { days: AUTO_LOGIN_DAYS })}</span>
                      </span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full h-11 rounded-md bg-primary-600 hover:bg-primary-700 text-background-50 font-semibold text-sm cursor-pointer whitespace-nowrap"
                  >
                    {submitting ? t('auth_connecting') : mode === 'signin' ? t('auth_sign_in_submit') : t('auth_sign_up_submit')}
                  </button>
                </form>

                {message && (
                  <div className="mt-4 rounded-md border border-primary-200 bg-primary-50 px-3 py-2 text-sm text-primary-800">
                    {message}
                  </div>
                )}
                </>)}
              </div>
            </div>

            {!isSignedIn && (
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {[
                  ['ri-cloud-line', 'auth_benefit_sync'],
                  ['ri-notification-3-line', 'auth_benefit_notifications'],
                  ['ri-chat-heart-line', 'auth_benefit_community'],
                ].map(([icon, label]) => (
                  <div key={label} className="rounded-lg border border-background-200 bg-background-50 p-3 text-center text-xs font-medium text-foreground-700">
                    <i className={`${icon} mb-1 block text-lg text-primary-600`} aria-hidden="true" />
                    {t(label)}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
