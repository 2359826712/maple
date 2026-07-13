import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Navbar from '@/pages/home/components/Navbar';
import Footer from '@/pages/home/components/Footer';
import NotificationDrawer from '@/pages/home/components/NotificationDrawer';
import { usePageMetadata } from '@/hooks/usePageMetadata';
import {
  fetchUpcomingUpdates,
  ORANGE_MUSHROOM_TIME_ZONE,
  type UpcomingUpdateFeed,
} from '@/services/upcomingUpdates';

const ORANGE_MUSHROOM_KMST_URL = 'https://orangemushroom.net/category/kmst/';

const statusDefinitions = [
  {
    labelKey: 'upcoming_status_confirmed',
    descriptionKey: 'upcoming_status_confirmed_desc',
    icon: 'ri-checkbox-circle-fill',
    badgeClass: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    iconClass: 'text-emerald-600',
  },
  {
    labelKey: 'upcoming_status_kmst',
    descriptionKey: 'upcoming_status_kmst_desc',
    icon: 'ri-flask-fill',
    badgeClass: 'border-sky-200 bg-sky-50 text-sky-800',
    iconClass: 'text-sky-600',
  },
  {
    labelKey: 'upcoming_status_expected',
    descriptionKey: 'upcoming_status_expected_desc',
    icon: 'ri-radar-fill',
    badgeClass: 'border-amber-200 bg-amber-50 text-amber-900',
    iconClass: 'text-amber-600',
  },
  {
    labelKey: 'upcoming_status_speculation',
    descriptionKey: 'upcoming_status_speculation_desc',
    icon: 'ri-chat-quote-fill',
    badgeClass: 'border-violet-200 bg-violet-50 text-violet-900',
    iconClass: 'text-violet-600',
  },
] as const;

const readingRules = [
  { titleKey: 'upcoming_rule_one', descriptionKey: 'upcoming_rule_one_desc', icon: 'ri-price-tag-3-line' },
  { titleKey: 'upcoming_rule_two', descriptionKey: 'upcoming_rule_two_desc', icon: 'ri-calendar-check-line' },
  { titleKey: 'upcoming_rule_three', descriptionKey: 'upcoming_rule_three_desc', icon: 'ri-coins-line' },
] as const;

