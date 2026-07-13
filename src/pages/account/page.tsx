import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Navbar from '@/pages/home/components/Navbar';
import Footer from '@/pages/home/components/Footer';
import NotificationDrawer from '@/pages/home/components/NotificationDrawer';
import { getLoginHref, useAuthSession } from '@/hooks/useAuthSession';
import { useCharacters } from '@/hooks/useCharacters';
import {
  ACCOUNT_SYNC_CHANGED_EVENT,
  collectAccountData,
  readLastAccountSync,
  saveCurrentAccountData,
} from '@/services/accountDataSync';

type SyncState = 'idle' | 'syncing' | 'success' | 'error';

export default function AccountPage() {
  const { t, i18n } = useTranslation();
  const { isSignedIn, displayName, session } = useAuthSession();
  const { characters } = useCharacters();
  const [notifOpen, setNotifOpen] = useState(false);
  const [syncState, setSyncState] = useState<SyncState>('idle');
  const [lastSyncedAt, setLastSyncedAt] = useState(() => readLastAccountSync());

  useEffect(() => {
    const refresh = () => setLastSyncedAt(readLastAccountSync());
    window.addEventListener(ACCOUNT_SYNC_CHANGED_EVENT, refresh);
    return () => window.removeEventListener(ACCOUNT_SYNC_CHANGED_EVENT, refresh);
  }, []);

  const syncedEntries = Object.keys(collectAccountData()).length;

  const syncNow = async () => {
    setSyncState('syncing');
    try {
      await saveCurrentAccountData();
      setLastSyncedAt(readLastAccountSync());
      setSyncState('success');
    } catch {
      setSyncState('error');
    }
  };

  const lastSyncLabel = lastSyncedAt
    ? new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(lastSyncedAt))
    : t('account_sync_pending');

  return (
    <div className="min-h-screen bg-background-50 text-foreground-900">
      <Navbar onOpenNotifications={() => setNotifOpen(true)} unread={0} />
      <NotificationDrawer open={notifOpen} onClose={() => setNotifOpen(false)} />

      <main id="main-content" tabIndex={-1} className="pb-16 pt-24 md:pt-28">
        {!isSignedIn ? (
          <section className="mx-auto max-w-xl px-4 py-14 text-center md:px-8">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-100 text-3xl text-primary-700">
              <i className="ri-lock-2-line" aria-hidden="true" />
            </span>
            <h1 className="mt-5 font-heading text-3xl font-semibold text-foreground-950">{t('account_signed_out_title')}</h1>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-foreground-600">{t('account_signed_out_desc')}</p>
            <Link
              to={getLoginHref()}
              className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-primary-600 px-6 text-sm font-semibold text-white hover:bg-primary-700"
            >
              <i className="ri-login-circle-line" aria-hidden="true" />
              {t('account_sign_in_cta')}
            </Link>
          </section>
        ) : (
          <div className="mx-auto max-w-5xl px-4 md:px-8">
            <section className="overflow-hidden rounded-2xl border border-primary-200 bg-gradient-to-br from-primary-50 via-white to-accent-50">
              <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between md:p-8">
                <div className="flex min-w-0 items-center gap-4">
                  {session?.avatarUrl ? (
                    <img src={session.avatarUrl} alt="" className="h-16 w-16 rounded-2xl object-cover" />
                  ) : (
                    <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary-500 text-2xl font-semibold text-white">
                      {(displayName || '?').slice(0, 1).toUpperCase()}
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wider text-primary-700">{t('account_eyebrow')}</p>
                    <h1 className="mt-1 truncate font-heading text-2xl font-semibold text-foreground-950 md:text-3xl">{displayName}</h1>
                    <p className="mt-1 truncate text-sm text-foreground-600">{session?.email}</p>
                  </div>
                </div>
                <span className="inline-flex w-fit items-center gap-2 rounded-full border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-800">
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  {t('account_connected')}
                </span>
              </div>
            </section>

            <section className="mt-6 grid gap-4 sm:grid-cols-3" aria-label={t('account_overview')}>
              {[
                ['ri-team-line', t('account_characters'), String(characters.length)],
                ['ri-database-2-line', t('account_synced_entries'), String(syncedEntries)],
                ['ri-cloud-line', t('account_cloud_status'), t('account_cloud_active')],
              ].map(([icon, label, value]) => (
                <div key={label} className="rounded-xl border border-background-200 bg-white p-5">
                  <i className={`${icon} text-xl text-primary-600`} aria-hidden="true" />
                  <p className="mt-4 text-xs font-medium text-foreground-500">{label}</p>
                  <p className="mt-1 font-heading text-xl font-semibold text-foreground-950">{value}</p>
                </div>
              ))}
            </section>

            <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(18rem,.75fr)]">
              <section className="rounded-xl border border-background-200 bg-white p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="font-heading text-xl font-semibold text-foreground-950">{t('account_sync_title')}</h2>
                    <p className="mt-1 max-w-xl text-sm leading-6 text-foreground-600">{t('account_sync_desc')}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void syncNow()}
                    disabled={syncState === 'syncing'}
                    className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary-600 px-4 text-sm font-semibold text-white hover:bg-primary-700 disabled:cursor-wait disabled:opacity-70"
                  >
                    <i className={`${syncState === 'syncing' ? 'ri-loader-4-line animate-spin' : 'ri-refresh-line'}`} aria-hidden="true" />
                    {t(syncState === 'syncing' ? 'account_syncing' : 'account_sync_now')}
                  </button>
                </div>
                <div className="mt-5 rounded-lg border border-background-200 bg-background-100 p-4" aria-live="polite">
                  <div className="flex items-start gap-3">
                    <i className={`${syncState === 'error' ? 'ri-error-warning-line text-red-600' : 'ri-checkbox-circle-fill text-green-600'} mt-0.5 text-lg`} aria-hidden="true" />
                    <div>
                      <p className="text-sm font-semibold text-foreground-900">
                        {syncState === 'error' ? t('account_sync_error') : t('account_last_sync', { time: lastSyncLabel })}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-foreground-600">{t('account_sync_scope')}</p>
                    </div>
                  </div>
                </div>
              </section>

              <section className="rounded-xl border border-background-200 bg-white p-6">
                <h2 className="font-heading text-xl font-semibold text-foreground-950">{t('account_quick_actions')}</h2>
                <div className="mt-4 space-y-2">
                  <Link to="/checklist" className="flex min-h-11 items-center justify-between rounded-lg border border-background-200 px-4 text-sm font-semibold text-foreground-800 hover:border-primary-300 hover:bg-primary-50">
                    <span className="flex items-center gap-2"><i className="ri-checkbox-circle-line text-primary-600" />{t('account_open_checklist')}</span>
                    <i className="ri-arrow-right-s-line" />
                  </Link>
                  <Link to="/mapler-house" className="flex min-h-11 items-center justify-between rounded-lg border border-background-200 px-4 text-sm font-semibold text-foreground-800 hover:border-primary-300 hover:bg-primary-50">
                    <span className="flex items-center gap-2"><i className="ri-user-settings-line text-primary-600" />{t('account_manage_characters')}</span>
                    <i className="ri-arrow-right-s-line" />
                  </Link>
                  <button type="button" onClick={() => setNotifOpen(true)} className="flex min-h-11 w-full items-center justify-between rounded-lg border border-background-200 px-4 text-sm font-semibold text-foreground-800 hover:border-primary-300 hover:bg-primary-50">
                    <span className="flex items-center gap-2"><i className="ri-notification-3-line text-primary-600" />{t('account_notifications')}</span>
                    <i className="ri-arrow-right-s-line" />
                  </button>
                </div>
              </section>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
