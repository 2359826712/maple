import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Navbar from '@/pages/home/components/Navbar';
import Footer from '@/pages/home/components/Footer';
import NotificationDrawer from '@/pages/home/components/NotificationDrawer';
import { getLoginHref, useAuthSession } from '@/hooks/useAuthSession';
import {
  mapleSqlApi,
  MapleApiError,
  type SiteFeedbackRecord,
  type SiteFeedbackStatus,
} from '@/services/mapleSqlApi';

const statuses: SiteFeedbackStatus[] = ['new', 'in_progress', 'resolved', 'closed'];

export default function AdminFeedbackPage() {
  const { t, i18n } = useTranslation();
  const { isSessionResolved, isSignedIn, isAdmin } = useAuthSession();
  const [notifOpen, setNotifOpen] = useState(false);
  const [items, setItems] = useState<SiteFeedbackRecord[]>([]);
  const [statusFilter, setStatusFilter] = useState<SiteFeedbackStatus | ''>('');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [editStatus, setEditStatus] = useState<SiteFeedbackStatus>('new');
  const [adminNote, setAdminNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const selected = useMemo(() => items.find((item) => item.id === selectedId) || null, [items, selectedId]);
  const counts = useMemo(() => Object.fromEntries(statuses.map((status) => [status, items.filter((item) => item.status === status).length])), [items]);
  const visibleItems = useMemo(
    () => statusFilter ? items.filter((item) => item.status === statusFilter) : items,
    [items, statusFilter],
  );

  useEffect(() => {
    if (!isAdmin) return;
    let active = true;
    const timer = window.setTimeout(() => {
      setLoading(true);
      setErrorMessage('');
      void mapleSqlApi.feedback.list({ query: query.trim() })
        .then((records) => {
          if (!active) return;
          setItems(records);
          const visibleRecords = statusFilter ? records.filter((item) => item.status === statusFilter) : records;
          setSelectedId((current) => visibleRecords.some((item) => item.id === current) ? current : visibleRecords[0]?.id || '');
        })
        .catch((error) => {
          if (!active) return;
          setErrorMessage(error instanceof MapleApiError ? error.message : t('admin_feedback_load_error'));
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 250);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [isAdmin, query, statusFilter, t]);

  useEffect(() => {
    if (!selected) return;
    setEditStatus(selected.status);
    setAdminNote(selected.admin_note);
  }, [selected]);

  const saveFeedback = async () => {
    if (!selected) return;
    setSaving(true);
    setErrorMessage('');
    try {
      const updated = await mapleSqlApi.feedback.update(selected.id, {
        status: editStatus,
        admin_note: adminNote.trim(),
      });
      setItems((current) => current.map((item) => item.id === updated.id ? updated : item));
    } catch (error) {
      setErrorMessage(error instanceof MapleApiError ? error.message : t('admin_feedback_save_error'));
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (value: string) => new Intl.DateTimeFormat(i18n.language, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));

  return (
    <div className="min-h-screen bg-background-50 text-foreground-900">
      <Navbar onOpenNotifications={() => setNotifOpen(true)} unread={0} />
      <NotificationDrawer open={notifOpen} onClose={() => setNotifOpen(false)} />

      <main id="main-content" tabIndex={-1} className="pb-16 pt-24 md:pt-28">
        {!isSessionResolved ? (
          <section className="mx-auto min-h-[30rem] max-w-7xl px-4 py-16 md:px-8" aria-busy="true">
            <div className="h-28 rounded-xl bg-background-100" />
            <div className="mt-6 h-72 rounded-xl bg-background-100" />
          </section>
        ) : !isSignedIn ? (
          <section className="mx-auto max-w-xl px-4 py-16 text-center">
            <i className="ri-lock-2-line text-4xl text-primary-600" aria-hidden="true" />
            <h1 className="mt-4 font-heading text-2xl font-semibold text-foreground-950">{t('admin_feedback_signin_title')}</h1>
            <p className="mt-2 text-sm text-foreground-600">{t('admin_feedback_signin_desc')}</p>
            <Link to={getLoginHref()} className="mt-6 inline-flex h-11 items-center rounded-full bg-primary-600 px-6 text-sm font-semibold text-white hover:bg-primary-700">
              {t('nav_sign_in')}
            </Link>
          </section>
        ) : !isAdmin ? (
          <section className="mx-auto max-w-xl px-4 py-16 text-center">
            <i className="ri-shield-keyhole-line text-4xl text-red-600" aria-hidden="true" />
            <h1 className="mt-4 font-heading text-2xl font-semibold text-foreground-950">{t('admin_feedback_forbidden_title')}</h1>
            <p className="mt-2 text-sm text-foreground-600">{t('admin_feedback_forbidden_desc')}</p>
          </section>
        ) : (
          <div className="mx-auto max-w-7xl px-4 md:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-700">{t('admin_feedback_eyebrow')}</p>
                <h1 className="mt-2 font-heading text-3xl font-semibold text-foreground-950">{t('admin_feedback_title')}</h1>
                <p className="mt-2 text-sm text-foreground-600">{t('admin_feedback_desc')}</p>
              </div>
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-primary-200 bg-primary-50 px-3 py-1.5 text-xs font-semibold text-primary-800">
                <i className="ri-shield-check-line" aria-hidden="true" />
                {t('admin_feedback_admin_badge')}
              </span>
            </div>

            <section className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label={t('admin_feedback_summary')}>
              {statuses.map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(statusFilter === status ? '' : status)}
                  className={`rounded-xl border p-4 text-left transition ${statusFilter === status ? 'border-primary-400 bg-primary-50' : 'border-background-200 bg-white hover:border-primary-200'}`}
                >
                  <span className="text-xs font-medium text-foreground-500">{t(`admin_feedback_status_${status}`)}</span>
                  <strong className="mt-2 block text-2xl text-foreground-950">{counts[status] || 0}</strong>
                </button>
              ))}
            </section>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-foreground-400" aria-hidden="true" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  maxLength={120}
                  placeholder={t('admin_feedback_search_placeholder')}
                  aria-label={t('admin_feedback_search_placeholder')}
                  className="h-11 w-full rounded-xl border border-background-300 bg-white pl-10 pr-3 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as SiteFeedbackStatus | '')}
                aria-label={t('admin_feedback_filter_label')}
                className="h-11 rounded-xl border border-background-300 bg-white px-3 text-sm outline-none focus:border-primary-500"
              >
                <option value="">{t('admin_feedback_all_statuses')}</option>
                {statuses.map((status) => <option key={status} value={status}>{t(`admin_feedback_status_${status}`)}</option>)}
              </select>
            </div>

            {errorMessage && <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{errorMessage}</p>}

            <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(20rem,.8fr)_minmax(0,1.2fr)]">
              <section className="min-h-80 overflow-hidden rounded-2xl border border-background-200 bg-white">
                <div className="border-b border-background-200 px-5 py-4">
                  <h2 className="font-heading text-lg font-semibold text-foreground-950">{t('admin_feedback_inbox')}</h2>
                </div>
                {loading ? (
                  <p className="p-8 text-center text-sm text-foreground-500">{t('admin_feedback_loading')}</p>
                ) : visibleItems.length === 0 ? (
                  <p className="p-8 text-center text-sm text-foreground-500">{t('admin_feedback_empty')}</p>
                ) : (
                  <div className="divide-y divide-background-200">
                    {visibleItems.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSelectedId(item.id)}
                        className={`w-full p-5 text-left transition hover:bg-background-100 ${selectedId === item.id ? 'bg-primary-50' : ''}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <span className="text-xs font-semibold text-primary-700">{t(`feedback_category_${item.category}`)}</span>
                          <span className="shrink-0 text-[11px] text-foreground-400">{formatDate(item.created_at)}</span>
                        </div>
                        <h3 className="mt-2 line-clamp-1 text-sm font-semibold text-foreground-950">{item.subject}</h3>
                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-foreground-600">{item.details}</p>
                        <span className="mt-3 inline-flex rounded-full bg-background-200 px-2.5 py-1 text-[11px] font-semibold text-foreground-700">{t(`admin_feedback_status_${item.status}`)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </section>

              <section className="min-h-80 rounded-2xl border border-background-200 bg-white p-6">
                {!selected ? (
                  <div className="flex min-h-64 items-center justify-center text-sm text-foreground-500">{t('admin_feedback_select_prompt')}</div>
                ) : (
                  <div>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <span className="text-xs font-semibold text-primary-700">{t(`feedback_category_${selected.category}`)}</span>
                        <h2 className="mt-2 font-heading text-2xl font-semibold text-foreground-950">{selected.subject}</h2>
                        <p className="mt-1 text-xs text-foreground-500">{formatDate(selected.created_at)} · {selected.id}</p>
                      </div>
                      <select
                        value={editStatus}
                        onChange={(event) => setEditStatus(event.target.value as SiteFeedbackStatus)}
                        aria-label={t('admin_feedback_status_label')}
                        className="h-10 rounded-xl border border-background-300 bg-background-50 px-3 text-sm outline-none focus:border-primary-500"
                      >
                        {statuses.map((status) => <option key={status} value={status}>{t(`admin_feedback_status_${status}`)}</option>)}
                      </select>
                    </div>

                    <div className="mt-6 whitespace-pre-wrap rounded-xl border border-background-200 bg-background-100 p-4 text-sm leading-7 text-foreground-800">{selected.details}</div>

                    <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
                      <div>
                        <dt className="text-xs font-medium text-foreground-500">{t('admin_feedback_contact')}</dt>
                        <dd className="mt-1 break-all text-foreground-800">{selected.contact_email || t('admin_feedback_no_contact')}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-medium text-foreground-500">{t('admin_feedback_source_page')}</dt>
                        <dd className="mt-1 break-all text-foreground-800">{selected.page_url || '—'}</dd>
                      </div>
                    </dl>

                    <label htmlFor="admin-feedback-note" className="mt-6 block text-sm font-semibold text-foreground-800">{t('admin_feedback_note_label')}</label>
                    <textarea
                      id="admin-feedback-note"
                      value={adminNote}
                      onChange={(event) => setAdminNote(event.target.value)}
                      rows={5}
                      maxLength={4000}
                      placeholder={t('admin_feedback_note_placeholder')}
                      className="mt-2 w-full rounded-xl border border-background-300 bg-background-50 p-3 text-sm leading-6 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                    />
                    <button
                      type="button"
                      onClick={() => void saveFeedback()}
                      disabled={saving}
                      className="mt-4 inline-flex h-11 items-center gap-2 rounded-full bg-primary-600 px-6 text-sm font-semibold text-white hover:bg-primary-700 disabled:cursor-wait disabled:opacity-60"
                    >
                      <i className={`${saving ? 'ri-loader-4-line animate-spin' : 'ri-save-3-line'}`} aria-hidden="true" />
                      {t(saving ? 'admin_feedback_saving' : 'admin_feedback_save')}
                    </button>
                  </div>
                )}
              </section>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