export default function UpcomingUpdatesPage() {
  const { t, i18n } = useTranslation();
  const [notifOpen, setNotifOpen] = useState(false);
  const [feed, setFeed] = useState<UpcomingUpdateFeed | null>(null);
  const [feedStatus, setFeedStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  usePageMetadata(t('upcoming_title'), t('upcoming_meta_desc'));

  const loadFeed = useCallback((force = false) => {
    const controller = new AbortController();
    setFeedStatus('loading');
    void fetchUpcomingUpdates({ force, signal: controller.signal })
      .then((nextFeed) => {
        setFeed(nextFeed);
        setFeedStatus(nextFeed.items.length > 0 ? 'ready' : 'error');
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setFeedStatus('error');
      });
    return () => controller.abort();
  }, []);

  useEffect(() => loadFeed(), [loadFeed]);

  const formatDate = (value: string) => {
    try {
      return new Intl.DateTimeFormat(i18n.language, {
        dateStyle: 'medium',
        timeZone: ORANGE_MUSHROOM_TIME_ZONE,
      }).format(new Date(value));
    } catch {
      return value;
    }
  };

  return (
    <div className="min-h-screen bg-background-50 text-foreground-900">
      <Navbar onOpenNotifications={() => setNotifOpen(true)} unread={0} />
      <NotificationDrawer open={notifOpen} onClose={() => setNotifOpen(false)} />

      <main id="main-content" tabIndex={-1} className="pb-20 pt-16 md:pt-20">
        <section className="relative overflow-hidden border-b border-primary-200/50 bg-gradient-to-br from-primary-50 via-background-50 to-secondary-50">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary-200/30 blur-3xl" aria-hidden="true" />
          <div className="absolute -bottom-28 -left-20 h-64 w-64 rounded-full bg-secondary-200/35 blur-3xl" aria-hidden="true" />
          <div className="relative mx-auto max-w-6xl px-4 py-14 md:px-8 md:py-20">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary-200 bg-background-50/90 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-primary-700 shadow-sm">
              <i className="ri-radar-line" aria-hidden="true" />
              {t('upcoming_eyebrow')}
            </div>
            <h1 className="mt-5 max-w-3xl font-heading text-4xl font-semibold leading-tight text-foreground-950 md:text-6xl">
              {t('upcoming_title')}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-foreground-700 md:text-lg">
              {t('upcoming_desc')}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#latest-kmst"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary-600 px-5 py-3 text-sm font-bold text-background-50 shadow-md transition hover:bg-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
              >
                {t('upcoming_jump_latest')}
                <i className="ri-arrow-down-line" aria-hidden="true" />
              </a>
              <Link
                to="/news"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-background-300 bg-background-50 px-5 py-3 text-sm font-bold text-foreground-800 shadow-sm transition hover:border-primary-300 hover:text-primary-700"
              >
                {t('upcoming_official_news')}
                <i className="ri-arrow-right-line" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>

        <section id="latest-kmst" className="scroll-mt-24 border-b border-background-200 bg-background-50" aria-labelledby="latest-kmst-title">
          <div className="mx-auto max-w-6xl px-4 py-12 md:px-8 md:py-16">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="max-w-2xl">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-primary-700">{t('upcoming_latest_eyebrow')}</p>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-800">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
                    {t('upcoming_live_feed')}
                  </span>
                </div>
                <h2 id="latest-kmst-title" className="mt-2 font-heading text-3xl font-semibold text-foreground-950 md:text-4xl">
                  {t('upcoming_latest_title')}
                </h2>
                <p className="mt-3 text-sm leading-6 text-foreground-600 md:text-base">{t('upcoming_latest_desc')}</p>
              </div>
              {feed?.sourceSyncedAt && (
                <p className="text-xs text-foreground-500">
                  {t('upcoming_feed_updated', { date: formatDate(feed.sourceSyncedAt) })}
                </p>
              )}
            </div>

            {feedStatus === 'loading' && (
              <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3" role="status" aria-label={t('upcoming_feed_loading')}>
                {[0, 1, 2].map((item) => (
                  <div key={item} className="overflow-hidden rounded-2xl border border-background-200 bg-background-50 shadow-sm">
                    <div className="h-44 animate-pulse bg-background-200" />
                    <div className="space-y-3 p-5">
                      <div className="h-4 w-24 animate-pulse rounded bg-background-200" />
                      <div className="h-6 w-full animate-pulse rounded bg-background-200" />
                      <div className="h-16 w-full animate-pulse rounded bg-background-100" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {feedStatus === 'error' && (
              <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-950" role="alert">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="font-heading text-lg font-semibold">{t('upcoming_feed_error_title')}</h3>
                    <p className="mt-1 text-sm leading-6">{t('upcoming_feed_error_desc')}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => loadFeed(true)}
                    className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-amber-300 bg-background-50 px-4 py-2 text-sm font-bold text-amber-950 hover:bg-amber-100"
                  >
                    <i className="ri-refresh-line" aria-hidden="true" />
                    {t('upcoming_feed_retry')}
                  </button>
                </div>
              </div>
            )}

            {feedStatus === 'ready' && feed && (
              <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {feed.items.map((post) => (
                  <article key={post.id} className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-background-200 bg-background-50 shadow-sm transition hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-md">
                    <div className="relative h-44 overflow-hidden bg-gradient-to-br from-primary-100 to-secondary-100">
                      {post.image ? (
                        <img
                          src={post.image}
                          alt=""
                          loading="lazy"
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-primary-500">
                          <i className="ri-flask-line text-5xl" aria-hidden="true" />
                        </div>
                      )}
                      <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-background-50/95 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-sky-800 shadow-sm">
                        <i className="ri-flask-fill" aria-hidden="true" />
                        {t('upcoming_status_kmst')}
                      </span>
                    </div>
                    <div className="flex flex-1 flex-col p-5">
                      <div className="flex items-center justify-between gap-3 text-xs text-foreground-500">
                        <span>{formatDate(post.publishedAt)}</span>
                        <span className="truncate">{post.author}</span>
                      </div>
                      <h3 className="mt-3 font-heading text-xl font-semibold leading-snug text-foreground-950">{post.title}</h3>
                      <p className="mt-3 line-clamp-4 text-sm leading-6 text-foreground-600">{post.excerpt}</p>
                      {post.tags.length > 0 && (
                        <ul className="mt-4 flex flex-wrap gap-1.5" aria-label={t('upcoming_post_topics')}>
                          {post.tags.map((tag) => (
                            <li key={tag} className="rounded-full bg-background-100 px-2 py-1 text-[10px] font-semibold text-foreground-600">{tag}</li>
                          ))}
                        </ul>
                      )}
                      <div className="mt-auto pt-5">
                        <Link
                          to={`/upcoming/${post.id}`}
                          className="inline-flex min-h-11 items-center gap-2 rounded-xl text-sm font-bold text-primary-700 hover:text-primary-900"
                        >
                          {t('upcoming_post_read_inside')}
                          <i className="ri-arrow-right-line" aria-hidden="true" />
                        </Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}

            <div className="mt-6 flex flex-col gap-2 border-t border-background-200 pt-5 text-xs text-foreground-500 sm:flex-row sm:items-center sm:justify-between">
              <p>{t('upcoming_feed_attribution')}</p>
              <a href={ORANGE_MUSHROOM_KMST_URL} target="_blank" rel="nofollow noopener noreferrer" className="inline-flex items-center gap-1 font-bold text-primary-700 hover:text-primary-900">
                {t('upcoming_browse_archive')}
                <i className="ri-external-link-line" aria-hidden="true" />
              </a>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-12 md:px-8 md:py-16" aria-labelledby="upcoming-source-title">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(18rem,0.75fr)]">
            <article className="rounded-3xl border border-background-200 bg-background-50 p-6 shadow-sm md:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-sky-800">
                  <i className="ri-flask-fill" aria-hidden="true" />
                  {t('upcoming_status_kmst')}
                </span>
                <span className="text-xs font-semibold text-foreground-500">{t('upcoming_independent_source')}</span>
              </div>
              <h2 id="upcoming-source-title" className="mt-5 font-heading text-2xl font-semibold text-foreground-950 md:text-3xl">
                {t('upcoming_source_title')}
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-foreground-700 md:text-base">
                {t('upcoming_source_desc')}
              </p>
              <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-sm leading-6 text-amber-950">
                <div className="flex gap-3">
                  <i className="ri-error-warning-fill mt-0.5 text-lg text-amber-600" aria-hidden="true" />
                  <p><strong>{t('upcoming_source_caution_title')}</strong> {t('upcoming_source_caution_desc')}</p>
                </div>
              </div>
              <a
                href={ORANGE_MUSHROOM_KMST_URL}
                target="_blank"
                rel="nofollow noopener noreferrer"
                className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl border border-primary-200 bg-primary-50 px-4 py-2.5 text-sm font-bold text-primary-800 transition hover:border-primary-300 hover:bg-primary-100"
              >
                {t('upcoming_view_kmst')}
                <i className="ri-external-link-line" aria-hidden="true" />
              </a>
            </article>

            <aside className="rounded-3xl border border-primary-200/60 bg-primary-950 p-6 text-background-50 shadow-sm md:p-8" aria-labelledby="upcoming-read-title">
              <i className="ri-compass-3-line text-3xl text-secondary-300" aria-hidden="true" />
              <h2 id="upcoming-read-title" className="mt-4 font-heading text-2xl font-semibold">
                {t('upcoming_read_title')}
              </h2>
              <p className="mt-3 text-sm leading-6 text-background-200">
                {t('upcoming_read_desc')}
              </p>
              <div className="mt-6 border-t border-background-50/15 pt-5 text-sm leading-6 text-background-100">
                <i className="ri-gamepad-line mr-2 text-secondary-300" aria-hidden="true" />
                {t('upcoming_gamer_rule')}
              </div>
            </aside>
          </div>
        </section>

        <section className="border-y border-background-200 bg-background-100/70">
          <div className="mx-auto max-w-6xl px-4 py-12 md:px-8 md:py-16">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-wider text-primary-700">{t('upcoming_legend_eyebrow')}</p>
              <h2 className="mt-2 font-heading text-3xl font-semibold text-foreground-950">{t('upcoming_legend_title')}</h2>
              <p className="mt-3 text-sm leading-6 text-foreground-600">{t('upcoming_legend_desc')}</p>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {statusDefinitions.map((status) => (
                <article key={status.labelKey} className="rounded-2xl border border-background-200 bg-background-50 p-5 shadow-sm">
                  <div className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${status.badgeClass}`}>
                    <i className={status.icon} aria-hidden="true" />
                    {t(status.labelKey)}
                  </div>
                  <i className={`${status.icon} mt-6 block text-2xl ${status.iconClass}`} aria-hidden="true" />
                  <p className="mt-3 text-sm leading-6 text-foreground-700">{t(status.descriptionKey)}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-12 md:px-8 md:py-16" aria-labelledby="upcoming-rules-title">
          <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:items-start">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-primary-700">{t('upcoming_rules_eyebrow')}</p>
              <h2 id="upcoming-rules-title" className="mt-2 font-heading text-3xl font-semibold text-foreground-950">
                {t('upcoming_rules_title')}
              </h2>
              <p className="mt-3 text-sm leading-6 text-foreground-600">{t('upcoming_rules_desc')}</p>
            </div>
            <ol className="grid gap-4">
              {readingRules.map((rule, index) => (
                <li key={rule.titleKey} className="flex gap-4 rounded-2xl border border-background-200 bg-background-50 p-5 shadow-sm">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-700">
                    <i className={`${rule.icon} text-xl`} aria-hidden="true" />
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-foreground-500">{t('upcoming_step', { number: index + 1 })}</div>
                    <h3 className="mt-1 font-heading text-lg font-semibold text-foreground-950">{t(rule.titleKey)}</h3>
                    <p className="mt-1 text-sm leading-6 text-foreground-600">{t(rule.descriptionKey)}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
