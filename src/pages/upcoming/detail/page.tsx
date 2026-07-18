import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Navbar from '@/pages/home/components/Navbar';
import Footer from '@/pages/home/components/Footer';
import NotificationDrawer from '@/pages/home/components/NotificationDrawer';
import { usePageMetadata } from '@/hooks/usePageMetadata';
import {
  fetchUpcomingUpdateArticle,
  ORANGE_MUSHROOM_TIME_ZONE,
  type UpcomingUpdateArticle,
} from '@/services/upcomingUpdates';
import { useLocalizedUpcomingArticle } from '../localizedUpcoming';
import { prepareStaticHtmlForRender } from '@/services/sanitizeHtml';
import { useServerRouteData } from '@/next/ServerRouteDataContext';

export default function UpcomingUpdateDetailPage({ initialPostId = '' }: { initialPostId?: string } = {}) {
  const params = useParams();
  const postId = params.postId || initialPostId;
  const { t, i18n } = useTranslation();
  const { initialUpcomingArticle } = useServerRouteData();
  const [notifOpen, setNotifOpen] = useState(false);
  const [sourceArticle, setSourceArticle] = useState<UpcomingUpdateArticle | null>(initialUpcomingArticle);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>(initialUpcomingArticle ? 'ready' : 'loading');
  const article = useLocalizedUpcomingArticle(sourceArticle, i18n.language);
  const renderedArticleHtml = useMemo(
    () => article?.contentHtml ? prepareStaticHtmlForRender(article.contentHtml) : '',
    [article?.contentHtml],
  );

  usePageMetadata(article?.title || t('upcoming_post_page_title'), article?.excerpt || t('upcoming_meta_desc'), {
    authorName: article?.author,
    datePublished: article?.publishedAt,
    image: article?.image || undefined,
    imageAlt: article?.title || t('upcoming_post_page_title'),
    noIndex: status === 'error',
    type: 'article',
  });

  const loadArticle = useCallback((force = false) => {
    const controller = new AbortController();
    setStatus('loading');
    void fetchUpcomingUpdateArticle(postId, { force, signal: controller.signal })
      .then((nextArticle) => {
        setSourceArticle(nextArticle);
        setStatus('ready');
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setStatus('error');
      });
    return () => controller.abort();
  }, [postId]);

  useEffect(() => initialUpcomingArticle ? undefined : loadArticle(), [initialUpcomingArticle, loadArticle]);

  const publishedDate = article
    ? new Intl.DateTimeFormat(i18n.language, {
      dateStyle: 'long',
      timeZone: ORANGE_MUSHROOM_TIME_ZONE,
    }).format(new Date(article.publishedAt))
    : '';

  return (
    <div className="min-h-screen bg-background-50 text-foreground-900">
      <Navbar onOpenNotifications={() => setNotifOpen(true)} unread={0} />
      <NotificationDrawer open={notifOpen} onClose={() => setNotifOpen(false)} />

      <main id="main-content" tabIndex={-1} className="px-4 pb-20 pt-24 md:px-8 md:pt-28">
        <div className="mx-auto max-w-5xl">
          <Link to="/upcoming" className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-primary-700 hover:text-primary-900">
            <i className="ri-arrow-left-line" aria-hidden="true" />
            {t('upcoming_post_back')}
          </Link>

          {status === 'loading' && (
            <div className="mt-6 rounded-3xl border border-background-200 bg-background-50 p-8 shadow-sm" role="status" aria-label={t('upcoming_post_loading')}>
              <div className="h-5 w-28 animate-pulse rounded bg-background-200" />
              <div className="mt-5 h-12 w-4/5 animate-pulse rounded bg-background-200" />
              <div className="mt-3 h-5 w-52 animate-pulse rounded bg-background-100" />
              <div className="mt-10 space-y-3">
                <div className="h-4 w-full animate-pulse rounded bg-background-100" />
                <div className="h-4 w-full animate-pulse rounded bg-background-100" />
                <div className="h-4 w-3/4 animate-pulse rounded bg-background-100" />
              </div>
            </div>
          )}

          {status === 'error' && (
            <section className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 p-8 text-center text-amber-950" role="alert">
              <i className="ri-file-warning-line text-4xl text-amber-600" aria-hidden="true" />
              <h1 className="mt-4 font-heading text-2xl font-semibold">{t('upcoming_post_error_title')}</h1>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-6">{t('upcoming_post_error_desc')}</p>
              <button
                type="button"
                onClick={() => loadArticle(true)}
                className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-amber-700 px-5 py-3 text-sm font-bold text-background-50 hover:bg-amber-800"
              >
                <i className="ri-refresh-line" aria-hidden="true" />
                {t('upcoming_feed_retry')}
              </button>
            </section>
          )}

          {status === 'ready' && article && (
            <article className="mt-4">
              <header className="rounded-3xl border border-background-200 bg-gradient-to-br from-primary-50 via-background-50 to-secondary-50 p-6 shadow-sm md:p-10">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-sky-800">
                    <i className="ri-flask-fill" aria-hidden="true" />
                    {t('upcoming_status_kmst')}
                  </span>
                  <span className="rounded-full border border-primary-200 bg-background-50 px-3 py-1 text-xs font-semibold text-primary-800">
                    {t('upcoming_post_in_maplehub')}
                  </span>
                </div>
                <h1 className="mt-5 font-heading text-3xl font-semibold leading-tight text-foreground-950 md:text-5xl">{article.title}</h1>
                <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-foreground-600">
                  <span className="inline-flex items-center gap-1.5"><i className="ri-calendar-line" aria-hidden="true" />{publishedDate}</span>
                  <span className="inline-flex items-center gap-1.5"><i className="ri-user-line" aria-hidden="true" />{article.author}</span>
                  <span className="inline-flex items-center gap-1.5"><i className="ri-global-line" aria-hidden="true" />Orange Mushroom</span>
                </div>
                <p className="mt-6 max-w-3xl text-sm leading-7 text-foreground-700 md:text-base">{article.excerpt}</p>
              </header>

              <div className="mt-6 rounded-2xl border border-primary-200 bg-primary-50 p-4 text-sm leading-6 text-primary-950">
                <i className="ri-information-line mr-2 text-primary-600" aria-hidden="true" />
                {t('upcoming_post_source_note')}
              </div>

              <div
                className="static-article-content mt-6 overflow-hidden rounded-3xl border border-background-200 bg-background-50 p-5 text-[15px] leading-7 text-foreground-800 shadow-sm md:p-10 [&_a]:font-medium [&_a]:text-primary-700 [&_a]:underline [&_a]:underline-offset-2 [&_blockquote]:my-6 [&_blockquote]:border-l-4 [&_blockquote]:border-primary-300 [&_blockquote]:bg-primary-50 [&_blockquote]:px-5 [&_blockquote]:py-3 [&_figure]:my-8 [&_h1]:mb-4 [&_h1]:mt-12 [&_h1]:font-heading [&_h1]:text-3xl [&_h1]:font-semibold [&_h1]:text-foreground-950 [&_h2]:mb-3 [&_h2]:mt-10 [&_h2]:font-heading [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:text-foreground-950 [&_h3]:mb-3 [&_h3]:mt-8 [&_h3]:font-heading [&_h3]:text-xl [&_h3]:font-semibold [&_img]:mx-auto [&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-xl [&_li]:my-1 [&_ol]:my-5 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-5 [&_table]:my-6 [&_table]:block [&_table]:max-w-full [&_table]:overflow-x-auto [&_ul]:my-5 [&_ul]:list-disc [&_ul]:pl-6"
                dangerouslySetInnerHTML={{ __html: renderedArticleHtml }}
              />

              <footer className="mt-6 flex flex-col gap-3 rounded-2xl border border-background-200 bg-background-100 p-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-foreground-600">{t('upcoming_post_attribution', { author: article.author })}</p>
                <a
                  href={article.sourceUrl}
                  target="_blank"
                  rel="nofollow noopener noreferrer"
                  className="inline-flex min-h-11 shrink-0 items-center gap-2 font-bold text-primary-700 hover:text-primary-900"
                >
                  {t('upcoming_post_original_source')}
                  <i className="ri-external-link-line" aria-hidden="true" />
                </a>
              </footer>
            </article>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
