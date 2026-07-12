import { FormEvent, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Navbar from '@/pages/home/components/Navbar';
import Footer from '@/pages/home/components/Footer';
import NotificationDrawer from '@/pages/home/components/NotificationDrawer';
import { saveAuthSession } from '@/hooks/useAuthSession';
import { mapleSqlApi, MapleApiError, type AuthResponse } from '@/services/mapleSqlApi';

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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const saveSession = (provider: 'Email', response: AuthResponse) => {
    const userLabel = response.user.display_name || response.user.username || response.user.email;
    saveAuthSession({
      provider,
      user: userLabel,
      mode,
      signedInAt: new Date().toISOString(),
      accessToken: response.access_token,
      tenantId: response.tenant_id,
      userId: response.user.id,
      email: response.user.email,
      username: response.user.username,
      displayName: response.user.display_name,
      avatarUrl: response.user.avatar_url,
    });
    setMessage(t('auth_success', { provider: provider === 'Email' ? 'Maple SQL' : provider }));
    const next = searchParams.get('next');
    if (next?.startsWith('/')) {
      window.setTimeout(() => {
        window.location.assign(next);
      }, 300);
    }
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
            })
          : await mapleSqlApi.auth.signup({
              email: normalizedEmail,
              username: deriveUsername(normalizedEmail),
              display_name: deriveUsername(normalizedEmail),
              password,
            });
        saveSession('Email', response);
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

                  <div className="text-xs">
                    <label className="flex items-center gap-2 text-foreground-600">
                      <input type="checkbox" className="h-4 w-4 rounded border-background-300 accent-primary-600" />
                      {t('auth_remember')}
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full h-11 rounded-md bg-primary-600 hover:bg-primary-700 text-background-50 font-semibold text-sm cursor-pointer whitespace-nowrap"
                  >
                    {submitting ? 'Connecting...' : mode === 'signin' ? t('auth_sign_in_submit') : t('auth_sign_up_submit')}
                  </button>
                </form>

                {message && (
                  <div className="mt-4 rounded-md border border-primary-200 bg-primary-50 px-3 py-2 text-sm text-primary-800">
                    {message}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
